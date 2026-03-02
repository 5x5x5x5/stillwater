# Progress Tracking System

How meditation logs drive streak calculation, badge evaluation, and the progress dashboard.

## Log → Streak → Badges Pipeline

```mermaid
sequenceDiagram
    participant C as Component
    participant PS as progressStore
    participant ST as storage.ts
    participant LS as localStorage

    C->>PS: logMeditation({session_id, duration_seconds, completed, session_type})
    PS->>ST: appendLog(entry)

    ST->>ST: Generate id + created_at
    ST->>LS: Append to sw_logs

    ST->>ST: recalculateStreak()
    ST->>LS: Read sw_streak
    ST->>ST: Evaluate streak logic
    ST->>LS: Write updated sw_streak

    ST->>ST: checkAndAwardBadges()
    ST->>LS: Read sw_logs, sw_streak, sw_earned_badges
    ST->>ST: Evaluate each unearned badge

    loop Each unearned badge
        ST->>ST: Check requirement
        alt Requirement met
            ST->>LS: Add badge ID to sw_earned_badges
        end
    end

    ST-->>PS: appendLog returns
    PS->>ST: Re-read summary / streak / heatmap / badges
    PS->>PS: Update store state
    C->>C: UI re-renders
```

## Streak Calculation State Machine

```mermaid
stateDiagram-v2
    [*] --> NoRecord: First meditation ever

    NoRecord --> Active: Create streak\ncurrent=1, longest=1, last=today

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
    UpdateDate --> [*]: Streak saved to sw_streak
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
    START[checkAndAwardBadges called] --> FETCH_EARNED[Read sw_earned_badges]
    FETCH_EARNED --> METRICS[Compute metrics from sw_logs + sw_streak]
    METRICS --> LOOP{For each unearned badge}

    LOOP --> TYPE{requirement_type?}

    TYPE -->|total_sessions| TS[Count completed logs]
    TYPE -->|streak| SK[Read current_streak]
    TYPE -->|categories| CT[Count distinct session_types in completed logs]

    TS --> CMP{value >= requirement_value?}
    SK --> CMP
    CT --> CMP

    CMP -->|Yes| AWARD[Add badge ID to sw_earned_badges]
    CMP -->|No| SKIP[Skip badge]

    AWARD --> LOOP
    SKIP --> LOOP

    LOOP -->|Done| WRITE[Write updated sw_earned_badges to localStorage]
```

### Badge Definitions (6 types)

| ID | Name | Type | Threshold | Description |
|----|------|------|-----------|-------------|
| `first_step` | First Step | `total_sessions` | 1 | Complete your very first session |
| `dedicated` | Dedicated | `total_sessions` | 50 | Complete 50 sessions |
| `century` | Century | `total_sessions` | 100 | Complete 100 sessions |
| `week_warrior` | Week Warrior | `streak` | 7 | 7-day streak |
| `marathon` | Marathon | `streak` | 30 | 30-day streak |
| `explorer` | Explorer | `categories` | 3 | Try 3 different session types |

## Heatmap Data Generation

```mermaid
flowchart LR
    LOGS["Filter sw_logs:\ncompleted = true\ncreated_at >= today − 365d"]

    LOGS --> GROUP["Group by date (YYYY-MM-DD)\nCount entries per day"]

    GROUP --> DATA["[{date: '2026-01-15', count: 2},\n {date: '2026-01-16', count: 1},\n ...]"]

    DATA --> HEATMAP[Heatmap Component]
```

Days with zero sessions are excluded. The Heatmap component treats missing dates as count=0.

## Frontend Progress Dashboard

```mermaid
flowchart TD
    subgraph ProgressPage["Progress Page"]
        MOUNT[Mount] --> FETCH[progressStore.fetchAll]
    end

    FETCH --> ST[storage.ts]

    ST --> S1["getProgressSummary()"]
    ST --> S2["getStreak()"]
    ST --> S3["getHeatmap()"]
    ST --> S4["getBadges()"]

    S1 --> STORE[progressStore state]
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
