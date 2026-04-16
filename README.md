# Journey Builder — Prefill Configuration

A React + TypeScript application that renders a DAG of forms and provides a UI for configuring field-level prefill mappings between upstream and downstream forms.

## Quick Start

```bash
# Prerequisites: Node.js >= 18, pnpm
nvm use 22        # or any Node >= 18
pnpm install
pnpm dev          # starts dev server at http://localhost:5173
```

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `pnpm dev`        | Start Vite dev server               |
| `pnpm build`      | Type-check and build for production |
| `pnpm test`       | Run all tests once                  |
| `pnpm test:watch` | Run tests in watch mode             |
| `pnpm lint`       | Lint with ESLint                    |
| `pnpm lint:fix`   | Auto-fix lint issues                |
| `pnpm format`     | Format with Prettier                |

## Architecture

```
src/
├── api/                        # API client and mock data
│   ├── client.ts               # Fetches blueprint (falls back to mock)
│   └── mock-data.ts            # Static mock API response
├── services/
│   ├── dag.ts                  # DAG traversal (ancestors, dependencies)
│   └── data-sources/           # Extensible prefill data source system
│       ├── types.ts            # PrefillDataSource interface
│       ├── form-fields-source.ts   # Upstream form fields
│       ├── global-data-source.ts   # Global properties
│       ├── registry.ts         # DataSourceRegistry
│       └── index.ts            # Default registry factory
├── context/
│   └── BlueprintContext.tsx     # App-wide state (graph, selection, mappings)
├── components/
│   ├── FormList.tsx             # Sidebar list of forms
│   ├── PrefillPanel.tsx         # Field mapping configuration
│   └── PrefillModal.tsx         # Data source selection modal
├── types.ts                    # All TypeScript interfaces
├── App.tsx                     # Root layout
└── App.css                     # All styles
```

### Key Design Decisions

**DAG Traversal** — `services/dag.ts` provides BFS traversal to find all ancestors (direct + transitive) of any node. This is used by data sources to determine which upstream forms can provide prefill values.

**Data Source Architecture** — The `PrefillDataSource` interface + `DataSourceRegistry` pattern follows the Strategy + Registry pattern. Each source is self-contained and produces `DataSourceGroup[]` that the UI renders generically. Sources are registered at startup and can be added/removed at runtime.

**State Management** — Uses React Context with `useCallback`-memoized actions instead of an external library. The context holds the graph data, selected node, and the full prefill mapping state. This keeps the dependency footprint minimal while remaining testable.

**CSS** — Plain CSS with BEM-style class naming and CSS custom properties for theming. No CSS-in-JS library overhead.

## How Prefill Works

1. **Select a form** from the sidebar
2. **View its fields** in the prefill panel — mapped fields show their source; unmapped fields are clickable
3. **Click an unmapped field** to open the data source modal
4. **Browse available data** — global properties and upstream form fields (resolved via DAG traversal)
5. **Select a source field** and confirm — the mapping is stored and displayed
6. **Clear a mapping** by clicking the × button

The DAG is:

```
Form A → Form B → Form D → Form F
Form A → Form C → Form E → Form F
```

For example, Form D can pull prefill data from Form B (direct dependency) and Form A (transitive dependency). Form F can pull from all five other forms.

## Extending with New Data Sources

The system is designed so **any combination of data sources works without code changes**. Adding a new source requires three steps:

### 1. Implement the `PrefillDataSource` interface

```typescript
// src/services/data-sources/my-source.ts
import type { ActionBlueprintGraph } from '../../types';
import type { DataSourceGroup, PrefillDataSource } from './types';

export class MyCustomSource implements PrefillDataSource {
  readonly id = 'my_custom';
  readonly label = 'My Custom Data';

  getGroups(nodeId: string, graph: ActionBlueprintGraph): DataSourceGroup[] {
    return [
      {
        sourceType: this.id,
        sourceId: 'my_source_1',
        sourceLabel: 'My Data Category',
        fields: [
          { key: 'field_a', label: 'Field A' },
          { key: 'field_b', label: 'Field B' },
        ],
      },
    ];
  }
}
```

### 2. Register it

```typescript
// src/services/data-sources/index.ts
import { MyCustomSource } from './my-source';

export function createDefaultRegistry(): DataSourceRegistry {
  return new DataSourceRegistry()
    .register(new GlobalDataSource())
    .register(new FormFieldsSource())
    .register(new MyCustomSource()); // ← add here
}
```

### 3. That's it

The modal will automatically pick up the new source and display it alongside existing ones. No component changes needed.

You can also register sources dynamically at runtime:

```typescript
const registry = createDefaultRegistry();
registry.register(new MyCustomSource());

<BlueprintProvider registry={registry}>
  <App />
</BlueprintProvider>
```

## Testing

64 tests across 7 test files covering:

- **DAG traversal** — ancestor resolution, dependency lookups, edge cases
- **Data sources** — form fields source, global source, registry behavior, custom source registration
- **Components** — form list rendering, selection, prefill panel, modal interaction, mapping creation/deletion

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
```

## Tech Stack

- **React 19** with TypeScript 6
- **Vite 8** for bundling
- **Vitest 4** + React Testing Library for tests
- **ESLint** + Prettier for code quality
- **Husky** + lint-staged for pre-commit hooks
