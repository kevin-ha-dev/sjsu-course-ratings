import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";

let POST;
let moduleId = 0;
const originalKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;
const review = {
  comment: "Useful team project, but a demanding workload.",
  overallRating: 4.5,
  difficulty: 3,
  workload: 4,
  careerRelevance: null,
  gradeLeniency: null,
  attendanceMandatory: false,
};

function request(reviews = [review]) {
  return new Request("http://localhost/api/reviews/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviews }),
  });
}

function completion(text = "Students find the team project useful, with a demanding workload.") {
  return Response.json({
    candidates: [{
      content: { role: "model", parts: [{ thought: true, text: "Hidden reasoning" }, { text }] },
      finishReason: "STOP",
      index: 0,
    }],
    usageMetadata: { promptTokenCount: 80, candidatesTokenCount: 20, totalTokenCount: 100 },
    modelVersion: "gemini-3.5-flash-lite",
  });
}

beforeEach(async () => {
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.GEMINI_MODEL;
  ({ POST } = await import(`../src/app/api/reviews/summary/route.ts?test=${moduleId++}`));
});

afterEach(() => {
  mock.restoreAll();
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.GEMINI_MODEL;
  else process.env.GEMINI_MODEL = originalModel;
});

test("returns a configuration error without calling Gemini when no key is set", async () => {
  delete process.env.GEMINI_API_KEY;
  const provider = mock.method(globalThis, "fetch", () => assert.fail("Unexpected provider call"));
  const response = await POST(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "NOT_CONFIGURED");
  assert.equal(provider.mock.callCount(), 0);
});

test("rejects invalid JSON, empty reviews, invalid scores, and oversized input", async () => {
  mock.method(globalThis, "fetch", () => assert.fail("Invalid input reached provider"));
  const invalid = [[], [null], [{ ...review, workload: 6 }], [{ ...review, overallRating: 0 }], [{ ...review, attendanceMandatory: "yes" }], [{ ...review, comment: "x".repeat(4001) }], Array(51).fill(review)];
  for (const reviews of invalid) {
    assert.equal((await POST(request(reviews))).status, 400);
  }
  const malformed = new Request("http://localhost/api/reviews/summary", { method: "POST", body: "{" });
  assert.equal((await POST(malformed)).status, 400);
  const huge = new Request("http://localhost/api/reviews/summary", { method: "POST", body: "x".repeat(262145) });
  assert.equal((await POST(huge)).status, 413);
});

test("sends only review content and ratings, and excludes thought parts from the summary", async () => {
  let sent;
  mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent");
    assert.equal(options.headers["x-goog-api-key"], "test-key");
    sent = JSON.parse(options.body);
    return completion();
  });
  const response = await POST(request([{ ...review, authorId: "private-student", professor: "Professor Name", id: "review-1" }]));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.summary, "Students find the team project useful, with a demanding workload.");
  assert.equal(result.reviewCount, 1);
  assert.deepEqual(JSON.parse(sent.contents[0].parts[0].text), { reviews: [review] });
  assert.ok(sent.systemInstruction.parts[0].text.length > 0);
  assert.ok(sent.generationConfig.maxOutputTokens <= 1024);
});

test("reuses a cached summary but regenerates after reviews change or cache expires", async () => {
  let now = 1000000;
  mock.method(Date, "now", () => now);
  const provider = mock.method(globalThis, "fetch", async () => completion());
  await POST(request());
  const cached = await POST(request());
  assert.equal((await cached.json()).cached, true);
  assert.equal(provider.mock.callCount(), 1);
  await POST(request([{ ...review, workload: 2 }]));
  assert.equal(provider.mock.callCount(), 2);
  now += 60 * 60 * 1000 + 1;
  await POST(request());
  assert.equal(provider.mock.callCount(), 3);
});

test("deduplicates simultaneous requests for the same reviews", async () => {
  const provider = mock.method(globalThis, "fetch", async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return completion();
  });
  const responses = await Promise.all([POST(request()), POST(request())]);
  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  assert.equal(provider.mock.callCount(), 1);
});

test("handles quota errors without exposing provider details and allows a later retry", async () => {
  const provider = mock.method(globalThis, "fetch", async () => Response.json({ error: { message: "private provider details test-key" } }, { status: 429 }));
  const response = await POST(request());
  assert.equal(response.status, 429);
  assert.equal((await response.json()).code, "RATE_LIMITED");
  provider.mock.mockImplementation(async () => completion());
  assert.equal((await POST(request())).status, 200);
});

test("rejects blocked, truncated, empty, and malformed provider completions", async () => {
  const invalid = [
    { promptFeedback: { blockReason: "SAFETY" } },
    { candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "An incomplete" }] } }] },
    { candidates: [{ finishReason: "STOP", content: { parts: [] } }] },
    null,
  ];
  const provider = mock.method(globalThis, "fetch", async () => completion());
  for (const body of invalid) {
    provider.mock.mockImplementation(async () => Response.json(body));
    const response = await POST(request());
    assert.equal(response.status, 502);
    assert.equal(typeof (await response.json()).error, "string");
  }
});

test("handles network failures and timeouts with a retryable error", async () => {
  const provider = mock.method(globalThis, "fetch", async () => { throw new TypeError("Connection failed"); });
  assert.equal((await POST(request())).status, 502);
  provider.mock.mockImplementation(async () => { throw new DOMException("Timed out", "TimeoutError"); });
  assert.equal((await POST(request())).status, 504);
});

test("limits new generations while still serving cached results", async () => {
  const provider = mock.method(globalThis, "fetch", async () => completion());
  for (let i = 0; i < 5; i++) {
    assert.equal((await POST(request([{ ...review, comment: `Review ${i}` }]))).status, 200);
  }
  const response = await POST(request());
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("Retry-After")) > 0);
  assert.equal((await POST(request([{ ...review, comment: "Review 0" }]))).status, 200);
  assert.equal(provider.mock.callCount(), 5);
});
