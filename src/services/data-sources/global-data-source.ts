import type { DataSourceGroup, PrefillDataSource } from './types';

/**
 * Provides global (non-form) data that can prefill any form.
 * Add new properties here or create additional global sources
 * to extend the available prefill data.
 */
export class GlobalDataSource implements PrefillDataSource {
  readonly id = 'global';
  readonly label = 'Global Data';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getGroups(_nodeId: string): DataSourceGroup[] {
    return [
      {
        sourceType: this.id,
        sourceId: 'action_properties',
        sourceLabel: 'Action Properties',
        fields: [
          { key: 'action_id', label: 'Action ID' },
          { key: 'action_name', label: 'Action Name' },
          { key: 'created_at', label: 'Created At' },
          { key: 'status', label: 'Status' },
        ],
      },
      {
        sourceType: this.id,
        sourceId: 'client_org_properties',
        sourceLabel: 'Client Organisation Properties',
        fields: [
          { key: 'org_id', label: 'Organisation ID' },
          { key: 'org_name', label: 'Organisation Name' },
          { key: 'org_email', label: 'Organisation Email' },
          { key: 'org_country', label: 'Country' },
        ],
      },
    ];
  }
}
