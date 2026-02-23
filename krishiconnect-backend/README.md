# KrishiConnect Backend

Production-grade social platform backend for Indian farmers.

## Prerequisites

- Node.js 18+
- MongoDB 7+
- Redis 7+ (optional, for OTP/caching)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Start MongoDB and Redis (or use Docker)
# docker-compose up -d mongo redis

# Run development server
npm run dev
```

## API Endpoints

### Auth (`/api/v1/auth`)
- `POST /register` - Register with phone, sends OTP
- `POST /verify-otp` - Verify OTP, complete registration
- `POST /login` - Login with phone + password
- `POST /refresh-token` - Refresh access token
- `POST /logout` - Logout (requires auth)

### Users (`/api/v1/users`)
- `GET /me` - Get current user profile
- `PATCH /me` - Update profile
- `POST /me/avatar` - Upload avatar
- `GET /search` - Search users
- `GET /:userId` - Get user by ID
- `POST /:userId/follow` - Follow user
- `DELETE /:userId/follow` - Unfollow user
- `GET /:userId/followers` - Get followers
- `GET /:userId/following` - Get following

### Posts (`/api/v1/posts`)
- `POST /` - Create post
- `GET /` - Get feed (following/trending/latest)
- `GET /:postId` - Get single post
- `PATCH /:postId` - Update post
- `DELETE /:postId` - Delete post
- `POST /:postId/like` - Like post
- `DELETE /:postId/like` - Unlike post
- `POST /:postId/comments` - Add comment
- `GET /:postId/comments` - Get comments
- `GET /user/:userId` - Get user's posts
- `GET /hashtag/:tag` - Get posts by hashtag

### Chat (`/api/v1/chat`)
- `POST /conversations` - Create conversation
- `GET /conversations` - Get conversations
- `GET /conversations/:id/messages` - Get messages

### Q&A (`/api/v1/qa`)
- `POST /questions` - Ask question
- `GET /questions` - Get questions
- `GET /questions/:id` - Get question
- `POST /questions/:id/answers` - Add answer
- `GET /questions/:id/answers` - Get answers

### Notifications (`/api/v1/notifications`)
- `GET /` - Get notifications
- `GET /unread-count` - Get unread count
- `PATCH /read-all` - Mark all read
- `PATCH /:id/read` - Mark as read

### Market (`/api/v1/market`)
- `GET /prices` - Get mandi prices
- `GET /commodities` - List commodities
- `GET /states` - List states

### Weather (`/api/v1/weather`)
- `GET /current` - Get current weather (query: state, district)

## Socket.IO

Connect with JWT in auth:
```javascript
const socket = io(API_URL, { auth: { token: accessToken } });
socket.on('connect', () => { /* joined */ });
socket.emit('conversation:join', { conversationId });
socket.emit('message:send', { conversationId, type: 'text', content: { text: 'Hello' } });
socket.on('message:new', (message) => { /* new message */ });
```

## Environment Variables

See `.env.example` for all required variables.
