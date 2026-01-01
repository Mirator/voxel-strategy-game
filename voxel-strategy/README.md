# Voxel Conquest

A 3D voxel-based turn-based strategy game inspired by Heroes of Might and Magic, built with React, Three.js, and TypeScript.

![Game Screenshot](docs/screenshot.png)

## 🎮 Features

### Core Gameplay
- **3D Voxel World**: Beautiful low-poly aesthetic with procedurally generated terrain
- **Turn-Based Strategy**: Player and AI factions take alternating turns
- **Hero System**: Control heroes with customizable armies
- **Tactical Combat**: Turn-based battles with unit positioning and abilities
- **Resource Management**: Collect gold, wood, stone, and crystals
- **Town Management**: Recruit units and develop your faction

### World Generation
- **Procedural Generation**: Unique worlds with seeded random generation
- **Multiple Terrain Types**: Grass, forest, desert, mountains, water, and roads
- **Points of Interest**: Towns, enemy camps, resource nodes, and neutral encounters
- **Deterministic**: Same seed produces identical worlds

### Technical Features
- **Modern Stack**: React 19, TypeScript, Three.js (react-three-fiber)
- **State Management**: Zustand with Immer for immutable updates
- **Testing**: Unit tests (Vitest) and E2E tests (Playwright)
- **CI/CD**: GitHub Actions pipeline

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/voxel-conquest.git
cd voxel-conquest/voxel-strategy

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 🎯 How to Play

### Controls
- **Left Click**: Select hero / Move to tile
- **Right Drag**: Rotate camera
- **Scroll**: Zoom in/out
- **Middle Drag**: Pan camera
- **Space**: End turn
- **Esc**: Open menu

### Game Flow
1. Start a new game from the main menu
2. Your hero starts near your home town
3. Move your hero to explore the map
4. Visit towns to recruit units
5. Attack enemy camps to gain resources
6. Capture neutral towns to expand your territory
7. Defeat all enemy factions to win!

### Resources
- **💰 Gold**: Primary currency for recruiting units
- **🪵 Wood**: Used for certain unit types and buildings
- **🪨 Stone**: Used for defensive units and fortifications
- **💎 Crystals**: Rare resource for magical units

### Unit Types
| Unit | HP | Attack | Defense | Speed | Range |
|------|-----|--------|---------|-------|-------|
| Warrior | 50 | 12 | 8 | 4 | 1 |
| Archer | 30 | 10 | 4 | 5 | 4 |
| Cavalry | 60 | 14 | 6 | 7 | 1 |
| Mage | 25 | 18 | 3 | 4 | 3 |
| Healer | 20 | 5 | 5 | 5 | 2 |

## 🧪 Testing

### Unit Tests
```bash
# Run once
npm run test:unit

# Watch mode
npm run test:unit:watch

# With coverage
npm run test:coverage
```

### E2E Tests
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

## 📁 Project Structure

```
voxel-strategy/
├── src/
│   ├── core/           # Game types and constants
│   │   └── types.ts    # TypeScript type definitions
│   ├── world/          # World generation
│   │   └── worldGenerator.ts
│   ├── store/          # State management
│   │   └── gameStore.ts
│   ├── rendering/      # 3D rendering
│   │   ├── GameScene.tsx
│   │   ├── CombatScene.tsx
│   │   └── voxels/     # Voxel components
│   ├── ui/             # UI components
│   │   ├── MainMenu.tsx
│   │   ├── GameHUD.tsx
│   │   ├── CombatHUD.tsx
│   │   └── TownInterface.tsx
│   ├── ai/             # AI systems
│   │   └── AIController.ts
│   └── utils/          # Utilities
│       └── random.ts   # Seeded RNG
├── tests/
│   ├── unit/           # Unit tests
│   └── e2e/            # E2E tests
├── .github/
│   └── workflows/      # CI/CD pipelines
└── public/             # Static assets
```

## 🔧 Configuration

### World Generation Config
```typescript
{
  mapWidth: 64,        // Map width in tiles
  mapHeight: 64,       // Map height in tiles
  seed: 'my-seed',     // Random seed for deterministic generation
  numTowns: 6,         // Number of towns to generate
  numEnemyCamps: 12,   // Number of enemy camps
  numResourceNodes: 20,// Number of resource nodes
}
```

### Game Difficulty
- **Easy**: More starting resources, weaker enemies
- **Normal**: Balanced gameplay
- **Hard**: Fewer resources, stronger enemies

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run E2E tests

### Architecture Decisions
- **State Management**: Zustand chosen for simplicity and React 19 compatibility
- **3D Rendering**: react-three-fiber for declarative Three.js
- **Testing**: Vitest for unit tests (fast, Vite-native), Playwright for E2E
- **Styling**: CSS modules for component styles

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Heroes of Might and Magic (no copyrighted assets used)
- Built with [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- State management by [Zustand](https://github.com/pmndrs/zustand)
- Testing powered by [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/)

## 🗺️ Roadmap

- [ ] Multiplayer support
- [ ] Save/Load game state
- [ ] More unit types and abilities
- [ ] Campaign mode with story
- [ ] Sound effects and music
- [ ] Mobile support
- [ ] Map editor
