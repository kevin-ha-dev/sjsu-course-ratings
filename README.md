# SJSU Course Ratings

Find and rate San Jose State University courses.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## AI Review Summaries

Add a [Google AI Studio API key](https://aistudio.google.com/apikey) to `.env.local`:

```dotenv
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Restart the dev server, open `/courses/cs-160`, and select **Generate summary**.
The server calls the [Gemini generateContent API](https://ai.google.dev/api/generate-content).
The key stays on the server; do not prefix it with `NEXT_PUBLIC_`.
Without a key, the page displays a configuration error when generation is requested.

Summaries use the first 50 displayed reviews, with up to 4,000 characters per comment
and a 256 KiB request limit. Only comments and ratings are sent, with author IDs and
professor fields omitted. Personal details written inside comments are still sent.
Google's [free tier](https://ai.google.dev/gemini-api/docs/pricing) has usage limits
and may use submitted content to improve its products.

The demo caches successful summaries for one hour (up to 100 entries), combines
simultaneous identical requests, and allows five new generations per minute per
server process. Editing reviews clears the displayed summary. The cache and limit
reset on server restart and are not shared across deployments or server instances.
Before a public deployment, load reviews from the database and use authentication
and shared storage for caching and rate limits. Reviews currently live in browser
state and reset on reload.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Test the summary endpoint with simulated Gemini responses (Node 22.6+) |
