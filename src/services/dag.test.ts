import { describe, expect, it } from 'vitest';

import { MOCK_BLUEPRINT } from '../api/mock-data';
import type { FormNode } from '../types';
import {
  findNode,
  getAllAncestors,
  getDirectDependencies,
  getFormDefinitionForNode,
  getPrefillableFields,
  getSourceFields,
  resolveNodeContext,
} from './dag';

const { nodes, forms } = MOCK_BLUEPRINT;

const NODE_IDS = {
  formA: 'form-47c61d17-62b0-4c42-8ca2-0eff641c9d88',
  formB: 'form-a4750667-d774-40fb-9b0a-44f8539ff6c4',
  formC: 'form-7c26f280-7bff-40e3-b9a5-0533136f52c3',
  formD: 'form-0f58384c-4966-4ce6-9ec2-40b96d61f745',
  formE: 'form-e15d42df-c7c0-4819-9391-53730e6d47b3',
  formF: 'form-bad163fd-09bd-4710-ad80-245f31b797d5',
};

describe('findNode', () => {
  it('returns the node when found', () => {
    const node = findNode(NODE_IDS.formA, nodes);
    expect(node).toBeDefined();
    expect(node!.data.name).toBe('Form A');
  });

  it('returns undefined for unknown ID', () => {
    expect(findNode('nonexistent', nodes)).toBeUndefined();
  });
});

describe('getDirectDependencies', () => {
  it('returns empty array for root node (Form A)', () => {
    expect(getDirectDependencies(NODE_IDS.formA, nodes)).toEqual([]);
  });

  it('returns single dependency for Form B', () => {
    expect(getDirectDependencies(NODE_IDS.formB, nodes)).toEqual([
      NODE_IDS.formA,
    ]);
  });

  it('returns multiple dependencies for Form F', () => {
    const deps = getDirectDependencies(NODE_IDS.formF, nodes);
    expect(deps).toHaveLength(2);
    expect(deps).toContain(NODE_IDS.formD);
    expect(deps).toContain(NODE_IDS.formE);
  });

  it('returns empty array for unknown node', () => {
    expect(getDirectDependencies('nonexistent', nodes)).toEqual([]);
  });
});

describe('getAllAncestors', () => {
  it('returns empty array for root node', () => {
    expect(getAllAncestors(NODE_IDS.formA, nodes)).toEqual([]);
  });

  it('returns only Form A for Form B (single hop)', () => {
    const ancestors = getAllAncestors(NODE_IDS.formB, nodes);
    expect(ancestors).toEqual([NODE_IDS.formA]);
  });

  it('returns Form B and Form A for Form D (two hops)', () => {
    const ancestors = getAllAncestors(NODE_IDS.formD, nodes);
    expect(ancestors).toHaveLength(2);
    expect(ancestors).toContain(NODE_IDS.formB);
    expect(ancestors).toContain(NODE_IDS.formA);
  });

  it('returns all ancestors for Form F (deepest node)', () => {
    const ancestors = getAllAncestors(NODE_IDS.formF, nodes);
    expect(ancestors).toHaveLength(5);
    expect(ancestors).toContain(NODE_IDS.formD);
    expect(ancestors).toContain(NODE_IDS.formE);
    expect(ancestors).toContain(NODE_IDS.formB);
    expect(ancestors).toContain(NODE_IDS.formC);
    expect(ancestors).toContain(NODE_IDS.formA);
  });

  it('does not include the node itself', () => {
    const ancestors = getAllAncestors(NODE_IDS.formF, nodes);
    expect(ancestors).not.toContain(NODE_IDS.formF);
  });

  it('handles shared ancestors without duplicates', () => {
    const ancestors = getAllAncestors(NODE_IDS.formF, nodes);
    const unique = new Set(ancestors);
    expect(unique.size).toBe(ancestors.length);
  });
});

describe('getFormDefinitionForNode', () => {
  it('resolves the correct form definition', () => {
    const nodeB = findNode(NODE_IDS.formB, nodes) as FormNode;
    const formDef = getFormDefinitionForNode(nodeB, forms);
    expect(formDef).toBeDefined();
    expect(formDef!.id).toBe('f_01jk7awbhqewgbkbgk8rjm7bv7');
  });

  it('multiple nodes can share the same form definition', () => {
    const nodeA = findNode(NODE_IDS.formA, nodes) as FormNode;
    const nodeD = findNode(NODE_IDS.formD, nodes) as FormNode;
    const formA = getFormDefinitionForNode(nodeA, forms);
    const formD = getFormDefinitionForNode(nodeD, forms);
    expect(formA!.id).toBe(formD!.id);
  });
});

describe('getPrefillableFields', () => {
  it('excludes button fields', () => {
    const formDef = forms[0];
    const fields = getPrefillableFields(formDef);
    const fieldKeys = fields.map((f) => f.key);
    expect(fieldKeys).not.toContain('button');
  });

  it('includes all non-button fields', () => {
    const formDef = forms[0];
    const fields = getPrefillableFields(formDef);
    const fieldKeys = fields.map((f) => f.key);
    expect(fieldKeys).toContain('email');
    expect(fieldKeys).toContain('name');
    expect(fieldKeys).toContain('id');
    expect(fieldKeys).toContain('notes');
    expect(fieldKeys).toContain('dynamic_checkbox_group');
    expect(fieldKeys).toContain('dynamic_object');
    expect(fieldKeys).toContain('multi_select');
  });

  it('uses title as label when available', () => {
    const formDef = forms[0];
    const fields = getPrefillableFields(formDef);
    const emailField = fields.find((f) => f.key === 'email');
    expect(emailField!.label).toBe('Email');
  });

  it('falls back to key when title is missing', () => {
    const formDef = forms[0];
    const fields = getPrefillableFields(formDef);
    const checkboxField = fields.find(
      (f) => f.key === 'dynamic_checkbox_group',
    );
    expect(checkboxField!.label).toBe('dynamic_checkbox_group');
  });
});

describe('getSourceFields', () => {
  it('returns the same fields as getPrefillableFields (minus property)', () => {
    const formDef = forms[0];
    const sourceFields = getSourceFields(formDef);
    const prefillFields = getPrefillableFields(formDef);
    expect(sourceFields.map((f) => f.key)).toEqual(
      prefillFields.map((f) => f.key),
    );
  });
});

describe('resolveNodeContext', () => {
  it('returns full context for a valid node', () => {
    const ctx = resolveNodeContext(NODE_IDS.formB, MOCK_BLUEPRINT);
    expect(ctx).not.toBeNull();
    expect(ctx!.node.data.name).toBe('Form B');
    expect(ctx!.formDef).toBeDefined();
    expect(ctx!.prefillableFields.length).toBeGreaterThan(0);
  });

  it('returns null for unknown node', () => {
    expect(resolveNodeContext('nonexistent', MOCK_BLUEPRINT)).toBeNull();
  });
});
