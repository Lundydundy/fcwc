# Fantasy Club World Cup (FCWC)

![Fantasy Football](https://img.shields.io/badge/Fantasy-Football-green.svg)
![Version](https://img.shields.io/badge/Version-0.1.0-blue.svg)
![Status](https://img.shields.io/badge/Status-Development-orange.svg)

A comprehensive fantasy football web application that allows users to create their dream teams, participate in leagues with friends, and compete based on real-world football match performances.

## Project Status (Updated April 19, 2025)

This project is under active development. Here's the current status:

### Completed
- ✅ Express.js backend API structure
- ✅ MongoDB data models (User, Team, Player, League)
- ✅ JWT authentication system
- ✅ Player seeding script with sample data
- ✅ API testing documentation
- ✅ Basic Next.js frontend setup

### In Development
- 🔄 Controller implementations for Teams and Leagues
- 🔄 Frontend authentication pages
- 🔄 Team selection interface

### Coming Soon
- 📅 Dashboard interface
- 📅 League management UI
- 📅 Player statistics visualization

## Table of Contents

- [Project Overview](#project-overview)
- [Features in Detail](#features-in-detail)
- [Technical Architecture](#technical-architecture)
- [Implementation Status](#implementation-status)
- [User Flow](#user-flow)
- [Front-end Components](#front-end-components)
- [Data Models](#data-models)
- [Future Development Roadmap](#future-development-roadmap)
- [Installation Guide](#installation-guide)
- [Development Workflow](#development-workflow)
- [API Documentation](#api-documentation)
- [Testing Strategy](#testing-strategy)
- [Deployment](#deployment)
- [Contributing Guidelines](#contributing-guidelines)

## Project Overview

Fantasy Club World Cup (FCWC) is an immersive fantasy football platform that simulates the experience of managing a football team. It combines the excitement of real-world football with strategic team management, allowing users to:

- Build their dream teams with real football players
- Manage team budgets and player transfers
- Compete in private leagues with friends or public competitions
- Earn points based on the real-world performance of selected players
- Track statistics, analyze performance, and optimize team selection

The application uses a modern tech stack with Next.js, TypeScript, and Tailwind CSS to provide a responsive, dynamic, and engaging user experience that functions seamlessly across desktop and mobile devices.

## Features in Detail

### User Authentication System

- **User Registration**: Complete sign-up flow with email verification
  - Form validation for all fields
  - Password strength requirements
  - Terms of service and privacy policy confirmation
  
- **Login System**: Secure authentication with multiple options
  - Email/password login
  - Social media integration (Google, Facebook)
  - "Remember me" functionality
  - Password recovery flow
  
- **User Profile Management**:
  - Profile customization options
  - Account settings
  - Notification preferences
  - Privacy controls

### Team Management

- **Team Creation**:
  - Team name, logo, and color selection
  - Initial budget allocation (£100 million)
  - Formation selection (4-4-2, 3-5-2, etc.)
  
- **Player Selection**:
  - Database of real football players with stats and prices
  - Player categorization by position (GK, DEF, MID, FWD)
  - Dynamic pricing based on popularity and performance
  - Position restrictions (max 3 players from same team)
  
- **Team Management**:
  - Substitute bench management
  - Captain and vice-captain selection
  - Player transfer market
  - Budget tracking and financial planning

### League System

- **League Types**:
  - Private leagues (invite-only)
  - Public leagues (open to all)
  - Head-to-head competitions
  - Tournament-style knockout competitions
  
- **League Management**:
  - League creation with customizable settings
  - Invitation system for private leagues
  - League admin controls
  - Season-long and gameweek rankings
  
- **Competitive Elements**:
  - Weekly matchups in head-to-head leagues
  - Points-based leaderboards
  - Mini-leagues and special competitions
  - Season rewards and achievements

### Scoring System

- **Point Calculation**:
  - Appearance points (playing at least 60 minutes)
  - Goals scored (different points by position)
  - Assists
  - Clean sheets (for defenders and goalkeepers)
  - Saves (for goalkeepers)
  - Penalties saved/missed
  - Cards (yellow/red)
  - Bonus points for outstanding performances
  
- **Live Scoring**:
  - Real-time point updates during matches
  - Live rank changes
  - Match statistics integration

### Statistics and Analytics

- **Player Statistics**:
  - Historical performance data
  - Form indicators
  - Fixture difficulty ratings
  - Expected points predictions
  
- **Team Analytics**:
  - Overall performance metrics
  - Comparative analysis with other teams
  - Strength by position
  - Suggested improvements

## Technical Architecture

### Frontend Architecture

- **Framework**: Next.js 15.3.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (local state), Context API (global state)
- **Routing**: Next.js App Router
- **Component Structure**: Atomic design pattern

#### Key Frontend Features:

- Server-side rendering for fast initial page loads
- Optimized image loading with Next.js Image component
- Responsive design for all device sizes
- Accessible UI components following WCAG guidelines
- Progressive Web App capabilities

### Backend Architecture (Planned)

- **API**: RESTful API built with Node.js/Express
- **Database**: MongoDB (user data, team data) / PostgreSQL (match statistics)
- **Authentication**: JWT with refresh token strategy
- **Real-time Updates**: WebSockets for live score updates
- **Caching**: Redis for performance optimization

### Infrastructure (Planned)

- **Hosting**: Vercel for frontend, DigitalOcean/AWS for backend services
- **CI/CD**: GitHub Actions for continuous integration and deployment
- **Monitoring**: Sentry for error tracking, Google Analytics for user analytics
- **Security**: HTTPS, CORS policies, rate limiting, data encryption

## Implementation Status

### Currently Implemented (As of April 19, 2025)

#### Frontend Components

1. **Landing Page**: 
   - Hero section with call-to-action buttons
   - Feature highlights with visual icons
   - Responsive design for all device sizes
   - Footer with social media links

2. **Authentication Pages**:
   - Login form with field validation
   - Registration form with password confirmation
   - Social login options (UI only, not connected)
   - Form error handling and loading states

3. **Dashboard**:
   - Multi-tab interface for different features
   - Overview section with key stats
   - My Team display with player details
   - Transfers section for player management
   - Leagues tab showing competitions
   - Fixtures tab displaying upcoming matches

#### Data Models (Mock Implementation)

1. **User Model**:
   ```typescript
   interface User {
     id: string;
     name: string;
     email: string;
     password: string; // Hashed in real implementation
     createdAt: Date;
   }
   ```

2. **Team Model**:
   ```typescript
   interface Team {
     id: string;
     name: string;
     owner: string; // User ID
     budget: string;
     points: number;
     rank: number;
     players: Player[];
   }
   ```

3. **Player Model**:
   ```typescript
   interface Player {
     id: number;
     name: string;
     team: string;
     position: 'GK' | 'DEF' | 'MID' | 'FWD';
     points: number;
     price: string;
   }
   ```

4. **League Model**:
   ```typescript
   interface League {
     id: number;
     name: string;
     members: number;
     rank: number;
   }
   ```

5. **Fixture Model**:
   ```typescript
   interface Fixture {
     id: number;
     home: string;
     away: string;
     date: string;
     stadium: string;
   }
   ```

### Pending Implementation

1. **Backend Services**:
   - User authentication API
   - Team management API
   - League system API
   - Scoring system API

2. **Database Integration**:
   - User data storage
   - Team and player data storage
   - Match and fixture data integration

3. **Advanced Frontend Features**:
   - Interactive team builder with pitch visualization
   - Advanced player search and filters
   - Complete league management UI
   - Stats visualization with charts

## User Flow

1. **New User Journey**:
   - User lands on homepage
   - Clicks "Get Started" button
   - Completes registration form
   - Receives verification email (future)
   - Verifies email and logs in (future)
   - Guided through team creation process (future)
   - Enters the dashboard

2. **Returning User Journey**:
   - User visits the app
   - Clicks "Log In" button
   - Enters credentials or uses social login
   - Lands on dashboard
   - Views team performance
   - Makes transfers or team changes
   - Checks league standings

3. **Weekly Engagement Flow**:
   - User receives match day notification (future)
   - Logs in to check team
   - Makes last-minute transfers if needed (future)
   - Watches live score updates during matches (future)
   - Reviews performance after matches (future)
   - Plans strategy for upcoming gameweek (future)

## Front-end Components

### Global Components

1. **Navigation**:
   - Header with logo
   - User account dropdown
   - Notifications bell
   - Mobile-responsive menu

2. **Layout**:
   - App-wide containers
   - Responsive grid system
   - Footer with links and copyright

3. **UI Elements**:
   - Buttons (primary, secondary, tertiary)
   - Form inputs with validation
   - Cards for data display
   - Tabs for sectioned content
   - Modals for actions and confirmations

### Page-Specific Components

1. **Homepage Components**:
   - Hero banner with gradient background
   - Feature cards with icons
   - Call-to-action sections
   - Social proof section (future)

2. **Authentication Components**:
   - Login form
   - Registration form
   - Social login buttons
   - Password reset form (future)

3. **Dashboard Components**:
   - Stats overview cards
   - Team display grid
   - League table
   - Fixture list
   - Transfer market interface

4. **Team Management Components**:
   - Formation selector (future)
   - Player card with stats
   - Budget display
   - Points counter
   - Player search and filter (future)

## Data Models

### Complete Data Schema (Planned)

1. **User**:
   - Basic info (name, email, password)
   - Profile data (display name, avatar, location)
   - Preferences (notifications, privacy)
   - Account status (active, verified)

2. **Team**:
   - Basic info (name, formed date)
   - Squad (selected players, formation)
   - Performance (total points, history)
   - Financial (budget, player values)

3. **Player**:
   - Personal info (name, age, nationality)
   - Team affiliation (current team)
   - Performance stats (points, form)
   - Market data (price, ownership %)

4. **League**:
   - Details (name, type, creation date)
   - Members (teams, managers)
   - Rules (scoring, transfers)
   - Standings (current ranks, history)

5. **Gameweek**:
   - Period info (start date, end date)
   - Fixtures (matches included)
   - Deadlines (transfer deadline)
   - Status (upcoming, live, completed)

6. **Match**:
   - Basic info (teams, date, venue)
   - Status (scheduled, live, completed)
   - Results (score, stats)
   - Player performances (individual stats)

## Future Development Roadmap

### Phase 1: Core Functionality (1-2 Months)

1. **Backend Development**:
   - Set up Node.js/Express server
   - Implement user authentication API
   - Create team management endpoints
   - Establish database connections

2. **Frontend Enhancements**:
   - Connect authentication to backend
   - Implement team creation wizard
   - Add player search functionality
   - Create interactive team formation display

3. **Infrastructure**:
   - Set up development, staging, and production environments
   - Configure CI/CD pipelines
   - Implement logging and monitoring

### Phase 2: Advanced Features (2-4 Months)

1. **League System Implementation**:
   - Create league management API
   - Develop league creation and join flows
   - Implement league standings calculation
   - Add head-to-head matchups

2. **Scoring System**:
   - Develop points calculation engine
   - Create data ingestion for match statistics
   - Implement live scoring updates
   - Add historical performance tracking

3. **User Experience Improvements**:
   - Enhanced profile customization
   - Advanced team statistics
   - Performance visualization with charts
   - Personalized recommendations

### Phase 3: Social and Premium Features (4-6 Months)

1. **Social Features**:
   - Friend system with connections
   - In-app messaging
   - Activity feed
   - Sharing functionality

2. **Premium Services**:
   - Subscription-based advanced stats
   - Exclusive competitions
   - Ad-free experience
   - Early transfer windows

3. **Mobile Experience**:
   - React Native mobile app development
   - Push notification system
   - Offline functionality
   - Biometric authentication

### Phase 4: Expansion and Scale (6+ Months)

1. **Internationalization**:
   - Multi-language support
   - Region-specific leagues
   - International competitions

2. **API Ecosystem**:
   - Public API for developers
   - Integrations with third-party services
   - Webhooks for event-driven architecture

3. **Machine Learning**:
   - Predictive analytics for player performance
   - Personalized team recommendations
   - Automated insights generation

## Installation Guide

### Prerequisites

- Node.js v18.0.0 or higher
- npm v8.0.0 or higher (or yarn v1.22.0+)
- Git

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/fantasy-club-world-cup.git
   cd fantasy-club-world-cup
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**:
   - Create a `.env.local` file in the root directory
   - Add the following variables (placeholder values for now):
     ```
     NEXT_PUBLIC_API_URL=http://localhost:3001/api
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     ```

4. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the application**:
   - Open your browser and navigate to `http://localhost:3000`
   - For testing login: Email: `demo@example.com`, Password: `password`

### Production Build

1. **Create production build**:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Start production server**:
   ```bash
   npm start
   # or
   yarn start
   ```

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for feature development
- `feature/feature-name`: Individual feature branches
- `bugfix/bug-name`: Bug fix branches
- `release/version`: Release preparation branches

### Commit Guidelines

- Use conventional commits format: 
  - `feat: add new feature`
  - `fix: resolve issue with component`
  - `docs: update README`
  - `style: format code`
  - `refactor: improve code structure`
  - `test: add tests for component`

### Pull Request Process

1. Create feature branch from `develop`
2. Implement and test your changes
3. Ensure code passes linting: `npm run lint`
4. Create PR against `develop` branch
5. Wait for code review and approval
6. Merge after approval

## API Documentation

### Authentication API (Planned)

- **POST /api/auth/register**
  - Register a new user
  - Body: `{ name, email, password }`
  - Response: `{ user, token }`

- **POST /api/auth/login**
  - Authenticate user
  - Body: `{ email, password }`
  - Response: `{ user, token }`

- **GET /api/auth/me**
  - Get current user data
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ user }`

### Team Management API (Planned)

- **GET /api/team**
  - Get user's team
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ team }`

- **PUT /api/team**
  - Update team details
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ name, formation, players }`
  - Response: `{ team }`

- **POST /api/team/transfers**
  - Make player transfers
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ in: [playerId], out: [playerId] }`
  - Response: `{ success, team, budget }`

### League API (Planned)

- **GET /api/leagues**
  - Get user's leagues
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ leagues }`

- **POST /api/leagues**
  - Create a new league
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ name, type, settings }`
  - Response: `{ league, inviteCode }`

- **POST /api/leagues/join**
  - Join a league
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ inviteCode }`
  - Response: `{ success, league }`

## Testing Strategy

### Unit Testing (Planned)

- **Framework**: Jest
- **Component Testing**: React Testing Library
- **Coverage Target**: 80% minimum

### Integration Testing (Planned)

- **API Testing**: Supertest
- **Frontend Flows**: Cypress
- **Key Workflows**: Registration, team creation, transfers

### End-to-End Testing (Planned)

- **Framework**: Cypress
- **Critical Paths**: User journey from registration to team management
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge

### Manual Testing Checklist (Current)

- Verify all links work correctly
- Test responsive design on multiple screen sizes
- Validate form submission and error handling
- Check tab navigation and content display
- Ensure authentication flow works with test credentials

## Deployment

### Current Deployment

Currently running locally in development mode

### Planned Deployment Strategy

1. **Frontend**:
   - Platform: Vercel
   - Strategy: Automatic deployment from main branch
   - Preview deployments for PRs

2. **Backend** (future):
   - Platform: DigitalOcean App Platform or AWS Elastic Beanstalk
   - Strategy: Containerized deployment with Docker
   - Separate environments for staging and production

3. **Database** (future):
   - Platform: MongoDB Atlas (NoSQL data) & AWS RDS (relational data)
   - Strategy: Automated backups and scaling
   - Read replicas for high-traffic periods

## Contributing Guidelines

### Getting Started

1. Fork the repository
2. Set up the development environment
3. Pick an issue from the issue tracker
4. Create a feature branch
5. Implement your changes
6. Submit a pull request

### Code Standards

- Follow TypeScript best practices
- Use ESLint for code quality assurance
- Maintain consistent formatting with Prettier
- Write meaningful commit messages
- Include appropriate tests for new features

### Documentation

- Update README.md when adding major features
- Document complex components with comments
- Create/update JSDoc for functions and interfaces
- Keep API documentation current

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please reach out to the project maintainers at [example@email.com](mailto:example@email.com).

---

**Fantasy Club World Cup** - Making fantasy football more exciting since 2025.
