# Web 3D Editor

A browser-based 3D scene editor built with Vue 3, TypeScript, Vite, and Three.js.

The project implements a modular editor architecture for creating, editing, importing, serializing, and running 3D scenes in the browser. It is designed around an Entity Component model, command-based editing, and a Three.js adapter layer so editor data and runtime rendering stay separated.

## Features

- Editor core with Entity and Component management
- Command system with undo and redo
- Scene graph operations: create, delete, duplicate, rename, group, ungroup, and parent changes
- Selection, transform, gizmo, pivot, and snap workflows
- Inspector schema system for component editing
- Asset system with GLTF and GLB import
- Material and texture editing
- Scene serialization and deserialization
- Animation clips, tween system, timers, and runtime loop
- Runtime export support
- Shader system with error handling
- Post processing pipeline
- Physics components and collider support
- Plugin system with demo Grid Helper plugin
- i18n support for Chinese and English
- Dock layout and workspace management
- Performance monitor for scene statistics

## Tech Stack

- Vue 3
- TypeScript
- Vite
- Three.js
- Pinia
- Vue I18n
- Vitest

## Project Structure

```text
src/
  app/                Vue application shell and shared instances
  editor/             Editor core, commands, components, systems, runtime
  engine/three/       Three.js adapter and resource disposal
  i18n/               Vue I18n setup
  layout/             Dock layout, panels, and workspace management
  locales/            English and Chinese translation files
  panels/             Editor UI panels
  viewport/           Viewport panel
tests/                Vitest coverage for editor systems and validation flows
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Run type checks:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```

## Static Deployment

The production build is configured for deployment under the `/3Deditor/` subdirectory.

After running `npm run build`, serve the generated `dist/` directory from:

```text
/3Deditor/
```

The Vite `base` setting keeps local development at `/` while production assets are emitted with the `/3Deditor/` prefix.

## Validation Status

Current validation commands:

```bash
npm run typecheck
npm test
npm run build
```

The build currently emits a Vite chunk-size warning for the Three.js bundle. This is expected for the current editor architecture and does not block static deployment.

## License

MIT
