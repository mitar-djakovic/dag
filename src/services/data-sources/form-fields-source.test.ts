import { describe, expect, it } from 'vitest';

import { MOCK_BLUEPRINT } from '../../api/mock-data';
import { FormFieldsSource } from './form-fields-source';

const source = new FormFieldsSource();

const NODE_IDS = {
  formA: 'form-47c61d17-62b0-4c42-8ca2-0eff641c9d88',
  formB: 'form-a4750667-d774-40fb-9b0a-44f8539ff6c4',
  formD: 'form-0f58384c-4966-4ce6-9ec2-40b96d61f745',
  formF: 'form-bad163fd-09bd-4710-ad80-245f31b797d5',
};

describe('FormFieldsSource', () => {
  it('has correct id and label', () => {
    expect(source.id).toBe('form_fields');
    expect(source.label).toBe('Form Fields');
  });

  it('returns no groups for root node (no ancestors)', () => {
    const groups = source.getGroups(NODE_IDS.formA, MOCK_BLUEPRINT);
    expect(groups).toHaveLength(0);
  });

  it('returns one group for Form B (ancestor: Form A)', () => {
    const groups = source.getGroups(NODE_IDS.formB, MOCK_BLUEPRINT);
    expect(groups).toHaveLength(1);
    expect(groups[0].sourceLabel).toBe('Form A');
    expect(groups[0].sourceType).toBe('form_fields');
    expect(groups[0].sourceId).toBe(NODE_IDS.formA);
  });

  it('returns two groups for Form D (ancestors: Form B, Form A)', () => {
    const groups = source.getGroups(NODE_IDS.formD, MOCK_BLUEPRINT);
    expect(groups).toHaveLength(2);
    const labels = groups.map((g) => g.sourceLabel);
    expect(labels).toContain('Form B');
    expect(labels).toContain('Form A');
  });

  it('returns five groups for Form F (all other forms)', () => {
    const groups = source.getGroups(NODE_IDS.formF, MOCK_BLUEPRINT);
    expect(groups).toHaveLength(5);
    const labels = groups.map((g) => g.sourceLabel).sort();
    expect(labels).toEqual(['Form A', 'Form B', 'Form C', 'Form D', 'Form E']);
  });

  it('each group contains non-button fields', () => {
    const groups = source.getGroups(NODE_IDS.formD, MOCK_BLUEPRINT);
    for (const group of groups) {
      expect(group.fields.length).toBeGreaterThan(0);
      const keys = group.fields.map((f) => f.key);
      expect(keys).not.toContain('button');
    }
  });

  it('each group has both key and label for fields', () => {
    const groups = source.getGroups(NODE_IDS.formB, MOCK_BLUEPRINT);
    for (const field of groups[0].fields) {
      expect(field.key).toBeTruthy();
      expect(field.label).toBeTruthy();
    }
  });
});
