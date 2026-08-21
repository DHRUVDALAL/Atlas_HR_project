# Phase 11.5 — Notification Center

## Overview
In-app notification system with unread counts, priority levels, categories, and real-time updates.

## Components

### Notification Model (`models/communications.py`)
- User-specific notifications
- Type-based filtering (info, warning, error, success)
- Category-based organization (system, workflow, reminder)
- Priority levels (low, normal, high, urgent)
- Read/unread tracking with timestamps

### Notification Service (`services/notification_service.py`)
- Create single/bulk notifications
- Mark as read (individual/all)
- Unread count tracking
- Delete notifications

## API Endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/notifications` | `notification.view` |
| GET | `/api/notifications/unread-count` | `notification.view` |
| PUT | `/api/notifications/{id}/read` | `notification.view` |
| PUT | `/api/notifications/read-all` | `notification.view` |
| DELETE | `/api/notifications/{id}` | `notification.view` |

## Notification Types
- **info**: General information
- **warning**: Attention required
- **error**: Error occurred
- **success**: Action completed

## Categories
- **system**: System-wide notifications
- **workflow**: Workflow event notifications
- **reminder**: Reminder notifications
- **offer**: Offer-related notifications
- **onboarding**: Onboarding-related notifications

## Priority Levels
- **low**: Informational
- **normal**: Standard priority
- **high**: Requires attention
- **urgent**: Immediate action required
