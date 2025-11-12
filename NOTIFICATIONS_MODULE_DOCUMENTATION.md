# Notifications Module Documentation

## Overview

The Notifications Module is a comprehensive system that aggregates notifications from multiple sources across the CRM system. Similar to the Todo widget, it provides a sidebar interface for users to view and manage their notifications.

## Features

### Notification Sources

The system aggregates notifications from the following sources:

1. **Reminders** - Personal calendar reminders created by users
2. **Schedule Notifications** - Lead schedules (scheduled calls/appointments)
3. **Task Assignments** - When tasks are assigned to users
4. **Task Due Dates** - Tasks due soon (for production roles)
5. **Project Assignments** - When projects are assigned to users
6. **Customer Assignments** - When customers are assigned to upsellers
7. **Payment Due** - Upcoming payment installments and recurring payments

### Role-Based Notifications

Different roles receive different types of notifications based on their responsibilities:

#### **Admin (Role ID: 1)**
- ✅ All reminder notifications
- ✅ All schedule notifications
- ✅ All task assignments
- ✅ All project assignments
- ✅ All customer assignments
- ✅ All payment due notifications

#### **Lead Scraper (Role ID: 2)**
- ✅ Reminder notifications
- ✅ Schedule notifications (leads they scheduled)

#### **Sales (Role ID: 3)**
- ✅ Reminder notifications
- ✅ Schedule notifications (leads they scheduled)
- ✅ Task assignments (if assigned)

#### **Front Sales Manager (Role ID: 4)**
- ✅ Reminder notifications
- ✅ Schedule notifications
- ✅ Task assignments
- ✅ Project assignments
- ✅ Payment due notifications

#### **Upseller (Role ID: 5)**
- ✅ Reminder notifications
- ✅ Task assignments
- ✅ Project assignments (when assigned as upseller or project manager)
- ✅ Customer assignments (when customers are assigned to them)
- ✅ Payment due notifications (for their assigned customers)

#### **Upseller Manager (Role ID: 6)**
- ✅ Reminder notifications
- ✅ Schedule notifications
- ✅ Task assignments

#### **Production Roles (Role IDs: 7-18)**
- ✅ Reminder notifications
- ✅ Task assignments
- ✅ Task due dates (tasks due within 3 days)

#### **Production Head (Role ID: 8)**
- ✅ Reminder notifications
- ✅ Task assignments
- ✅ Task due dates
- ✅ Project assignments (if assigned as project manager)

#### **Department Leads (Role IDs: 9, 11, 13, 15, 17)**
- ✅ Reminder notifications
- ✅ Task assignments
- ✅ Task due dates

#### **Department Members (Role IDs: 10, 12, 14, 16, 18)**
- ✅ Reminder notifications
- ✅ Task assignments
- ✅ Task due dates

## Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    entity_type VARCHAR(50),
    entity_id INT,
    related_user_id INT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_expires_at (expires_at)
);
```

### Notification Types

- `reminder` - Calendar reminders
- `schedule` - Scheduled leads/appointments
- `task_assigned` - Task assignment notifications
- `task_due` - Task due date warnings
- `project_assigned` - Project assignment notifications
- `customer_assigned` - Customer assignment notifications
- `payment_due` - Payment due notifications

## API Endpoints

### Get Aggregated Notifications
```
GET /api/notifications
```
Returns all aggregated notifications for the current user from all sources.

**Query Parameters:**
- `unread_only` (boolean) - Filter only unread notifications
- `type` (string) - Filter by notification type
- `limit` (number) - Limit number of results

**Response:**
```json
{
  "success": true,
  "data": [...notifications],
  "unread_count": 5,
  "total": 20
}
```

### Get Stored Notifications
```
GET /api/notifications/stored
```
Returns notifications stored in the database (persistent notifications).

### Get Unread Count
```
GET /api/notifications/unread-count
```
Returns the count of unread notifications.

### Mark Notification as Read
```
PATCH /api/notifications/:id/read
```
Marks a specific notification as read.

### Mark All as Read
```
PATCH /api/notifications/read-all
```
Marks all notifications for the current user as read.

### Delete Notification
```
DELETE /api/notifications/:id
```
Deletes a specific notification.

### Delete All Read Notifications
```
DELETE /api/notifications/read/delete-all
```
Deletes all read notifications for the current user.

## Frontend Component

### NotificationSidebar Component

**Location:** `client/src/components/NotificationSidebar.js`

**Features:**
- Fixed position toggle button (right side)
- Slide-in sidebar from right
- Filter tabs (All, Unread, Tasks, Payments)
- Real-time updates every 30 seconds
- Click notification to navigate to related entity
- Mark as read/unread
- Delete notifications
- Unread count badge

**Styling:**
- Dark gradient background
- Color-coded notification types
- Priority badges
- Unread indicators

## Integration

### PageLayout Integration

The `NotificationSidebar` component is automatically included in `PageLayout`, so it appears on all pages that use `PageLayout`.

```jsx
import NotificationSidebar from './NotificationSidebar';

<NotificationSidebar />
```

### Auto-Refresh

- Automatically refreshes every 30 seconds
- Listens for storage events for cross-tab updates
- Refreshes when notifications are marked as read

## Notification Aggregation Logic

### How It Works

1. **Aggregation**: The `NotificationService.getAggregatedNotifications()` method queries all notification sources simultaneously
2. **Role-Based Filtering**: Only relevant notifications are fetched based on the user's role
3. **Priority Calculation**: Payment due dates calculate priority based on due date (urgent if overdue, high if today, medium if upcoming)
4. **Sorting**: Notifications are sorted by creation date (newest first)

### Performance Considerations

- Queries are executed in parallel using `Promise.all()`
- Limits are applied to prevent excessive data loading
- Indexes are in place for efficient querying
- Expired notifications are automatically excluded

## Future Enhancements

1. **Real-time Push Notifications**: WebSocket integration for instant notifications
2. **Email Notifications**: Email alerts for important notifications
3. **Notification Preferences**: User-configurable notification settings
4. **Notification Sound**: Optional sound alerts
5. **Desktop Notifications**: Browser notification API integration
6. **Notification Grouping**: Group similar notifications together

## Files Created/Modified

### Backend
- `server/migrations/create_notifications_table.sql` - Database schema
- `server/services/notificationService.js` - Notification service
- `server/routes/notifications.js` - API routes
- `server/index.js` - Route registration

### Frontend
- `client/src/components/NotificationSidebar.js` - Notification sidebar component
- `client/src/components/NotificationSidebar.css` - Styling
- `client/src/components/PageLayout.js` - Component integration

## Permissions

### Module: `notifications`

**Actions:**
- `read` - View notifications (all roles)
- `update` - Mark notifications as read (all roles)
- `view` - View notification sidebar (all roles)
- `delete` - Delete notifications (admin only)

All roles are automatically assigned read, update, and view permissions. Only admin can delete notifications.

## Usage Examples

### Backend: Create a Notification

```javascript
const NotificationService = require('./services/notificationService');

await NotificationService.createNotification({
  user_id: 123,
  type: 'task_assigned',
  title: 'New task assigned',
  message: 'Task "Design Logo" has been assigned to you',
  entity_type: 'tasks',
  entity_id: 456,
  priority: 'high'
});
```

### Frontend: Check Unread Count

```javascript
const response = await api.get('/notifications/unread-count');
const unreadCount = response.data.count;
```

### Frontend: Mark All as Read

```javascript
await api.patch('/notifications/read-all');
```

## Notification Types Reference

| Type | Description | Entity Type | Shown To |
|------|-------------|-------------|----------|
| `reminder` | Calendar reminder | `reminders` | All roles |
| `schedule` | Scheduled lead/appointment | `leads` | Sales roles |
| `task_assigned` | Task assignment | `tasks` | All roles |
| `task_due` | Task due soon | `tasks` | Production roles |
| `project_assigned` | Project assignment | `projects` | Upsellers, Managers |
| `customer_assigned` | Customer assignment | `customers` | Upsellers |
| `payment_due` | Payment due | `payments` | Upsellers, Managers |

## Troubleshooting

### Notifications Not Showing

1. Check user role_id is correct in JWT token
2. Verify database queries are returning data
3. Check browser console for API errors
4. Verify notification permissions are assigned

### Performance Issues

1. Check database indexes are present
2. Review query limits and time ranges
3. Consider caching for frequently accessed data

## Migration

To set up the notifications module:

1. Run the migration:
```bash
mysql -u root -p crm_db < server/migrations/create_notifications_table.sql
```

2. Verify permissions are created:
```sql
SELECT * FROM permissions WHERE module = 'notifications';
```

3. Restart the server to load new routes

The frontend component will automatically be available on all pages using `PageLayout`.






