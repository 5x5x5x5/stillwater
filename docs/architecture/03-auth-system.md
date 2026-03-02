# Authentication System

JWT-based authentication flow covering registration, login, protected requests, and token lifecycle.

## Registration Flow

```mermaid
sequenceDiagram
    participant U as Browser
    participant A as API Client
    participant R as Auth Router
    participant S as User Service
    participant DB as Database

    U->>A: Submit register form
    A->>R: POST /api/auth/register<br/>{email, password, display_name}
    R->>S: create_user(data)
    S->>S: email.lower().strip()
    S->>S: bcrypt.hashpw(password, gensalt())
    S->>DB: INSERT users
    S->>DB: INSERT user_preferences (defaults)
    DB-->>S: User + Preferences created
    S-->>R: User object
    R-->>A: 201 {id, email, display_name}
    A-->>U: Redirect to login
```

## Login Flow

```mermaid
sequenceDiagram
    participant U as Browser
    participant A as API Client
    participant R as Auth Router
    participant S as Auth Service
    participant DB as Database

    U->>A: Submit login form
    A->>R: POST /api/auth/login<br/>{email, password}
    R->>DB: get_user_by_email(email)
    DB-->>R: User (with hashed_password)
    R->>S: verify_password(plain, hashed)
    S->>S: bcrypt.checkpw()

    alt Invalid credentials
        S-->>R: false
        R-->>A: 401 Unauthorized
    else Valid credentials
        S-->>R: true
        R->>S: create_access_token(user.id)
        S->>S: jwt.encode({sub: user_id, exp: now+7d}, SECRET, HS256)
        S-->>R: JWT token
        R-->>A: 200 {access_token, token_type: "bearer"}
        A->>A: localStorage.setItem("token", token)
        A-->>U: Redirect to home
    end
```

## Protected Request Flow

```mermaid
sequenceDiagram
    participant U as Browser
    participant A as API Client
    participant MW as CORS Middleware
    participant DI as get_current_user
    participant R as Router Handler
    participant DB as Database

    U->>A: Action requiring auth
    A->>A: Read token from localStorage
    A->>MW: GET /api/progress/summary<br/>Authorization: Bearer <token>
    MW->>DI: Pass request

    DI->>DI: Extract token from header
    DI->>DI: jwt.decode(token, SECRET, HS256)

    alt Token invalid or expired
        DI-->>A: 401 Unauthorized
        A->>A: localStorage.removeItem("token")
        A-->>U: Redirect to /login
    else Token valid
        DI->>DB: get_user_by_id(sub)
        DB-->>DI: User object

        alt User inactive
            DI-->>A: 403 Forbidden
        else User active
            DI->>R: Inject user into handler
            R->>DB: Execute business logic
            DB-->>R: Result
            R-->>A: 200 JSON response
            A-->>U: Update UI
        end
    end
```

## Token Lifecycle

```mermaid
stateDiagram-v2
    [*] --> NoToken: App loads

    NoToken --> HasToken: Login success
    NoToken --> NoToken: Register (then login)

    HasToken --> HasToken: Valid API request
    HasToken --> NoToken: 401 response (expired/invalid)
    HasToken --> NoToken: User logs out

    state HasToken {
        [*] --> Stored: localStorage.setItem
        Stored --> Injected: API request made
        Injected --> Verified: Backend decodes JWT
        Verified --> Stored: Request completes
    }
```

## JWT Token Structure

| Field | Value | Source |
|-------|-------|--------|
| `sub` | User UUID | `user.id` |
| `exp` | Unix timestamp | `now + 10080 min (7 days)` |
| Algorithm | HS256 | HMAC SHA-256 |
| Secret | `settings.SECRET_KEY` | `.env` or default |
| Library | PyJWT | `jwt.encode` / `jwt.decode` |

## Frontend Auth Integration

```mermaid
flowchart TD
    APP[App Mount] --> CHECK{Token in localStorage?}
    CHECK -->|Yes| LOAD[authStore.loadUser]
    CHECK -->|No| LOGIN[Show LoginPage]

    LOAD --> API[GET /api/auth/me]
    API -->|200| INIT[Set user + isInitialized]
    API -->|401| CLEAR[Clear token → LoginPage]

    INIT --> PREFS[Load preferences]
    PREFS --> READY[App ready]
```
