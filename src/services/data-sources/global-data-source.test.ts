import { describe, expect, it } from 'vitest';

import { GlobalDataSource } from './global-data-source';

const source = new GlobalDataSource();

describe('GlobalDataSource', () => {
  it('has correct id and label', () => {
    expect(source.id).toBe('global');
    expect(source.label).toBe('Global Data');
  });

  it('returns Action Properties and Client Organisation Properties', () => {
    const groups = source.getGroups('any-node');
    expect(groups).toHaveLength(2);
    const labels = groups.map((g) => g.sourceLabel);
    expect(labels).toContain('Action Properties');
    expect(labels).toContain('Client Organisation Properties');
  });

  it('groups have sourceType "global"', () => {
    const groups = source.getGroups('any-node');
    for (const group of groups) {
      expect(group.sourceType).toBe('global');
    }
  });

  it('returns the same groups regardless of node ID', () => {
    const groups1 = source.getGroups('node-a');
    const groups2 = source.getGroups('node-z');
    expect(groups1).toEqual(groups2);
  });

  it('each group has fields with key and label', () => {
    const groups = source.getGroups('any-node');
    for (const group of groups) {
      expect(group.fields.length).toBeGreaterThan(0);
      for (const field of group.fields) {
        expect(field.key).toBeTruthy();
        expect(field.label).toBeTruthy();
      }
    }
  });
});
