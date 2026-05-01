# Spider Solitaire

<img src="public/spider.svg" width="200" alt="Spider Solitaire" />

A modern, open-source Spider Solitaire app focused on local practice play:

- `Practice`: local-first play with random boards and persistent stats

## Features

- **Classic Gameplay**: Authentic Spider Solitaire rules and mechanics.
- **Single Local Mode**:
  - random practice boards
- **Smart Features**:
  - undo system
  - smart hints
  - automatic run detection
- **Customization**:
  - multiple color themes
  - customizable card backs
- **Persistence**:
  - local game state and stats in the browser

## Tech Stack

- **Frontend**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
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

### Building for Production

To create an optimized production build:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Open Source

This project is open source software. We believe in the power of community and transparent development.

- **Learn**: Explore the source code to see how a modern React game is architected.
- **Contribute**: Bug reports, feature requests, and pull requests are welcome!
- **Modify**: Feel free to fork the repository and customize the game to your liking.

## License

This project is available under the [MIT License](LICENSE).
