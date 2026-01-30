# REST API Documentation

This document describes the REST API endpoints for the eCollecto backend application.

## Base URL

All endpoints are prefixed with `/api`.

## Error Response Format

All error responses follow this standard format:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "status": 404
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `404 NOT FOUND` - Resource not found
- `500 INTERNAL SERVER ERROR` - Server error

## Endpoints

### Stamps

#### GET /api/stamps

Retrieves a list of all available stamps.

**Response:** `200 OK`

```json
[
  {
    "stamp_id": "s1974",
    "name": "Trident",
    "description": "The stamp depicts the trident...",
    "stampSKU": 1974,
    "meta": {
      "denomination": "V",
      "series": "Trident",
      "designer": "Oksana Shuklinova",
      "perforation": true,
      "stampsPerPane": 12,
      "themes": null,
      "europa": false
    },
    "release": {
      "year": 2022,
      "date": "2022-01-21",
      "printQuantity": 300000,
      "isMassIssue": false,
      "isAvailable": false
    },
    "images": {
      "original": "https://...",
      "small": "https://...",
      "pane": "https://..."
    }
  }
]
```

#### GET /api/stamp/{id}

Retrieves a specific stamp by its unique identifier.

**Parameters:**
- `id` (path) - The stamp ID (e.g., "s1974")

**Response:** `200 OK` - Stamp details <br>
**Response:** `404 NOT FOUND` - Stamp not found

```json
{
  "stamp_id": "s1974",
  "name": "Trident",
  "description": "The stamp depicts the trident...",
  "stampSKU": 1974,
  "meta": {
    "denomination": "V",
    "series": "Trident",
    "designer": "Oksana Shuklinova",
    "perforation": true,
    "stampsPerPane": 12,
    "themes": null,
    "europa": false
  },
  "release": {
    "year": 2022,
    "date": "2022-01-21",
    "printQuantity": 300000,
    "isMassIssue": false,
    "isAvailable": false
  },
  "images": {
    "original": "https://...",
    "small": "https://...",
    "pane": "https://..."
  }
}
```

### First Day Covers

#### GET /api/first-day-covers

Retrieves all registered First Day Covers (FDCs).

**Response:** `200 OK`

```json
[
  {
    "postmark_id": "pm914",
    "envelope_id": "e803",
    "name": "Trident",
    "description": "",
    "postmarkSKU": 914,
    "envelopeSKU": 803,
    "designer": "Oksana Shuklinova",
    "release": {
      "year": 2022,
      "date": "2022-01-18",
      "printQuantity": 2000
    },
    "images": {
      "envelope": "https://...",
      "postmark": "https://..."
    }
  }
]
```

#### GET /api/first-day-covers/{id}

Retrieves a specific First Day Cover (FDC) by its unique identifier.

**Parameters:**
- `id` (path) - The first day cover ID

**Response:** `200 OK` - First day cover details <br>
**Response:** `404 NOT FOUND` - First day cover not found

### Designers

#### GET /api/designers

Returns a list of all designers.

**Response:** `200 OK`

```json
[
  {
    "designer_id": "d1",
    "name": "Boris Groh"
  }
]
```

#### GET /api/designer/{id}

Retrieves a specific designer by their unique identifier.

**Parameters:**
- `id` (path) - The designer ID (e.g., "d1")

**Response:** `200 OK` - Designer details <br>
**Response:** `404 NOT FOUND` - Designer not found

### Tariffs

#### GET /api/tariffs

Returns a list of all available tariffs across years and currencies.

**Response:** `200 OK`

```json
[
  {
    "id": "tariffs:2026",
    "year": 2026,
    "updatedAt": "2026-01-01T00:00:00Z",
    "currencies": {
      "UAH": {
        "I": 0.01,
        "Z": 0.03,
        "B": 0.1
      },
      "USD": {
        "A": 1.2,
        "G": 1.2
      }
    }
  }
]
```

#### GET /api/tariffs/{year}/{currency}

Returns all tariffs for the given year and currency.

**Parameters:**
- `year` (path) - The year for which tariffs are requested (e.g., 2026)
- `currency` (path) - Tariff currency (allowed values: `UAH`, `USD`)

**Response:** `200 OK` - Map of letter-to-tariff values <br>
**Response:** `404 NOT FOUND` - Year or currency not found

```json
{
  "I": 0.01,
  "Z": 0.03,
  "B": 0.1
}
```

#### GET /api/tariffs/{year}/{currency}/{letter}

Returns a single tariff value for the given year, currency, and postal letter.

**Parameters:**
- `year` (path) - The year for which tariffs are requested (e.g., 2026)
- `currency` (path) - Tariff currency (allowed values: `UAH`, `USD`)
- `letter` (path) - Postal letter code identifying the tariff

**Response:** `200 OK` - Tariff value <br>
**Response:** `404 NOT FOUND` - Tariff not found

```json
1.2
```

## Notes

- All endpoints are read-only (GET operations only)
- Field names in responses match the frontend TypeScript interfaces exactly
- Empty lists return `[]` (empty array)
- Null values are included in responses where applicable
- The API is designed to match the existing frontend data structures to minimize frontend changes
