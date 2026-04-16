import type { ActionBlueprintGraph } from '../../types';

export interface DataSourceField {
  key: string;
  label: string;
}

/**
 * A group of fields from a single source, e.g. "Form B" or "Action Properties".
 * Carries enough context to create a PrefillMapping when a field is selected.
 */
export interface DataSourceGroup {
  sourceType: string;
  sourceId: string;
  sourceLabel: string;
  fields: DataSourceField[];
}

/**
 * Contract for any data source that can provide prefill values.
 *
 * To add a new source (e.g. "External API", "Environment Variables"):
 * 1. Create a class implementing this interface
 * 2. Register it with the DataSourceRegistry
 *
 * @see {@link ../../README.md} for the full extension guide.
 */
export interface PrefillDataSource {
  readonly id: string;
  readonly label: string;

  /**
   * Returns groups of fields available to prefill `nodeId`.
   * Each group represents a logical source (e.g. a specific upstream form).
   */
  getGroups(nodeId: string, graph: ActionBlueprintGraph): DataSourceGroup[];
}
