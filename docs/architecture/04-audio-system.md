# Audio Player Architecture

How Howler.js audio playback, ambient mixing, bell intervals, and media session sync work together through the PlayerBar.

## Component & Hook Integration

```mermaid
flowchart TD
    subgraph PlayerBar["PlayerBar (fixed bottom)"]
        PB_UI[Progress Bar + Controls + Session Info]
    end

    subgraph Hooks["Audio Hooks"]
        AE[useAudioEngine]
        AM[useAmbientMixer]
        BI[useBellInterval]
        MS[useMediaSession]
    end

    subgraph Store["playerStore (Zustand)"]
        STATE["currentSession\nisPlaying\nprogress / elapsed / duration\nvolume\nambientSounds\nbellInterval"]
    end

    subgraph Audio["Browser Audio"]
        H1[Session Howl]
        H2[6× Ambient Howls]
        H3[Bell Howl]
        H4[navigator.mediaSession]
    end

    PlayerBar --> AE
    PlayerBar --> AM
    PlayerBar --> BI
    PlayerBar --> MS

    AE <-->|read/write| Store
    AM <-->|read| Store
    BI <-->|read| Store
    MS <-->|read| Store

    AE --> H1
    AM --> H2
    BI --> H3
    MS --> H4
```

## useAudioEngine — Session Playback

```mermaid
stateDiagram-v2
    [*] --> Idle: No session

    Idle --> Loading: play(session)
    Loading --> Ready: Howl onload
    Ready --> Playing: howl.play()
    Playing --> Paused: howl.pause()
    Paused --> Playing: howl.play()
    Playing --> Ended: howl.onend
    Playing --> Stopped: stop()
    Paused --> Stopped: stop()

    Ended --> LogMeditation: onComplete callback
    LogMeditation --> Idle: POST /api/progress/log

    state Playing {
        [*] --> RAFLoop
        RAFLoop --> RAFLoop: requestAnimationFrame
        note right of RAFLoop
            Each frame:
            seek = howl.seek()
            dur = howl.duration()
            progress = seek / dur
            setProgress(progress, seek)
        end note
    }
```

### Howl Configuration

```
new Howl({
  src: [session.audio_url]
  html5: true              ← streaming, no full download
  volume: playerStore.volume
  onload  → setDuration(howl.duration())
  onplay  → start RAF loop
  onpause → stop RAF loop
  onstop  → stop RAF loop
  onend   → stop RAF + setProgress(1) + onComplete()
})
```

### Lifecycle Rules

- **Session change** → destroy old Howl, create new one
- **Volume change** → `howl.volume(newVolume)`
- **Seek** → `howl.seek(progress × duration)`
- **Unmount** → stop, unload, cancel RAF

## useAmbientMixer — Ambient Sounds

```mermaid
flowchart TD
    INIT[Mount: Create 6 Howl instances] --> LISTEN[Watch playerStore.ambientSounds]

    LISTEN --> CHECK{For each sound}
    CHECK --> VOL_UP{targetVolume > 0?}

    VOL_UP -->|Yes, not playing| START[howl.play + fade 0→target 500ms]
    VOL_UP -->|Yes, playing| ADJUST[fade current→target 300ms]
    VOL_UP -->|No, playing| FADEOUT[fade current→0 400ms]
    FADEOUT --> STOP_DELAY[setTimeout 450ms → howl.stop]
    VOL_UP -->|No, not playing| NOOP[No action]

    START --> LISTEN
    ADJUST --> LISTEN
    STOP_DELAY --> LISTEN
```

### Ambient Sound Inventory

| Sound ID | File | Behavior |
|----------|------|----------|
| `rain` | `/audio/ambient/rain.mp3` | Loop, independent volume |
| `ocean` | `/audio/ambient/ocean.mp3` | Loop, independent volume |
| `forest` | `/audio/ambient/forest.mp3` | Loop, independent volume |
| `fire` | `/audio/ambient/fire.mp3` | Loop, independent volume |
| `wind` | `/audio/ambient/wind.mp3` | Loop, independent volume |
| `birds` | `/audio/ambient/birds.mp3` | Loop, independent volume |

All ambient Howls are created with `loop: true` and initial `volume: 0`. The `toggleAmbient` action sets volume to `0.5` or `0`.

## useBellInterval — Meditation Bells

```mermaid
flowchart TD
    BELL_HOWL["Bell Howl: /audio/bell.mp3 (volume 0.6)"]

    CHECK{bellInterval > 0<br/>AND isPlaying?}
    CHECK -->|Yes| INTERVAL["setInterval(bell.play, interval × 1000ms)"]
    CHECK -->|No| CLEAR[clearInterval]

    INTERVAL --> RING[🔔 Play bell sound]
    RING --> INTERVAL

    CLEAR --> SILENT[No bells]
```

## useMediaSession — OS Integration

```mermaid
flowchart LR
    subgraph Store["playerStore"]
        CS[currentSession]
        IP[isPlaying]
    end

    subgraph MediaSession["navigator.mediaSession"]
        META["metadata:\n  title: session.title\n  artist: instructor || 'Stillwater'\n  album: session.category\n  artwork: session.image_url"]
        ACTIONS["action handlers:\n  play → toggle()\n  pause → toggle()\n  stop → stop()"]
        PBS["playbackState:\n  isPlaying ? 'playing' : 'paused'"]
    end

    CS --> META
    IP --> PBS
    Store --> ACTIONS
```

## Completion & Logging

```mermaid
sequenceDiagram
    participant AE as useAudioEngine
    participant PB as PlayerBar
    participant API as API Client
    participant BE as Backend

    AE->>AE: howl.onend fires
    AE->>AE: completedRef check (prevent duplicates)
    AE->>AE: stop() + setProgress(1, duration)
    AE->>PB: onComplete callback

    PB->>API: POST /api/progress/log
    Note right of PB: {session_id, duration_seconds,<br/>completed: true, session_type: category}
    API->>BE: Log meditation
    BE->>BE: update_streak + check_badges
    BE-->>API: 201 Created
```
