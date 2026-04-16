import type { ActionBlueprintGraph } from '../types';

const API_BASE_URL = 'http://localhost:3000';
const TENANT_ID = '1';
const BLUEPRINT_ID = 'bp_01jk766tckfwx84xjcxazggzyc';

export async function fetchBlueprint(): Promise<ActionBlueprintGraph> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/${TENANT_ID}/actions/blueprints/${BLUEPRINT_ID}/graph`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as ActionBlueprintGraph;
  } catch {
    throw new Error('Failed to fetch blueprint');
  }
}
