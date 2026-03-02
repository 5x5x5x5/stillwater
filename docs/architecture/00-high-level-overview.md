# Stillwater — High-Level Architecture

The repo contains two independent implementations of Stillwater, both living on `main`:

| Directory | Type | Stack |
|-----------|------|-------|
| `frontend/` | Browser app | Vite + React 19 + TypeScript + Tailwind v4 |
| `stillwater-tui/` | Terminal app | Python 3.12 + Textual 8 + pygame + aiosqlite |

Neither implementation requires a server. See [stillwater-tui/README.md](../../stillwater-tui/README.md) for the TUI architecture; the rest of this document covers the React frontend.

---

## React Frontend — System Architecture

The entire app runs in the browser — no server, no database.

## Browser Architecture

```mermaid
graph TD
    subgraph Browser["Browser"]
        RC[React Components]
        ZS[Zustand Stores]
        ST[storage.ts]
        LS[(localStorage)]
        HW[Howler.js Audio]
        MS[Media Session API]
    end

    RC -->|state| ZS
    ZS -->|read/write| ST
    ST -->|JSON| LS
    RC -->|playback| HW
    HW -->|metadata| MS
```

## Frontend Layers

```mermaid
graph LR
    subgraph Pages["Pages"]
        HP[HomePage]
        LP[LibraryPage]
        SP[SessionDetailPage]
        PP[ProgressPage]
        BP[BreathingPage]
    end

    subgraph Components["Components"]
        PB[PlayerBar]
        HC[Heatmap]
        BC[BadgeCard]
        SD[StreakDisplay]
        BX[BreathingCircle]
    end

    subgraph Stores["Zustand Stores"]
        AS[authStore]
        SS[sessionStore]
        PS[playerStore]
        PRS[progressStore]
    end

    subgraph Hooks["Audio Hooks"]
        AE[useAudioEngine]
        AM[useAmbientMixer]
        BI[useBellInterval]
        MSH[useMediaSession]
    end

    subgraph Storage["Storage Layer"]
        ST[lib/storage.ts]
        DATA[data/sessions.json]
    end

    Pages --> Components
    Pages --> Stores
    Components --> Stores
    Components --> Hooks
    Stores --> ST
    SS --> DATA
    Hooks -.->|Howler.js| EXT[Browser Audio]
```

## Cross-Cutting Concerns

| Concern | Implementation |
|---------|---------------|
| **Identity** | First-visit name prompt, stored in `localStorage` |
| **Audio Playback** | Howler.js with HTML5 audio, RAF progress loop |
| **State Management** | Zustand stores (auth, session, player, progress) |
| **Data Persistence** | `lib/storage.ts` → browser localStorage |
| **Session Data** | Static JSON (`data/sessions.json`), bundled at build time |
| **Styling** | Tailwind v4 CSS-first config, navy/lavender/sage theme |
