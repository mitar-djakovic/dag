import type {
  ActionBlueprintGraph,
  FieldProperty,
  FormDefinition,
  FormNode,
} from '../types';

export interface FormField {
  key: string;
  label: string;
  property: FieldProperty;
}

export interface NodeContext {
  node: FormNode;
  formDef: FormDefinition;
  prefillableFields: FormField[];
}

export function findNode(
  nodeId: string,
  nodes: FormNode[],
): FormNode | undefined {
  return nodes.find((n) => n.id === nodeId);
}

export function getDirectDependencies(
  nodeId: string,
  nodes: FormNode[],
): string[] {
  return findNode(nodeId, nodes)?.data.prerequisites ?? [];
}

/**
 * BFS traversal to collect every ancestor of `nodeId` in the DAG.
 * Returns node IDs in breadth-first order (direct deps first).
 */
export function getAllAncestors(nodeId: string, nodes: FormNode[]): string[] {
  const visited = new Set<string>();
  const queue = [...getDirectDependencies(nodeId, nodes)];
  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    result.push(current);
    queue.push(...getDirectDependencies(current, nodes));
  }

  return result;
}

export function getFormDefinitionForNode(
  node: FormNode,
  forms: FormDefinition[],
): FormDefinition | undefined {
  return forms.find((f) => f.id === node.data.component_id);
}

const NON_PREFILLABLE_TYPES = new Set(['button']);

export function getPrefillableFields(formDef: FormDefinition): FormField[] {
  return Object.entries(formDef.field_schema.properties)
    .filter(([, prop]) => !NON_PREFILLABLE_TYPES.has(prop.avantos_type))
    .map(([key, prop]) => ({
      key,
      label: prop.title ?? key,
      property: prop,
    }));
}

/**
 * Lightweight projection of prefillable fields for data source groups.
 * Derives from `getPrefillableFields` to keep the filter logic in one place.
 */
export function getSourceFields(
  formDef: FormDefinition,
): Array<{ key: string; label: string }> {
  return getPrefillableFields(formDef).map(({ key, label }) => ({
    key,
    label,
  }));
}

export function resolveNodeContext(
  nodeId: string,
  graph: ActionBlueprintGraph,
): NodeContext | null {
  const node = findNode(nodeId, graph.nodes);
  if (!node) return null;

  const formDef = getFormDefinitionForNode(node, graph.forms);
  if (!formDef) return null;

  return {
    node,
    formDef,
    prefillableFields: getPrefillableFields(formDef),
  };
}
