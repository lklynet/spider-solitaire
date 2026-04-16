# Spider Solitaire

<img src="public/spider.svg" width="200" alt="Spider Solitaire" />

A modern, open-source Spider Solitaire app with two distinct play styles:

- `Casual / Practice`: local-first play, random boards, practice seed, and local stats
- `Official Daily Race`: one verified daily run, replay validation, global leaderboards, badges, and race history

## Features

- **Classic Gameplay**: Authentic Spider Solitaire rules and mechanics.
- **Dual Product Modes**:
  - local casual/practice play with persistent local stats
  - server-backed official daily race with one entry per player
- **Verified Official Results**:
  - official runs are submitted with replay events
  - server replays the run against the official seed
  - only verified wins rank
- **Leaderboards**:
  - daily
  - weekly
  - monthly
  - global
  - race history archive
- **Profiles And Badges**:
  - wins
  - top 3 / top 5 / top 10 finishes
  - verified submissions
  - total points
- **Smart Features**:
  - undo system
  - smart hints
  - automatic run detection
- **Customization**:
  - multiple color themes
  - customizable card backs
- **Persistence**:
  - local game state and casual stats in the browser
  - official race state in Postgres

## Tech Stack

- **Frontend**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **API**: [Fastify](https://fastify.dev/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Utilities**: [date-fns](https://date-fns.org/), [clsx](https://github.com/lukeed/clsx)

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/spider-solitaire.git
   cd spider-solitaire
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a local env file:
   ```bash
   cp .env.example .env
   ```

4. Start Postgres:
   ```bash
   docker compose up -d postgres
   ```

5. Run database migrations:
   ```bash
   npm run migrate:api
   ```

6. Start the API:
   ```bash
   npm run dev:api
   ```

7. Start the worker:
   ```bash
   npm run dev:worker
   ```

8. Start the frontend:
   ```bash
   npm run dev
   ```

9. Open your browser and navigate to `http://localhost:5173`.

### Dev Commands

```bash
npm run dev         # frontend only
npm run dev:api     # api only
npm run dev:worker  # worker only
npm run migrate:api # run SQL migrations
npm run build       # frontend build
npm run build:api   # api build
npm run build:worker
```

### Admin Accounts

To grant admin access, set `ADMIN_USERNAMES` in `.env` before registering or logging in:

```bash
ADMIN_USERNAMES=leekelly,spideradmin
```

Admins can access verification telemetry and export recent submissions.

### Building for Production

To create an optimized production build:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Docker Deployment

This project now runs as a multi-service stack:

- `web`
- `api`
- `worker`
- `postgres`

### Using Docker Compose (Recommended)

A `compose.yaml` file is included in the repository for quick deployment.

1. Create `.env` from `.env.example`
2. Run the application:
   ```bash
   docker compose up -d
   ```

3. Open your browser and navigate to `http://localhost:8080`.

### Container Notes

- The frontend proxies `/api` to the API container.
- The API runs migrations on startup in the container image.
- The worker keeps challenge schedule state current and finalizes closed races.
- Postgres stores users, sessions, attempts, results, replays, rankings, and badge counters.

### Admin Telemetry And Export

Admin-only API routes:

- `GET /admin/submissions/recent`
- `GET /admin/submissions/export.csv`

The CSV export is useful for lightweight moderation, verification review, or offline analysis.

## Open Source

This project is open source software. We believe in the power of community and transparent development.

- **Learn**: Explore the source code to see how a modern React game is architected.
- **Contribute**: Bug reports, feature requests, and pull requests are welcome!
- **Modify**: Feel free to fork the repository and customize the game to your liking.

## License

This project is available under the [MIT License](LICENSE).
