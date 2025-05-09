# Fantasy Club World Cup API

This is the backend API for the Fantasy Club World Cup application, built with Node.js, Express, and MongoDB.

## Implementation Status (Updated April 19, 2025)

✅ **Completed**:
- User authentication system with registration, login, and JWT authentication
- Database models for Users, Teams, Players and Leagues
- API routes structure for all major endpoints
- Player data seed script with 12 sample players
- API testing documentation with Postman collection
- Database connection setup with MongoDB Atlas support

⏳ **In Progress**:
- Controller implementation for Teams, Players and Leagues
- Advanced filtering for player stats
- Team budget validation

🔜 **Coming Next**:
- Admin dashboard for player management
- Gameweek scheduling system
- Points calculation algorithm

## Features

- User authentication with JWT
- Team management
- Player database with filtering and search
- League creation and management
- RESTful API endpoints

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication mechanism
- **bcryptjs** - Password hashing

## Directory Structure

```
server/
├── config/         # Configuration files (DB connection)
├── controllers/    # Route controllers
├── middleware/     # Custom middleware (auth, etc.)
├── models/         # Mongoose models
├── routes/         # API routes
├── .env            # Environment variables
├── index.js        # Server entry point
├── package.json    # Project dependencies
└── seeder.js       # Database seeding script
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Users

- `GET /api/users/profile` - Get user profile

### Teams

- `GET /api/teams` - Get user's team
- `POST /api/teams` - Create a new team
- `PUT /api/teams` - Update team
- `POST /api/teams/transfers` - Make player transfers

### Players

- `GET /api/players` - Get all players (with filtering options)
- `GET /api/players/:id` - Get single player by ID
- `POST /api/players` - Add a player (admin)
- `PUT /api/players/:id` - Update player (admin)

### Leagues

- `GET /api/leagues` - Get leagues that user belongs to
- `POST /api/leagues` - Create a new league
- `GET /api/leagues/public` - Get public leagues
- `GET /api/leagues/:id` - Get single league by ID
- `POST /api/leagues/join` - Join a league with an invite code
- `DELETE /api/leagues/:id` - Delete a league (owner only)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. Clone the repository
2. Navigate to the server directory:
   ```
   cd server
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   ```

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

### Seeding the Database

To populate the database with sample player data:
```
node seeder.js
```

## Testing the API

You can test the API using Postman or any API testing tool. A Postman collection is included in the `api-test-examples.json` file.

### Importing the collection into Postman:

1. Open Postman
2. Click on "Import" in the upper left corner
3. Upload the `api-test-examples.json` file
4. Create a new environment and add these variables:
   - `auth_token`
   - `player_id`
   - `league_id`

### Testing flow:

1. **Register a user** and save the JWT token
2. **Login** to get a fresh JWT token if needed
3. **Set the auth_token** environment variable with your JWT token
4. **Get players** and save a player ID as a variable
5. **Create a team**
6. **Create a league** and save the league ID as a variable

## Data Models

### User

- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `createdAt`: Date

### Team

- `name`: String (required, unique)
- `user`: ObjectId (reference to User)
- `budget`: Number
- `players`: Array of player references
- `formation`: String (enum: '4-4-2', '4-3-3', etc.)
- `totalPoints`: Number
- `createdAt`: Date

### Player

- `name`: String (required)
- `club`: String (required)
- `position`: String (enum: 'GK', 'DEF', 'MID', 'FWD')
- `price`: Number (required)
- `totalPoints`: Number
- `form`: Number
- `pointsHistory`: Array of gameweek point records
- `stats`: Object (goals, assists, etc.)
- `isActive`: Boolean

### League

- `name`: String (required, unique)
- `description`: String
- `owner`: ObjectId (reference to User)
- `type`: String (enum: 'public', 'private')
- `inviteCode`: String (for private leagues)
- `members`: Array of user/team references
- `maxMembers`: Number
- `createdAt`: Date

## License

[MIT](https://choosealicense.com/licenses/mit/)

---

Created for Fantasy Club World Cup - April 2025