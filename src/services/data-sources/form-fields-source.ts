import type { ActionBlueprintGraph } from '../../types';
import {
  findNode,
  getAllAncestors,
  getFormDefinitionForNode,
  getSourceFields,
} from '../dag';
import type { DataSourceGroup, PrefillDataSource } from './types';

/**
 * Provides upstream form fields as prefill data.
 * Traverses the DAG to find all direct and transitive dependencies,
 * returning each ancestor form's fields as a separate group.
 */
export const FORM_FIELDS_SOURCE_ID = 'form_fields';

export class FormFieldsSource implements PrefillDataSource {
  readonly id = FORM_FIELDS_SOURCE_ID;
  readonly label = 'Form Fields';

  getGroups(nodeId: string, graph: ActionBlueprintGraph): DataSourceGroup[] {
    const ancestorIds = getAllAncestors(nodeId, graph.nodes);

    return ancestorIds.reduce<DataSourceGroup[]>((groups, ancestorId) => {
      const ancestorNode = findNode(ancestorId, graph.nodes);
      if (!ancestorNode) return groups;

      const formDef = getFormDefinitionForNode(ancestorNode, graph.forms);
      if (!formDef) return groups;

      const fields = getSourceFields(formDef);
      if (fields.length === 0) return groups;

      groups.push({
        sourceType: this.id,
        sourceId: ancestorId,
        sourceLabel: ancestorNode.data.name,
        fields,
      });

      return groups;
    }, []);
  }
}
