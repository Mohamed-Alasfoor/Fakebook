# Fakebook Project

A Facebook-like social network built with Go (backend) and Next.js (frontend), featuring authentication, real-time communication, group management, notifications, and more.

## Features

### Authentication

- User registration with validation:
  - Required: Email, Password, First Name, Last Name, Date of Birth
  - Optional: Avatar, Nickname, About Me
- Secure password hashing using bcrypt
- Session-based authentication with cookies
- Persistent login state
- Logout and session management

### Profile Management

- Public and private profile settings
- Profile information display (user details, activity, followers, and following list)
- Option to follow/unfollow users
- Follow request system for private profiles

### Posts & Comments

- Create posts with privacy options:
  - Public (visible to all users)
  - Almost Private (visible to followers only)
  - Private (visible to selected followers)
- Attach images/GIFs to posts and comments
- Comment system with image support
- Like/unlike functionality

### Groups & Events

- Create groups with title and description
- Invite/request to join system for groups
- Group posts and comments (visible only to members)
- Group chat with real-time messaging
- Event creation inside groups with RSVP system ("Going" / "Not Going")

### Real-time Features

- Private messaging via WebSockets
- Group chat system
- User online status tracking
- Read receipt for messages
- Emoji support in chat

### Notifications

- Follow request alerts
- Group invitation notifications
- New event creation alerts
- Message notifications
- Real-time updates using WebSockets

## Technical Stack

### Frontend (Next.js)

- TypeScript for type safety
- Tailwind CSS for styling
- Component-based structure
- WebSocket client implementation for real-time interactions
- Responsive design

### Backend (Go)

- Custom web server using Go
- SQLite database with migration system
- WebSockets for real-time communication
- Secure authentication with bcrypt and session cookies
- RESTful API for frontend integration

### Database (SQLite)

- User authentication and profile management
- Posts, comments, likes, and follower relationships
- Groups and event tracking
- Messaging and notifications
- Online status tracking

## Project Structure

```
social-network/
├── frontend/                 # Frontend application (Next.js)
│   ├── src/
│   │   ├── app/           # App pages (chat, groups, login, notifications, profile, register, settings)
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utility functions and API hooks
│   │   ├── types/         # Type definitions for frontend models
│   │   └── middleware.ts  # Middleware for authentication
│   ├── public/            # Static assets
│   └── package.json       # Project dependencies
│
├── backend/               # Backend application (Go)
│   ├── app/
│   │   ├── auth/          # Authentication and session management
│   │   ├── chat/          # Private and group chat functionality
│   │   ├── comments/      # Comment system
│   │   ├── db/            # Database management
│   │   ├── events/        # Group events and RSVP management
│   │   ├── followers/     # Follow/unfollow system
│   │   ├── groups/        # Group management and invitations
│   │   ├── likes/         # Like/unlike functionality
│   │   ├── notifications/ # Notification system
│   │   ├── posts/         # Posts and media handling
│   │   ├── search/        # User and post search functionality
│   │   ├── sessions/      # Session and authentication middleware
│   │   └── users/         # Profile and privacy management
│   ├── avatars/           # Avatar uploads
│   ├── server/
│   │   ├── middleware.go  # Server middleware handlers
│   │   └── server.go      # Main server file
│   ├── uploads/           # File uploads storage
│   ├── Dockerfile         # Docker containerization
│   ├── main.go            # Application entry point
│   ├── social_network.db  # SQLite database
│   └── go.mod             # Go dependencies
│
├── docker-compose.yml      # Docker configuration for frontend and backend
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites

- Go 1.22+
- Node.js 18+
- SQLite
- Docker and Docker Compose

### Setup and Run

1. Clone the repository:

   ```bash
   git clone https://github.com/Mohamed-Alasfoor/Fakebook.git
   cd Fakebook
   ```

2. Start the backend:

   ```bash
   cd backend
   go run main.go
   ```

3. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Docker Setup

To build and run using Docker Compose:

```bash
docker-compose up --build
```

## **Authors**

- [Ali Hasan](https://github.com/AliHJMM)
- [Habib Mansoor](https://github.com/7abib04)
- [Mohamed Alasfoor](https://github.com/Mohamed-Alasfoor)
- [Hussain Jawad](https://github.com/hujaafar)
