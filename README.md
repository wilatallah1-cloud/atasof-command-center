# ATASOF AI Command Center

Personal business command center for Atasof AI. Dark, minimal, fast.

## How it works

All data lives in `data.json` (root) and `public/data.json` (served copy). Each evening, brief Claude with the day's updates. Claude edits `data.json`, copies it to `public/data.json`, pushes to GitHub, and Netlify auto-deploys. Next morning, open the URL — everything is current.

## Local development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Deploy to Netlify

1. Push this repo to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
3. Connect your GitHub account and select this repo
4. Build settings are auto-detected from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**

Netlify will auto-deploy on every push to the main branch.

## How to brief Claude each evening

Click the **Brief Claude** button in the top bar, or paste this into Claude:

> Here are the updates from today:
>
> [Describe what happened — tasks completed, new info, decisions, anything to log]
>
> Please update data.json accordingly and push to GitHub.

### What Claude should do:

1. Open `data.json` in the repo root
2. Make the requested changes (mark tasks done, add new tasks, update goals, add log entries, etc.)
3. Copy the updated `data.json` to `public/data.json`
4. Commit and push to GitHub

### Data structure rules:

- Every task: `{ "id": "unique-id", "title": "...", "completed": false, "dueDate": "YYYY-MM-DD" (optional) }`
- Every log/note entry: `{ "date": "YYYY-MM-DD", "text": "..." }`
- Every idea: `{ "id": "unique-id", "text": "...", "project": "Outreach|Clients|AI Content SaaS|Coaching|YouTube|Other", "createdAt": "ISO-8601" }`
- Progress goals: `{ "title": "...", "current": N, "target": N }`

## Project structure

```
atasof-command-center/
├── public/
│   ├── data.json          ← served to the app
│   └── _redirects         ← Netlify SPA routing
├── src/
│   ├── components/        ← reusable UI components
│   ├── pages/             ← 7 page components
│   ├── App.jsx            ← routes
│   ├── main.jsx           ← entry point
│   └── styles.css         ← all styles
├── data.json              ← source of truth (Claude edits this)
├── netlify.toml           ← Netlify config
└── package.json
```
