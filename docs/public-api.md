# CURRENT Public API (v1)

This is the first public developer API surface for CURRENT.

It is intentionally small, studio-scoped, and read-focused. It is designed for:
- website and booking integrations
- BI/reporting pulls
- custom automations
- syncing teachers, clients, class types, and schedules into external systems

## Base URL

Production:
- `https://www.thecurrent.app/api/public/v1`

## Authentication

Use a studio-scoped API key in either header:
- `x-api-key: cur_pk_...`
- `Authorization: Bearer cur_pk_...`

API keys are:
- scoped per studio
- hashed at rest
- revocable
- optionally expiring
- limited by explicit scopes

## Available scopes

- `studio.read`
- `teachers.read`
- `clients.read`
- `class-types.read`
- `sessions.read`

A key must include the matching scope for each endpoint.

## Creating and managing API keys

Studio owners can manage keys via the internal authenticated routes:

- `GET /api/studio/public-api/keys`
- `POST /api/studio/public-api/keys`
- `PATCH /api/studio/public-api/keys/:keyId`

### Create key request

`POST /api/studio/public-api/keys`

```json
{
  "name": "Zapier Sync",
  "scopes": ["studio.read", "sessions.read", "clients.read"],
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

### Create key response

```json
{
  "key": {
    "id": "ck...",
    "name": "Zapier Sync",
    "prefix": "cur_pk_ab12cd34ef56",
    "scopes": ["studio.read", "sessions.read", "clients.read"],
    "isActive": true,
    "lastUsedAt": null,
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z"
  },
  "apiKey": "cur_pk_ab12cd34ef56_...",
  "warning": "This is the only time the full API key will be shown. Store it securely."
}
```

### Revoke or reactivate a key

`PATCH /api/studio/public-api/keys/:keyId`

```json
{
  "action": "revoke"
}
```

or

```json
{
  "action": "activate"
}
```

## Endpoints

### 1. Get studio

`GET /studio`

Required scope:
- `studio.read`

Response:

```json
{
  "data": {
    "id": "studio_id",
    "name": "Reformed",
    "subdomain": "reformed-ukauseed1",
    "primaryColor": "#111111",
    "currency": "gbp"
  }
}
```

### 2. List teachers

`GET /teachers?limit=50&active=true`

Required scope:
- `teachers.read`

Query params:
- `limit` optional, max `100`
- `active` optional, defaults to `true`

Response:

```json
{
  "data": [
    {
      "id": "teacher_id",
      "firstName": "Thomas",
      "lastName": "McCaffery",
      "email": "teacher@example.com",
      "isActive": true,
      "specialties": ["Reformer Beginner"],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": {
    "limit": 50
  }
}
```

### 3. List clients

`GET /clients?limit=50&search=niamh`

Required scope:
- `clients.read`

Query params:
- `limit` optional, max `100`
- `search` optional, matches first name, last name, or email

Response:

```json
{
  "data": [
    {
      "id": "client_id",
      "firstName": "Niamh",
      "lastName": "Quinn",
      "email": "client@example.com",
      "phone": "+447...",
      "isActive": true,
      "credits": 4,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": {
    "limit": 50,
    "search": "niamh"
  }
}
```

### 4. List class types

`GET /class-types?limit=50&active=true`

Required scope:
- `class-types.read`

Query params:
- `limit` optional, max `100`
- `active` optional, defaults to `true`

Response:

```json
{
  "data": [
    {
      "id": "class_type_id",
      "name": "Reformer Beginner",
      "description": null,
      "duration": 60,
      "capacity": 10,
      "price": 17,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": {
    "limit": 50
  }
}
```

### 5. List sessions

`GET /sessions?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.000Z&limit=100`

Required scope:
- `sessions.read`

Query params:
- `from` optional ISO datetime, defaults to now
- `to` optional ISO datetime
- `limit` optional, max `100`
- `classTypeId` optional
- `teacherId` optional
- `locationId` optional

Response:

```json
{
  "data": [
    {
      "id": "session_id",
      "startTime": "...",
      "endTime": "...",
      "capacity": 10,
      "bookedCount": 8,
      "remainingSpots": 2,
      "notes": null,
      "classType": {
        "id": "class_type_id",
        "name": "Reformer Beginner",
        "duration": 60,
        "price": 17
      },
      "teacher": {
        "id": "teacher_id",
        "firstName": "Thomas",
        "lastName": "McCaffery",
        "email": "teacher@example.com"
      },
      "location": {
        "id": "location_id",
        "name": "Enniskillen",
        "address": "1 The Diamond",
        "city": "Enniskillen",
        "state": "",
        "zipCode": "BT74 7EQ"
      }
    }
  ],
  "meta": {
    "limit": 100,
    "from": "2026-03-01T00:00:00.000Z",
    "to": "2026-03-31T23:59:59.000Z"
  }
}
```

## Error responses

Common responses:

- `401` Missing or invalid API key
- `403` Key inactive, expired, or missing required scope
- `404` Resource not found
- `500` Internal server error

Typical error body:

```json
{
  "error": "Insufficient API scope"
}
```

## Security notes

This API is intentionally isolated from the internal app routes.

Security controls in place:
- API keys are hashed at rest
- keys are tenant-scoped to a single studio
- scope checks happen on every request
- optional expiry is enforced
- keys can be revoked without rotating the studio account
- responses are marked `no-store`

Recommended client-side practice:
- never expose secret API keys in browser JavaScript
- use them server-to-server only
- rotate keys regularly
- create separate keys per integration
- give each key the minimum scopes it needs

## Versioning

All public endpoints live under:
- `/api/public/v1`

Future breaking changes should ship under:
- `/api/public/v2`
