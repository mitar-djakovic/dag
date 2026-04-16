import { describe, expect, it } from 'vitest';

import { MOCK_BLUEPRINT } from '../../api/mock-data';
import { FormFieldsSource } from './form-fields-source';
import { GlobalDataSource } from './global-data-source';
import { DataSourceRegistry } from './registry';
import type { DataSourceGroup, PrefillDataSource } from './types';

const NODE_IDS = {
  formA: 'form-47c61d17-62b0-4c42-8ca2-0eff641c9d88',
  formD: 'form-0f58384c-4966-4ce6-9ec2-40b96d61f745',
};

describe('DataSourceRegistry', () => {
  it('starts with no sources', () => {
    const registry = new DataSourceRegistry();
    expect(registry.getSources()).toHaveLength(0);
  });

  it('registers and retrieves sources', () => {
    const registry = new DataSourceRegistry();
    registry.register(new GlobalDataSource());
    expect(registry.getSources()).toHaveLength(1);
  });

  it('supports fluent registration', () => {
    const registry = new DataSourceRegistry()
      .register(new GlobalDataSource())
      .register(new FormFieldsSource());
    expect(registry.getSources()).toHaveLength(2);
  });

  it('prevents duplicate source IDs', () => {
    const registry = new DataSourceRegistry();
    registry.register(new GlobalDataSource());
    expect(() => registry.register(new GlobalDataSource())).toThrow(
      'already registered',
    );
  });

  it('unregisters a source', () => {
    const registry = new DataSourceRegistry();
    registry.register(new GlobalDataSource());
    registry.unregister('global');
    expect(registry.getSources()).toHaveLength(0);
  });

  it('aggregates groups from all sources', () => {
    const registry = new DataSourceRegistry()
      .register(new GlobalDataSource())
      .register(new FormFieldsSource());

    const groups = registry.getAllGroups(NODE_IDS.formD, MOCK_BLUEPRINT);
    const types = new Set(groups.map((g) => g.sourceType));
    expect(types.has('global')).toBe(true);
    expect(types.has('form_fields')).toBe(true);
  });

  it('returns empty groups for root node with only form source', () => {
    const registry = new DataSourceRegistry().register(new FormFieldsSource());
    const groups = registry.getAllGroups(NODE_IDS.formA, MOCK_BLUEPRINT);
    expect(groups).toHaveLength(0);
  });

  it('supports custom data sources', () => {
    class CustomSource implements PrefillDataSource {
      readonly id = 'custom';
      readonly label = 'Custom Data';
      getGroups(): DataSourceGroup[] {
        return [
          {
            sourceType: 'custom',
            sourceId: 'custom_1',
            sourceLabel: 'Custom Source',
            fields: [{ key: 'custom_field', label: 'Custom Field' }],
          },
        ];
      }
    }

    const registry = new DataSourceRegistry().register(new CustomSource());
    const groups = registry.getAllGroups(NODE_IDS.formA, MOCK_BLUEPRINT);
    expect(groups).toHaveLength(1);
    expect(groups[0].sourceType).toBe('custom');
  });
});
