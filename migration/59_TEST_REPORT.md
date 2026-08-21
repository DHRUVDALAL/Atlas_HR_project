# Phase 11.12 — Testing

## Overview
Unit tests, integration tests, API tests, and permission tests for all Phase 11 components.

## Test Categories

### Unit Tests
- Email service functions
- Template rendering
- Notification creation
- Activity logging
- Document storage
- Search functionality

### API Tests
- Email endpoints
- Notification endpoints
- Activity log endpoints
- Document storage endpoints
- BGV endpoints
- Scheduler endpoints
- Search endpoints
- Report endpoints

### Permission Tests
- RBAC enforcement for all new endpoints
- Role-based access control verification
- Cross-role permission isolation

### Workflow Tests
- Email triggers on workflow events
- Notification creation on actions
- Activity logging for all operations

## Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_email.py

# Run with coverage
pytest --cov=services --cov=routes

# Run permission tests
pytest tests/test_permissions.py
```

## Test Environment
- SQLite for unit tests
- PostgreSQL for integration tests
- Mock SMTP for email tests
- Mock BGV provider for verification tests

## Coverage Requirements
- Minimum 80% code coverage
- All new endpoints must have tests
- All permission checks must be tested
