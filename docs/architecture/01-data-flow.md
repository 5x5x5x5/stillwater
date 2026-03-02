# Data Flow

How user actions travel from UI interaction to persistent storage and back.

## Read Path

```mermaid
flowchart LR
    USER[User navigates to page]
    MOUNT[Component mounts]
    STORE[Zustand Store]
    STORAGE[lib/storage.ts]
    LS[(localStorage)]
    STATE[Store state updated]
    UI[UI re-renders]

    USER --> MOUNT
    MOUNT -->|"fetchAll() / fetchSessions()"| STORE
    STORE -->|"getProgressSummary() / getMeditationLogs()"| STORAGE
    STORAGE -->|"JSON.parse(localStorage.getItem(key))"| LS
    LS --> STORAGE
    STORAGE --> STORE
    STORE --> STATE
    STATE --> UI
```

## Write Path (Log a Meditation)

```mermaid
flowchart TD
    COMPLETE[Session / breathing exercise completes]
    STORE["progressStore.logMeditation(entry)"]
    APPEND["storage.appendLog(entry)"]
    NEW_LOG[Create MeditationLog with UUID + timestamp]
    WRITE_LOG["localStorage.setItem('sw_logs', JSON.stringify(logs))"]
    STREAK["storage.recalculateStreak()"]
    BADGES["storage.checkAndAwardBadges()"]
    REFRESH[Re-read all progress state]
    UI[Progress UI updates]

    COMPLETE --> STORE
    STORE --> APPEND
    APPEND --> NEW_LOG
    NEW_LOG --> WRITE_LOG
    WRITE_LOG --> STREAK
    STREAK --> BADGES
    BADGES --> REFRESH
    REFRESH --> STORE
    STORE --> UI
```

## Session Store Initialization

```mermaid
flowchart LR
    MOUNT[Component calls fetchSessions / fetchDailyPick]
    IMPORT["Static import: data/sessions.json"]
    FILTER[applyFilters — category, tag, duration, search]
    PAGE[Paginate results]
    STORE[sessionStore state updated]
    UI[Session list / daily pick renders]

    MOUNT --> IMPORT
    IMPORT --> FILTER
    FILTER --> PAGE
    PAGE --> STORE
    STORE --> UI
```

All session data is bundled into the build output at compile time. No network request is made for sessions.

## Auth Initialization

```mermaid
flowchart LR
    APP[App.tsx mounts]
    INIT["authStore.initialize()"]
    LS_CHECK{"localStorage.getItem('sw_display_name')"}
    PROMPT[Show NamePrompt component]
    SAVE["saveDisplayName(name)"]
    READY[App routes to /home]

    APP --> INIT
    INIT --> LS_CHECK
    LS_CHECK -->|null| PROMPT
    PROMPT -->|User submits| SAVE
    SAVE --> READY
    LS_CHECK -->|found| READY
```
