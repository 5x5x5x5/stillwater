# Progress Tracking System

How meditation logs drive streak calculation, badge evaluation, and the progress dashboard.

## Log → Streak → Badges Pipeline

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Progress Router
    participant S as Progress Service
    participant DB as Database

    C->>R: POST /api/progress/log<br/>{session_id, duration_seconds, completed, session_type}
    R->>S: log_meditation(db, user_id, data)

    S->>DB: INSERT meditation_logs
    DB-->>S: MeditationLog created

    S->>S: update_streak(db, user_id)
    S->>DB: SELECT streaks WHERE user_id
    DB-->>S: Streak record (or None)

    alt No streak record
        S->>DB: INSERT streaks (current=1, longest=1, last=today)
    else Has streak record
        S->>S: Evaluate streak logic
        S->>DB: UPDATE streaks
    end

    S->>S: check_badges(db, user_id)
    S->>DB: SELECT all badges
    S->>DB: SELECT user_badges WHERE user_id
    S->>DB: COUNT meditation_logs (total_sessions)
    S->>DB: SELECT current_streak
    S->>DB: COUNT DISTINCT session_type (categories)

    loop Each unearned badge
        S->>S: Evaluate requirement
        alt Requirement met
            S->>DB: INSERT user_badges
        end
    end

    S->>DB: COMMIT all changes
    S-->>R: MeditationLog
    R-->>C: 201 Created
```

## Streak Calculation State Machine

```mermaid
stateDiagram-v2
    [*] --> NoRecord: First meditation ever

    NoRecord --> Active: Create streak<br/>current=1, longest=1, last=today

    state Active {
        [*] --> Evaluate

        Evaluate --> SameDay: last_meditation_date == today
        Evaluate --> Consecutive: last_meditation_date == yesterday
        Evaluate --> GapDetected: last_meditation_date < yesterday

        SameDay --> NoChange: Keep current streak unchanged
        Consecutive --> Increment: current_streak += 1
        GapDetected --> Reset: current_streak = 1
    }

    NoChange --> UpdateDate: last_meditation_date = today
    Increment --> CheckRecord: Update longest if current > longest
    Reset --> UpdateDate

    CheckRecord --> UpdateDate
    UpdateDate --> [*]: Streak saved
```

### Streak Examples

| Day | Action | current | longest | last_date |
|-----|--------|---------|---------|-----------|
| Mon | Log | 1 | 1 | Mon |
| Tue | Log | 2 | 2 | Tue |
| Tue | Log again | 2 | 2 | Tue |
| Wed | Skip | — | — | — |
| Thu | Log | 1 | 2 | Thu |
| Fri | Log | 2 | 2 | Fri |
| Sat | Log | 3 | 3 | Sat |

## Badge Evaluation

```mermaid
flowchart TD
    START[check_badges called] --> FETCH_ALL[Fetch all badge definitions]
    FETCH_ALL --> FETCH_EARNED[Fetch user's earned badge IDs]
    FETCH_EARNED --> LOOP{For each unearned badge}

    LOOP --> TYPE{requirement_type?}

    TYPE -->|total_sessions| TS[Count completed MeditationLogs]
    TYPE -->|streak| SK[Read current_streak]
    TYPE -->|categories| CT[Count distinct session_types]

    TS --> CMP{value >= requirement_value?}
    SK --> CMP
    CT --> CMP

    CMP -->|Yes| AWARD[INSERT user_badges row]
    CMP -->|No| SKIP[Skip badge]

    AWARD --> LOOP
    SKIP --> LOOP

    LOOP -->|Done| COMMIT[Commit transaction]
```

### Badge Definitions (6 types)

| Badge | Type | Threshold | Description |
|-------|------|-----------|-------------|
| Novice Meditator | `total_sessions` | 1 | Complete first meditation |
| Dedicated Practitioner | `total_sessions` | 10 | Complete 10 meditations |
| Meditation Master | `total_sessions` | 50 | Complete 50 meditations |
| Streak Starter | `streak` | 3 | 3-day streak |
| Streak Champion | `streak` | 7 | 7-day streak |
| Explorer | `categories` | 3 | Try 3 different categories |

## Heatmap Data Generation

```mermaid
flowchart LR
    QUERY["SELECT date(created_at), COUNT(*)<br/>FROM meditation_logs<br/>WHERE user_id = ?<br/>AND created_at >= today - 365d<br/>GROUP BY date(created_at)<br/>ORDER BY date ASC"]

    QUERY --> DATA["[{date: '2026-01-15', count: 2},<br/> {date: '2026-01-16', count: 1},<br/> ...]"]

    DATA --> HEATMAP[Heatmap Component]
```

## Frontend Progress Dashboard

```mermaid
flowchart TD
    subgraph ProgressPage["Progress Page"]
        MOUNT[Mount] --> FETCH[progressStore.fetchAll]
    end

    FETCH --> PAR["Parallel API calls"]

    PAR --> S1["GET /summary"]
    PAR --> S2["GET /streak"]
    PAR --> S3["GET /heatmap"]
    PAR --> S4["GET /badges"]

    S1 --> STORE[progressStore]
    S2 --> STORE
    S3 --> STORE
    S4 --> STORE

    STORE --> SD[StreakDisplay]
    STORE --> STATS[Summary Stats]
    STORE --> HM[Heatmap]
    STORE --> BG[Badge Grid]

    subgraph StreakDisplay["StreakDisplay"]
        CS["current_streak 🔥"]
        LS["longest_streak (dimmed)"]
    end

    subgraph Heatmap["Heatmap (SVG)"]
        GRID["52 weeks × 7 days grid"]
        COLORS["0: navy-dark\n1: dark sage\n2: medium sage\n3-4: light sage\n5+: bright sage"]
        TIP[Hover tooltip: date + count]
    end

    subgraph BadgeGrid["Badge Grid"]
        EARNED["Earned: lavender bg, green ✓"]
        LOCKED["Locked: grayscale, 50% opacity"]
    end
```
