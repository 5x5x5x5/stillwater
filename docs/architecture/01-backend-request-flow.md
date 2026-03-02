# Backend Request Flow

How an HTTP request flows through the FastAPI backend, from CORS to database and back.

## Request Pipeline

```mermaid
flowchart TD
    REQ[HTTP Request] --> CORS[CORS Middleware]
    CORS --> ROUTE{Router Match}

    ROUTE -->|/api/auth/*| AUTH_R[Auth Router]
    ROUTE -->|/api/sessions/*| SESS_R[Sessions Router]
    ROUTE -->|/api/progress/*| PROG_R[Progress Router]
    ROUTE -->|/api/health| HEALTH[Health Check]

    AUTH_R --> DEP_DB[get_db]
    SESS_R --> DEP_DB
    PROG_R --> DEP_BOTH[get_db + get_current_user]

    DEP_BOTH --> DECODE[Decode JWT]
    DECODE --> FETCH_USER[Fetch User by ID]
    FETCH_USER --> ACTIVE{is_active?}
    ACTIVE -->|No| E403[403 Forbidden]
    ACTIVE -->|Yes| HANDLER

    DEP_DB --> HANDLER[Route Handler]
    HANDLER --> SERVICE[Service Layer]
    SERVICE --> ORM[SQLAlchemy Query]
    ORM --> DB[(Database)]
    DB --> ORM
    ORM --> SERVICE
    SERVICE --> PYDANTIC[Pydantic Serialization]
    PYDANTIC --> RESP[JSON Response]
```

## Dependency Injection

```mermaid
flowchart LR
    subgraph Public["Public Endpoints"]
        REG[POST /register]
        LOG[POST /login]
        HLTH[GET /health]
    end

    subgraph Authenticated["Protected Endpoints"]
        ME[GET /me]
        PREF[GET/PUT /preferences]
        PROG[POST /log]
        SUM[GET /summary]
        HEAT[GET /heatmap]
        BADGE[GET /badges]
    end

    DB_DEP[[get_db]] --> Public
    DB_DEP --> Authenticated
    USER_DEP[[get_current_user]] --> Authenticated
```

## Router Endpoints

### Auth Router — `/api/auth`

```mermaid
flowchart LR
    subgraph auth["/api/auth"]
        direction TB
        A1["POST /register"] ---|201 Created| A1R[Create User + Preferences]
        A2["POST /login"] ---|200 OK| A2R[Verify Password → JWT]
        A3["GET /me"] ---|200 OK| A3R[Return User Profile]
        A4["GET /me/preferences"] ---|200 OK| A4R[Return Preferences]
        A5["PUT /me/preferences"] ---|200 OK| A5R[Update Preferences]
    end
```

### Sessions Router — `/api/sessions`

```mermaid
flowchart LR
    subgraph sessions["/api/sessions"]
        direction TB
        S1["GET /categories"] ---|200| S1R[Distinct Categories]
        S2["GET /tags"] ---|200| S2R[All Tags]
        S3["GET /daily"] ---|200| S3R[Daily Pick Session]
        S4["GET /"] ---|200| S4R[Paginated + Filtered List]
        S5["GET /:id"] ---|200| S5R[Single Session + Tags]
    end
```

### Progress Router — `/api/progress`

```mermaid
flowchart LR
    subgraph progress["/api/progress"]
        direction TB
        P1["POST /log"] ---|201| P1R[Log → Update Streak → Check Badges]
        P2["GET /summary"] ---|200| P2R[Totals + Streak + Badge Count]
        P3["GET /streak"] ---|200| P3R[Current & Longest Streak]
        P4["GET /heatmap"] ---|200| P4R[365-Day Activity Counts]
        P5["GET /badges"] ---|200| P5R[All Badges with Earned Flag]
    end
```

## Error Handling

| Scenario | Status | Source |
|----------|--------|--------|
| Invalid/expired JWT | 401 | `get_current_user` dependency |
| Inactive user | 403 | `get_current_user` dependency |
| Duplicate email on register | 409 | Auth router (IntegrityError) |
| Resource not found | 404 | Router handler |
| Invalid credentials | 401 | Login handler |
| Validation error | 422 | Pydantic/FastAPI auto |
