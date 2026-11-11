# Node.js Chat Backend

REST + Socket.IO chat backend with JWT authentication, MongoDB, one-to-one/group chats, messages, typing, online status and read receipts.

## Run

1. Install MongoDB and start it.
2. Copy `.env.example` to `.env` and edit `JWT_SECRET`.
3. `npm install`
4. `npm run dev`

API base: `http://localhost:5000/api`

## REST APIs

Auth:
- POST `/api/auth/register` `{name,email,password}`
- POST `/api/auth/login` `{email,password}`
- GET `/api/auth/me` (Bearer token)

Users:
- GET `/api/users?search=abc`
- GET `/api/users/:id`

Chats:
- POST `/api/chats` `{participantIds:[id1,id2], isGroup:false, name?}`
- GET `/api/chats`
- GET `/api/chats/:chatId`
- POST `/api/chats/:chatId/members` `{userId}`
- DELETE `/api/chats/:chatId/members/:userId`

Messages:
- GET `/api/chats/:chatId/messages?page=1&limit=30`
- POST `/api/chats/:chatId/messages` `{text}`
- PUT `/api/messages/:messageId` `{text}`
- DELETE `/api/messages/:messageId`

## Socket.IO

Connect with `auth: { token }`.

Events:
- `join_chat` `{chatId}`
- `leave_chat` `{chatId}`
- `send_message` `{chatId,text}`
- `typing` `{chatId}`
- `stop_typing` `{chatId}`
- `message_read` `{chatId,messageId}`

Server events:
- `new_message`
- `user_typing`
- `user_stop_typing`
- `message_read`
- `user_online`
- `user_offline`
- `socket_error`
