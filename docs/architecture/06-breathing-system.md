# Breathing Exercise System

State machine, timing engine, and animation pipeline for guided breathing exercises.

## Pattern Definitions

```mermaid
flowchart LR
    subgraph Box["Box Breathing (16s cycle)"]
        B1[Inhale 4s] --> B2[Hold 4s] --> B3[Exhale 4s] --> B4[Hold 4s] --> B1
    end

    subgraph FourSevenEight["4-7-8 Relaxing (19s cycle)"]
        F1[Inhale 4s] --> F2[Hold 7s] --> F3[Exhale 8s] --> F1
    end

    subgraph Coherent["Coherent Breathing (11s cycle)"]
        C1[Inhale 5.5s] --> C2[Exhale 5.5s] --> C1
    end
```

### Pattern Data Structure

```
BreathingPattern {
  id: string           // 'box' | '478' | 'coherent'
  name: string
  description: string
  phases: BreathingPhase[]
}

BreathingPhase {
  name: 'Inhale' | 'Hold' | 'Exhale'
  duration: number     // seconds (supports decimals: 5.5)
}
```

## Exercise State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: Component mounts

    Idle --> Active: User clicks "Begin"
    Active --> Paused: User clicks "Pause"
    Paused --> Active: User clicks "Resume"
    Active --> Complete: totalElapsed >= durationMinutes × 60
    Paused --> Idle: User clicks "End"
    Active --> Idle: User clicks "End"

    Complete --> [*]: User clicks "Done" → onDone()

    state Active {
        [*] --> RAFTick
        RAFTick --> RAFTick: requestAnimationFrame
        note right of RAFTick
            Every frame:
            elapsed = now - startTime - pauseOffset
            cycleElapsed = elapsed % cycleDuration
            → determine phaseIndex + phaseProgress
        end note
    }

    state Complete {
        [*] --> LogMeditation: storage.appendLog()
        LogMeditation --> ShowSummary: cycles completed + duration
    }
```

## RAF Timing Engine

```mermaid
flowchart TD
    TICK[requestAnimationFrame tick] --> ELAPSED["elapsed = performance.now() - startTime - pauseOffset"]

    ELAPSED --> DONE{elapsed >= totalDuration?}
    DONE -->|Yes| COMPLETE[isComplete = true<br/>storage.appendLog() + onComplete]

    DONE -->|No| CYCLE["cycleDuration = sum(phases[*].duration)<br/>cycleElapsed = elapsed % cycleDuration<br/>cycleCount = floor(elapsed / cycleDuration)"]

    CYCLE --> PHASE["Walk phases array:<br/>accumulate durations until<br/>cycleElapsed < accumulated"]

    PHASE --> INDEX["currentPhaseIndex = i<br/>phaseElapsed = cycleElapsed - prevAccumulated"]

    INDEX --> PROGRESS["phaseProgress = phaseElapsed / phase.duration<br/>(0.0 → 1.0)"]

    PROGRESS --> STATE["Update state:<br/>currentPhase, phaseProgress,<br/>cycleCount, totalElapsed"]

    STATE --> NEXT[Schedule next RAF tick]
```

### Pause/Resume Precision

```
Pause:
  pauseStartRef = performance.now()
  cancel RAF

Resume:
  pauseOffsetRef += performance.now() - pauseStartRef
  pauseStartRef = null
  restart RAF
```

Accumulated pause time is subtracted from elapsed, so the breathing cycle resumes exactly where it left off.

## BreathingCircle Animation

```mermaid
flowchart TD
    subgraph Input["From useBreathingEngine"]
        PHASE[currentPhase.name]
        PROG[phaseProgress 0→1]
        ACT[isActive]
    end

    PHASE --> SCALE{Phase?}
    SCALE -->|Inhale| S_IN["scale = 1.0 + progress × 0.6<br/>(1.0 → 1.6)"]
    SCALE -->|Hold| S_HOLD["scale = 1.6<br/>(constant)"]
    SCALE -->|Exhale| S_EX["scale = 1.6 - progress × 0.6<br/>(1.6 → 1.0)"]

    PHASE --> COLOR{Phase?}
    COLOR -->|Inhale| C_IN["lavender<br/>rgba(196,181,224)"]
    COLOR -->|Hold| C_HOLD["sage<br/>rgba(168,197,160)"]
    COLOR -->|Exhale| C_EX["sand<br/>rgba(245,230,204)"]

    S_IN --> SPRING["Framer Motion useSpring<br/>stiffness: 60, damping: 20"]
    S_HOLD --> SPRING
    S_EX --> SPRING
    C_IN --> RENDER
    C_HOLD --> RENDER
    C_EX --> RENDER

    SPRING --> RENDER["BreathingCircle<br/>280×280 container"]

    subgraph Render["Rendered Layers"]
        OUTER["Outer ring (glow pulse)<br/>scale × 1.15–1.4, 25% opacity"]
        MAIN["Main circle<br/>border + fill, phase color 50% opacity"]
        TEXT["Center text<br/>phase name + remaining seconds"]
    end

    RENDER --> OUTER
    RENDER --> MAIN
    RENDER --> TEXT
```

## Full Exercise Flow

```mermaid
sequenceDiagram
    participant U as User
    participant BE as BreathingExercise
    participant ENG as useBreathingEngine
    participant BC as BreathingCircle
    participant ST as storage.ts

    U->>BE: Select pattern + duration
    BE->>ENG: Initialize with pattern, durationMinutes

    U->>BE: Click "Begin"
    BE->>ENG: start()
    ENG->>ENG: startTime = performance.now()

    loop Every animation frame
        ENG->>ENG: Calculate elapsed, phase, progress
        ENG->>BC: currentPhase, phaseProgress
        BC->>BC: Update scale + color via spring
    end

    opt User pauses
        U->>BE: Click "Pause"
        BE->>ENG: pause()
        ENG->>ENG: Record pauseStart, cancel RAF
        U->>BE: Click "Resume"
        BE->>ENG: resume()
        ENG->>ENG: Add pause offset, restart RAF
    end

    ENG->>ENG: elapsed >= total duration
    ENG->>ST: appendLog({duration_seconds, session_type: 'breathing', completed: true})
    ST->>ST: recalculateStreak() + checkAndAwardBadges()
    ENG->>BE: onComplete()
    BE->>U: Show completion summary<br/>(cycles + duration)
    U->>BE: Click "Done"
    BE->>U: Close modal → onDone()
```

## Timer Display

```
timeRemaining = (durationMinutes × 60) - floor(totalElapsed)
display = formatTime(timeRemaining)    → "4:32" (M:SS)
```

Large serif font, centered below the breathing circle, counting down to zero.
