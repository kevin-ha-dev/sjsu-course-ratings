import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

const modules = {
  "next/server": "export const NextResponse = { json: (body, options) => Response.json(body, options) };",
  "@/lib/supabase/server": `
    export function accessTokenFrom(request) {
      return request.headers.get("authorization")?.replace(/^Bearer /i, "") ?? null;
    }
    export function createClient(token) {
      globalThis.reviewApi.token = token;
      return {
        auth: { getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }) },
        rpc(name, args) {
          globalThis.reviewApi.calls.push({ table: name, methods: [["rpc", args]] });
          return Promise.resolve(globalThis.reviewApi.responses.shift());
        },
        from(table) {
          const call = { table, methods: [] };
          globalThis.reviewApi.calls.push(call);
          const query = {
            select(value) { call.methods.push(["select", value]); return this; },
            eq(...values) { call.methods.push(["eq", ...values]); return this; },
            ilike(...values) { call.methods.push(["ilike", ...values]); return this; },
            in(...values) { call.methods.push(["in", ...values]); return this; },
            order(...values) { call.methods.push(["order", ...values]); return this; },
            limit(...values) { call.methods.push(["limit", ...values]); return this; },
            update(value) { call.methods.push(["update", value]); return this; },
            single() { call.methods.push(["single"]); return Promise.resolve(globalThis.reviewApi.responses.shift()); },
            maybeSingle() { call.methods.push(["maybeSingle"]); return Promise.resolve(globalThis.reviewApi.responses.shift()); },
            then(resolve, reject) { return Promise.resolve(globalThis.reviewApi.responses.shift()).then(resolve, reject); },
          };
          return query;
        },
      };
    }
  `,
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier in modules) {
      return { url: `data:text/javascript,${encodeURIComponent(modules[specifier])}`, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { GET, POST, PATCH } = await import("../src/app/api/reviews/route.ts");

const row = {
  id: 7,
  user_id: "user-1",
  created_at: "2026-11-09T03:30:00+00:00",
  updated_at: "2026-11-09T18:20:00+00:00",
  overall_rating: 4.5,
  difficulty_rating: 3,
  workload_rating: 4,
  career_relevance: null,
  grade_leniency: null,
  attendance_mandatory: true,
  comment: "Useful class",
  course_offerings: {
    professors: { name: "Professor A" },
    courses: { department: "CS", course_number: "160", title: "Software Engineering" },
  },
};

const values = {
  courseCode: "CS 160",
  courseTitle: "Software Engineering",
  professor: "Professor A",
  overallRating: 4.5,
  difficulty: 3,
  workload: 4,
  careerRelevance: null,
  gradeLeniency: null,
  attendanceMandatory: true,
  comment: "Useful class",
};

function setup(...responses) {
  globalThis.reviewApi = { calls: [], responses, token: null };
  return globalThis.reviewApi;
}

function request(method, body) {
  return new Request("http://localhost/api/reviews", {
    method,
    headers: { authorization: "Bearer token", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("course and dashboard reads include database timestamps", async () => {
  let mock = setup({ data: [{ id: 4 }], error: null }, { data: [row], error: null });
  let response = await GET(new Request("http://localhost/api/reviews?course=CS%20160"));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).reviews[0], {
    id: "7", authorId: "user-1", createdAt: row.created_at, editedAt: row.updated_at,
    overallRating: 4.5, difficulty: 3, workload: 4, careerRelevance: null,
    gradeLeniency: null, attendanceMandatory: true, professor: "Professor A", comment: "Useful class",
  });
  assert.match(mock.calls[1].methods[0][1], /created_at,\s*updated_at/);
  assert.deepEqual(mock.calls[1].methods.at(-1), ["order", "created_at", { ascending: false }]);

  mock = setup({ data: [row], error: null });
  response = await GET(new Request("http://localhost/api/reviews?mine=1", { headers: { authorization: "Bearer token" } }));
  assert.equal(response.status, 200);
  const dashboard = (await response.json()).reviews[0];
  assert.equal(dashboard.createdAt, row.created_at);
  assert.equal(dashboard.editedAt, row.updated_at);
  assert.deepEqual(mock.calls[0].methods[1], ["eq", "user_id", "user-1"]);
});

test("posting returns database timestamps and never sends client timestamps", async () => {
  const mock = setup({ data: 7, error: null }, { data: { ...row, updated_at: null }, error: null });
  const response = await POST(request("POST", { ...values, createdAt: "fake", editedAt: "fake" }));
  assert.equal(response.status, 201);
  const review = (await response.json()).review;
  assert.equal(review.createdAt, row.created_at);
  assert.equal(review.editedAt, null);
  assert.equal(mock.token, "token");
  assert.equal(Object.keys(mock.calls[0].methods[0][1]).some((key) => key.includes("time") || key.includes("created")), false);
});

test("editing filters by owner and returns the database edit timestamp", async () => {
  const mock = setup({ data: [{ id: 4 }], error: null }, { data: row, error: null });
  const response = await PATCH(request("PATCH", { ...values, id: 7, editedAt: "fake" }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).review.editedAt, row.updated_at);
  const update = mock.calls[1].methods;
  assert.deepEqual(update.filter(([name]) => name === "eq"), [["eq", "id", 7], ["eq", "user_id", "user-1"]]);
  assert.equal("updated_at" in update[0][1], false);
  assert.equal("created_at" in update[0][1], false);
});

test("editing requires authentication", async () => {
  const mock = setup();
  const response = await PATCH(new Request("http://localhost/api/reviews", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...values, id: 7 }),
  }));
  assert.equal(response.status, 401);
  assert.equal(mock.calls.length, 0);
});
