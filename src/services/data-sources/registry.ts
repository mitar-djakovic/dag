import type { ActionBlueprintGraph } from '../../types';
import type { DataSourceGroup, PrefillDataSource } from './types';

/**
 * Central registry for all prefill data sources.
 *
 * Supports runtime registration so new sources can be added without
 * modifying existing code (Open/Closed Principle).
 */
export class DataSourceRegistry {
  private sources: PrefillDataSource[] = [];

  register(source: PrefillDataSource): this {
    if (this.sources.some((s) => s.id === source.id)) {
      throw new Error(`Data source "${source.id}" is already registered`);
    }
    this.sources.push(source);
    return this;
  }

  unregister(sourceId: string): this {
    this.sources = this.sources.filter((s) => s.id !== sourceId);
    return this;
  }

  getSources(): readonly PrefillDataSource[] {
    return this.sources;
  }

  /**
   * Aggregates groups from every registered source for a given node.
   */
  getAllGroups(nodeId: string, graph: ActionBlueprintGraph): DataSourceGroup[] {
    return this.sources.flatMap((source) => source.getGroups(nodeId, graph));
  }
}
