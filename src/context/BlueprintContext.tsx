import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { fetchBlueprint } from '../api/client';
import type { DataSourceRegistry } from '../services/data-sources';
import { createDefaultRegistry } from '../services/data-sources';
import type {
  ActionBlueprintGraph,
  PrefillMapping,
  PrefillState,
} from '../types';

interface BlueprintContextValue {
  graph: ActionBlueprintGraph | null;
  loading: boolean;
  error: string | null;
  selectedNodeId: string | null;
  selectNode: (nodeId: string | null) => void;
  prefillMappings: PrefillState;
  setMapping: (
    nodeId: string,
    fieldKey: string,
    mapping: PrefillMapping,
  ) => void;
  clearMapping: (nodeId: string, fieldKey: string) => void;
  getMappingsForNode: (nodeId: string) => Record<string, PrefillMapping>;
  registry: DataSourceRegistry;
}

const BlueprintContext = createContext<BlueprintContextValue | null>(null);

interface BlueprintProviderProps {
  children: ReactNode;
  registry?: DataSourceRegistry;
}

export function BlueprintProvider({
  children,
  registry: externalRegistry,
}: BlueprintProviderProps) {
  const [graph, setGraph] = useState<ActionBlueprintGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [prefillMappings, setPrefillMappings] = useState<PrefillState>({});

  const registry = useMemo(
    () => externalRegistry ?? createDefaultRegistry(),
    [externalRegistry],
  );

  useEffect(() => {
    let cancelled = false;

    fetchBlueprint()
      .then((data) => {
        if (!cancelled) {
          setGraph(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load blueprint',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const setMapping = useCallback(
    (nodeId: string, fieldKey: string, mapping: PrefillMapping) => {
      setPrefillMappings((prev) => ({
        ...prev,
        [nodeId]: { ...prev[nodeId], [fieldKey]: mapping },
      }));
    },
    [],
  );

  const clearMapping = useCallback((nodeId: string, fieldKey: string) => {
    setPrefillMappings((prev) => {
      const nodeMappings = { ...prev[nodeId] };
      delete nodeMappings[fieldKey];
      return { ...prev, [nodeId]: nodeMappings };
    });
  }, []);

  const getMappingsForNode = useCallback(
    (nodeId: string) => prefillMappings[nodeId] ?? {},
    [prefillMappings],
  );

  const value = useMemo<BlueprintContextValue>(
    () => ({
      graph,
      loading,
      error,
      selectedNodeId,
      selectNode,
      prefillMappings,
      setMapping,
      clearMapping,
      getMappingsForNode,
      registry,
    }),
    [
      graph,
      loading,
      error,
      selectedNodeId,
      selectNode,
      prefillMappings,
      setMapping,
      clearMapping,
      getMappingsForNode,
      registry,
    ],
  );

  return (
    <BlueprintContext.Provider value={value}>
      {children}
    </BlueprintContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBlueprint(): BlueprintContextValue {
  const context = useContext(BlueprintContext);
  if (!context) {
    throw new Error('useBlueprint must be used within a BlueprintProvider');
  }
  return context;
}
