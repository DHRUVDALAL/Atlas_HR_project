# Phase 11.4 — Background Verification API

## Overview
Provider-agnostic background verification system with mock provider and extensible architecture.

## Components

### BGV Service (`services/bgv_service.py`)
- Provider abstraction layer
- Mock provider for testing
- Category-based verification
- Status tracking

## API Endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/bgv/onboarding/{id}` | `onboarding.view` |
| POST | `/api/bgv/verify/{id}` | `onboarding.verify` |
| GET | `/api/bgv/providers` | `onboarding.view` |

## Verification Categories

| Category | Description |
|----------|-------------|
| employment | Employment history verification |
| education | Educational qualification verification |
| identity | Identity document verification |
| address | Address verification |
| police | Police clearance verification |

## Providers

### Mock Provider
- Default provider for testing
- Returns "cleared" status for all checks
- No external API calls

### Future Providers
- API-based providers can be added by:
  1. Creating a new class inheriting `BGVProvider`
  2. Implementing verification methods
  3. Registering in `PROVIDERS` dict

## Status Values
- `pending` - Not yet verified
- `in_progress` - Verification in progress
- `cleared` - Verification passed
- `failed` - Verification failed
- `discrepancy` - Issues found

## Environment Variables
```env
BGV_PROVIDER=mock
```
