# Chat Module Documentation

## Overview

A comprehensive Slack-like chat module integrated into the CRM system. This module provides real-time messaging capabilities with channels, direct messages, file attachments, reactions, and more.

## Features

### Core Features
- **Channels**: Public and private channels for team communication
- **Direct Messages**: One-on-one conversations between users
- **File Attachments**: Upload and share files (up to 10MB)
- **Message Reactions**: Add emoji reactions to messages
- **Message Threads**: Reply to messages in threads
- **User Presence**: Show online/offline status
- **Message Editing**: Edit and delete your own messages
- **Real-time Updates**: Polling-based message updates (every 2 seconds)

### Access Control
- Role-based permissions (chat module with read, create, update, delete, view actions)
- Channel access control (public vs private channels)
- Channel member management (owners, admins, members)

## Database Schema

### Tables Created

1. **channels** - Channel information
   - `id`, `name`, `description`, `is_private`, `is_archived`, `created_by`, `created_at`, `updated_at`

2. **channel_members** - Channel membership
   - `id`, `channel_id`, `user_id`, `role`, `joined_at`, `last_read_at`

3. **messages** - Channel messages
   - `id`, `channel_id`, `user_id`, `content`, `message_type`, `parent_message_id`, `is_edited`, `is_deleted`, `created_at`, `updated_at`

4. **direct_messages** - Direct message conversations
   - `id`, `user1_id`, `user2_id`, `created_at`, `updated_at`

5. **direct_message_messages** - Direct message content
   - `id`, `direct_message_id`, `user_id`, `content`, `message_type`, `is_read`, `read_at`, `is_edited`, `is_deleted`, `created_at`, `updated_at`

6. **message_attachments** - File attachments
   - `id`, `message_id`, `direct_message_id`, `file_name`, `file_path`, `file_type`, `file_size`, `uploaded_by`, `created_at`

7. **message_reactions** - Message reactions (emoji)
   - `id`, `message_id`, `direct_message_id`, `user_id`, `emoji`, `created_at`

8. **message_threads** - Threaded replies
   - `id`, `message_id`, `user_id`, `content`, `is_edited`, `is_deleted`, `created_at`, `updated_at`

9. **user_presence** - User online/offline status
   - `user_id`, `status`, `last_seen_at`

## API Endpoints

### Channels

- `GET /api/chat/channels` - Get all channels user has access to
- `GET /api/chat/channels/:id` - Get single channel details
- `POST /api/chat/channels` - Create new channel
- `PUT /api/chat/channels/:id` - Update channel
- `PATCH /api/chat/channels/:id/archive` - Archive channel
- `POST /api/chat/channels/:id/members` - Add member to channel
- `DELETE /api/chat/channels/:id/members/:memberId` - Remove member from channel

### Messages

- `GET /api/chat/channels/:id/messages` - Get messages in channel
- `POST /api/chat/channels/:id/messages` - Send message to channel
- `PUT /api/chat/messages/:id` - Update message
- `DELETE /api/chat/messages/:id` - Delete message (soft delete)

### Message Reactions

- `POST /api/chat/messages/:id/reactions` - Add reaction to message
- `DELETE /api/chat/messages/:id/reactions/:reactionId` - Remove reaction

### Message Threads

- `GET /api/chat/messages/:id/threads` - Get thread replies
- `POST /api/chat/messages/:id/threads` - Add thread reply

### Direct Messages

- `GET /api/chat/direct-messages` - Get all DM conversations
- `POST /api/chat/direct-messages` - Get or create DM conversation
- `GET /api/chat/direct-messages/:id/messages` - Get messages in DM
- `POST /api/chat/direct-messages/:id/messages` - Send message to DM

### Users

- `GET /api/chat/users` - Get all users (with presence)
- `PATCH /api/chat/users/presence` - Update user presence

## Frontend Components

### Main Component
- **Chat.js** - Main chat page component with Slack-like UI

### Features
- Sidebar with channels and direct messages
- Channel/DM list with unread badges
- Message list with timestamps
- Message composer with file upload
- User presence indicators
- Reaction buttons
- Create channel modal

## Installation

### 1. Run Database Migration

```bash
# Run the migration SQL file
mysql -u your_user -p your_database < server/migrations/create_chat_tables.sql
```

Or manually execute the SQL file in your MySQL client.

### 2. Verify Permissions

The migration automatically creates chat permissions and assigns them to all roles. Verify:

```sql
SELECT * FROM permissions WHERE module = 'chat';
SELECT * FROM role_permissions WHERE permission_id IN 
  (SELECT id FROM permissions WHERE module = 'chat');
```

### 3. Start Server

The chat routes are automatically registered in `server/index.js`. Make sure the server is running:

```bash
cd server
npm start
```

### 4. Access Chat

Navigate to `/chat` in the application. The chat menu item will appear in the sidebar if the user has chat permissions.

## Usage

### Creating a Channel

1. Click "Create Channel" button in the sidebar
2. Enter channel name (required)
3. Optionally add description
4. Check "Private channel" if you want it to be private
5. Click "Create"

### Sending Messages

1. Select a channel or direct message
2. Type your message in the input field
3. Optionally attach a file by clicking the 📎 button
4. Press Enter or click "Send"

### Adding Reactions

1. Hover over a message
2. Click "Add reaction" button
3. Select an emoji (default: 👍)

### Starting Direct Messages

1. Switch to "Direct" tab in sidebar
2. Scroll to "Start a conversation" section
3. Click on a user to start a conversation

## Permissions

The chat module uses the following permissions:
- `chat:read` - View channels and messages
- `chat:create` - Create channels and send messages
- `chat:update` - Edit messages and update presence
- `chat:delete` - Delete messages
- `chat:view` - Access chat module

All roles have read, create, update, and view permissions by default. Only admins have delete permission.

## File Uploads

- Files are stored in `server/uploads/chat/`
- Maximum file size: 10MB
- All file types are allowed
- Files are served statically at `/uploads/chat/`

## Real-time Updates

Currently, the chat uses polling (every 2 seconds) for real-time updates. For production, consider implementing WebSockets for true real-time messaging.

## Future Enhancements

- [ ] WebSocket integration for real-time messaging
- [ ] Message search functionality
- [ ] Message mentions (@username)
- [ ] Channel notifications
- [ ] Message formatting (markdown, bold, italic)
- [ ] Image preview in chat
- [ ] Voice messages
- [ ] Screen sharing
- [ ] Video calls

## Troubleshooting

### Messages not appearing
- Check browser console for errors
- Verify user has chat permissions
- Check if channel is private and user is a member

### File uploads failing
- Check file size (max 10MB)
- Verify `server/uploads/chat/` directory exists and is writable
- Check server logs for errors

### Presence not updating
- Presence updates automatically every 30 seconds
- Manually update presence by switching tabs/windows

## Security Considerations

- All routes require authentication (`auth` middleware)
- All routes require chat permissions (`authorize` middleware)
- Private channels are access-controlled
- Users can only edit/delete their own messages (unless admin)
- File uploads are validated for size
- File paths are sanitized to prevent directory traversal

## Integration with Notification System

The chat module can be integrated with the existing notification system to send notifications for:
- New messages in channels
- Direct messages
- Mentions (@username)
- Channel invitations

See `NOTIFICATIONS_MODULE_DOCUMENTATION.md` for details on how to integrate.

