# Spider Solitaire

<img src="public/spider.svg" width="200" alt="Spider Solitaire" />

A modern, open-source Spider Solitaire app focused on local practice play.

<img src="src/assets/screenshot.webp" width="800" alt="Spider Solitaire gameplay screenshot" />

## Features

- **Classic Gameplay**: Authentic Spider Solitaire rules and mechanics.
- **Single Local Mode**:
  - random boards with persistent local stats
- **Smart Features**:
  - undo system
  - smart hints
  - automatic run detection
- **Customization**:
  - multiple color themes
  - customizable card backs
- **Persistence**:
  - local game state and stats in the browser

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/lklynet/spider-solitaire.git
   cd spider-solitaire
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the frontend:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### Dev Commands

```bash
npm run dev
npm run build
npm run preview
```

## Docker Deployment

Run the local-only app as a single containerized web service:

```bash
docker compose pull
docker compose up
```

Then open `http://localhost:8080`.

### Building for Production

To create an optimized production build:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## License

This project is available under the [MIT License](LICENSE).
