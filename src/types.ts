// ── API Response Types ──

export interface ActionBlueprintGraph {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  category: string;
  nodes: FormNode[];
  edges: Edge[];
  forms: FormDefinition[];
}

export interface FormNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FormNodeData;
}

export interface FormNodeData {
  id: string;
  component_key: string;
  component_type: string;
  component_id: string;
  name: string;
  prerequisites: string[];
  input_mapping: Record<string, unknown>;
  permitted_roles: string[];
  sla_duration: { number: number; unit: string };
  approval_required: boolean;
  approval_roles: string[];
}

export interface Edge {
  source: string;
  target: string;
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  is_reusable: boolean;
  field_schema: FieldSchema;
  ui_schema: UISchema;
  dynamic_field_config: Record<string, DynamicFieldConfig>;
}

export interface FieldSchema {
  type: string;
  properties: Record<string, FieldProperty>;
  required: string[];
}

export interface FieldProperty {
  type: string;
  avantos_type: string;
  title?: string;
  format?: string;
  items?: unknown;
  uniqueItems?: boolean;
  enum?: unknown;
}

export interface UISchema {
  type: string;
  elements: UISchemaElement[];
}

export interface UISchemaElement {
  type: string;
  scope: string;
  label: string;
  options?: Record<string, unknown>;
}

export interface DynamicFieldConfig {
  selector_field: string;
  payload_fields: Record<string, { type: string; value: string }>;
  endpoint_id: string;
}

// ── Prefill Domain Types ──

export interface PrefillMapping {
  sourceType: string;
  sourceId: string;
  sourceLabel: string;
  sourceFieldKey: string;
  sourceFieldLabel: string;
}

/**
 * Prefill state indexed by node ID, then by field key.
 * e.g. { "form-abc": { "email": { sourceType: "form_field", ... } } }
 */
export type PrefillState = Record<string, Record<string, PrefillMapping>>;
