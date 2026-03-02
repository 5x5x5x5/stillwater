# Testing Stillwater Locally

A step-by-step guide for running the Stillwater meditation app on your machine and verifying every feature.

---

## 1. Prerequisites

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Node.js | 22 | `node -v` |
| npm | 10 | `npm -v` |

---

## 2. Initial Setup

```bash
# Navigate to the frontend directory
cd stillwater/frontend

# Install dependencies
npm install
```

---

## 3. Start the App

```bash
npm run dev
```

Open **http://localhost:5173** in your browser. On first load you'll see a name prompt — enter any name and click **Begin**.

No backend is needed. All data is stored in your browser's localStorage.

---

## 4. Test Each Feature

### 4a. First Visit — Name Prompt

1. Open **http://localhost:5173** in a fresh browser profile (or clear site data)
2. Verify the name prompt appears: "What should we call you?"
3. Enter a name and click **Begin**
4. Verify you land on `/home` and the greeting shows your name

To reset and see the prompt again, open DevTools Console and run:
```js
Object.keys(localStorage).filter(k => k.startsWith('sw_')).forEach(k => localStorage.removeItem(k));
location.reload();
```

### 4b. Session Library

1. Navigate to **http://localhost:5173/library**
2. Browse the 13 bundled sessions
3. **Filter by category** — use the category dropdown (guided, sleep_story, soundscape)
4. **Search** — type a keyword (e.g. "forest") in the search box
5. **Filter by tag** — use the tag dropdown (beginner, sleep, focus, etc.)
6. **Session detail** — click any session card to open `/sessions/:id`
7. Go to **http://localhost:5173/home** — verify the daily pick card appears ("5-Minute Breath Reset")

### 4c. Audio Player

1. Click **Play** on any session — the PlayerBar should appear at the bottom of the screen
2. Test **play/pause** toggle
3. Test **progress bar** — click or drag to seek
4. **Expand the player** — test the volume slider
5. **Ambient mixer** — toggle ambient sounds (rain, ocean, etc.)
6. **Bell interval** — set a bell interval and listen for the chime
7. Let a short session play to completion — it should auto-log to your progress

> **Note:** Audio files point to `cdn.stillwater.app` which won't resolve locally. The player UI still works for testing controls — you just won't hear actual audio unless you provide local files.

### 4d. Progress Tracking

1. Navigate to **http://localhost:5173/progress**
2. Verify the page loads with:
   - **Streak counter** (0 if no sessions logged yet)
   - **Heatmap** (empty grid for the past year)
   - **Badges** (6 badges, all unearned initially)
3. Complete a session (let it play to the end), then navigate back to Progress
4. The **"First Step"** badge (1 completed session) should now show as earned
5. Streak counter should update to 1

To manually log a session via DevTools:
```js
import('/src/lib/storage.ts').then(m => m.appendLog({
  session_id: 1,
  duration_seconds: 300,
  completed: true,
  session_type: 'guided',
}));
```

### 4e. Breathing Exercises

1. Navigate to **http://localhost:5173/breathe**
2. Three patterns are available:

   | Pattern | Cycle | Phases |
   |---------|-------|--------|
   | Box Breathing | 16s | Inhale 4s → Hold 4s → Exhale 4s → Hold 4s |
   | 4-7-8 Relaxing | 19s | Inhale 4s → Hold 7s → Exhale 8s |
   | Coherent Breathing | 11s | Inhale 5.5s → Exhale 5.5s |

3. Select **Box Breathing**
4. Set duration to **1 minute** (shortest, for quick testing)
5. Click **Start** — verify:
   - The circle animates (expanding on inhale, contracting on exhale)
   - The phase label changes (Inhale → Hold → Exhale → Hold)
   - The countdown timer ticks down
6. Click **Pause** — animation and timer should freeze
7. Click **Resume** — timing should continue from where it stopped
8. Let it complete — verify the completion summary appears and the session is logged to progress

---

## 5. Linting and Build

```bash
# ESLint
cd frontend && npm run lint

# TypeScript + production build
npm run build
```

Both should complete without errors.

---

## 6. Troubleshooting

**Port 5173 already in use**

```bash
# Find what's using the port
lsof -i :5173
# Kill it
kill -9 <PID>
```

Or start on a different port:
```bash
npm run dev -- --port 3000
```

**App shows name prompt on every load**

Check that localStorage isn't being cleared by a browser extension or privacy setting. The `sw_display_name` key must persist between page loads.

**Reset progress data**

Open DevTools → Console:
```js
Object.keys(localStorage)
  .filter(k => k.startsWith('sw_'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

Or: DevTools → Application → Storage → Clear site data.

**Frontend shows blank page**

Check the browser console for errors. Common causes:
- Wrong Node version (need 22+)
- Missing `npm install`
