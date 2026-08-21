# Phase 11.9 — Search Improvements

## Overview
Global search with filters, pagination, saved searches, and recent search history.

## Components

### Search Service (`services/search_service.py`)
- Multi-type search (candidates, users, offers, onboarding)
- Pattern matching across fields
- Type-based filtering

### Saved Search Service (`services/saved_search_service.py`)
- Save search queries
- Public/private searches
- Usage count tracking
- Quick access to frequent searches

## API Endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/search?q={query}` | `search.view` |
| POST | `/api/search/saved` | `search.view` |
| GET | `/api/search/saved` | `search.view` |
| DELETE | `/api/search/saved/{id}` | `search.view` |

## Search Types

| Type | Fields Searched |
|------|-----------------|
| candidates | first_name, last_name, email, phone, application_number |
| users | full_name, email |
| offers | candidate name, position |
| onboarding | candidate name, department |

## Query Parameters
- `q` - Search query (required)
- `type` - Filter by type (candidates, users, offers, onboarding)
- `skip` - Pagination offset
- `limit` - Results per page (max 100)

## Saved Searches
- Name your search queries
- Mark as public for team access
- Track usage count
- Quick re-run saved searches
