# Developer setup — QuickBite (local)

This guide helps contributors run the backend API and view the frontend locally after cloning the repo.

Prerequisites
- Node.js 18+ (recommended)
- MySQL server (if you want to use the seeded DB). For basic UI testing you can run the frontend without DB.

Start the backend API
1. Open a terminal in `server`:

```bash
cd server
npm install
npm run dev
```

By default the API listens on port `5000`. You should see a `Database Connected` log and `Listening on` output.

Serve the frontend
- Option A: Use the built-in server pages
  - Many editors provide a Live Server extension that serves `client/public` at http://127.0.0.1:5500 (or similar).
  - From VS Code you can open `client/public` in Live Server.

- Option B: Use a tiny static server (npm):

```bash
# from repo root
npx serve client/public -l 5501
# or
npx http-server client/public -p 5501
```

Open the app
- Open `http://127.0.0.1:5501/index.html` (or the port your static server uses).
- The frontend expects the API at `http://localhost:5000`. The project includes `client/public/js/quickbite-config.js` which sets `window.QUICKBITE_API_ORIGIN` to `http://localhost:5000` by default.

Quick checks if menus don't load
- Confirm the backend is running (see server console).
- In the browser DevTools → Network, check GET `/api/app/catalog` returns `200` and JSON.
- If the request returns 4xx/5xx, check `server/.env` or DB connection.

Notes
- The repo contains a public copy of `quickbite-config.js` under `client/public/js` so pages will load the config script without needing build steps.
- If you want to run the full DB-backed server, ensure your `.env` in `server` contains `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.

If you want, I can add a small NPM script that serves the frontend and starts the backend concurrently.