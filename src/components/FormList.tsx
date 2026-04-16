import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBlueprint } from '../context/BlueprintContext';
import type { NodeContext } from '../services/dag';
import {
  getAllAncestors,
  getFormDefinitionForNode,
  resolveNodeContext,
} from '../services/dag';
import { FORM_FIELDS_SOURCE_ID } from '../services/data-sources';
import type { FormNode } from '../types';

interface QuickMapTarget {
  sourceFieldKey: string;
  sourceFieldLabel: string;
}

function QuickMapDropdown({
  targetFormName,
  unmappedFields,
  onSelect,
  onClose,
}: {
  targetFormName: string;
  unmappedFields: Array<{ key: string; label: string }>;
  onSelect: (targetFieldKey: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="quick-map" ref={ref} role="menu">
      <p className="quick-map__header">
        Map to field on <strong>{targetFormName}</strong>
      </p>
      {unmappedFields.length === 0 ? (
        <p className="quick-map__empty">All fields are already mapped</p>
      ) : (
        <ul className="quick-map__list">
          {unmappedFields.map((field) => (
            <li key={field.key}>
              <button
                className="quick-map__option"
                onClick={() => onSelect(field.key)}
                type="button"
                role="menuitem"
              >
                {field.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface FormListItemProps {
  node: FormNode;
  isSelected: boolean;
  onSelect: () => void;
  isUpstreamOfSelected: boolean;
  selectedNodeContext: NodeContext | null;
  unmappedFields: Array<{ key: string; label: string }>;
}

function FormListItem({
  node,
  isSelected,
  onSelect,
  isUpstreamOfSelected,
  selectedNodeContext,
  unmappedFields,
}: FormListItemProps) {
  const { graph, selectedNodeId, setMapping } = useBlueprint();
  const [expanded, setExpanded] = useState(false);
  const [quickMapSource, setQuickMapSource] = useState<QuickMapTarget | null>(
    null,
  );

  const formDef = useMemo(() => {
    if (!graph) return null;
    return getFormDefinitionForNode(node, graph.forms);
  }, [graph, node]);

  const fields = useMemo(() => {
    if (!formDef) return [];
    return Object.entries(formDef.field_schema.properties).map(
      ([key, prop]) => ({
        key,
        label: prop.title ?? key,
        type: prop.avantos_type,
        dataType: prop.type,
        required: formDef.field_schema.required.includes(key),
      }),
    );
  }, [formDef]);

  const depCount = node.data.prerequisites.length;

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

  const handlePropertyClick = useCallback(
    (fieldKey: string, fieldLabel: string) => {
      if (!isUpstreamOfSelected) return;
      setQuickMapSource((prev) =>
        prev?.sourceFieldKey === fieldKey
          ? null
          : { sourceFieldKey: fieldKey, sourceFieldLabel: fieldLabel },
      );
    },
    [isUpstreamOfSelected],
  );

  const handleQuickMap = useCallback(
    (targetFieldKey: string) => {
      if (!selectedNodeId || !quickMapSource) return;
      setMapping(selectedNodeId, targetFieldKey, {
        sourceType: FORM_FIELDS_SOURCE_ID,
        sourceId: node.id,
        sourceLabel: node.data.name,
        sourceFieldKey: quickMapSource.sourceFieldKey,
        sourceFieldLabel: quickMapSource.sourceFieldLabel,
      });
      setQuickMapSource(null);
    },
    [selectedNodeId, quickMapSource, setMapping, node.id, node.data.name],
  );

  return (
    <li role="option" aria-selected={isSelected}>
      <div
        className={`form-list__item ${isSelected ? 'form-list__item--selected' : ''}`}
      >
        <button
          className="form-list__expand"
          onClick={toggleExpand}
          aria-expanded={expanded}
          aria-label={`Toggle ${node.data.name} properties`}
          type="button"
        >
          <svg
            className={`form-list__chevron ${expanded ? 'form-list__chevron--open' : ''}`}
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
          >
            <path
              d="M3 2L7 5L3 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button className="form-list__select" onClick={onSelect} type="button">
          <span className="form-list__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect
                x="1"
                y="1"
                width="14"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="4"
                y1="5"
                x2="12"
                y2="5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="4"
                y1="8"
                x2="12"
                y2="8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="4"
                y1="11"
                x2="9"
                y2="11"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </span>
          <span className="form-list__name">{node.data.name}</span>
          {depCount > 0 && (
            <span className="form-list__badge" title="Dependencies">
              {depCount}
            </span>
          )}
        </button>
      </div>

      {expanded && fields.length > 0 && (
        <ul className="form-list__props">
          {fields.map((field) => {
            const isActive = quickMapSource?.sourceFieldKey === field.key;

            return (
              <li
                key={field.key}
                className={`form-list__prop ${isUpstreamOfSelected ? 'form-list__prop--clickable' : ''} ${isActive ? 'form-list__prop--active' : ''}`}
              >
                <button
                  className="form-list__prop-btn"
                  onClick={() => handlePropertyClick(field.key, field.label)}
                  disabled={!isUpstreamOfSelected}
                  type="button"
                  title={
                    isUpstreamOfSelected
                      ? `Map ${field.label} to a field on the selected form`
                      : undefined
                  }
                >
                  <span className="form-list__prop-name">
                    {field.label}
                    {field.required && (
                      <span
                        className="form-list__prop-required"
                        title="Required"
                      >
                        *
                      </span>
                    )}
                  </span>
                  <span className="form-list__prop-type">{field.type}</span>
                </button>

                {isActive && selectedNodeContext && (
                  <QuickMapDropdown
                    targetFormName={selectedNodeContext.node.data.name}
                    unmappedFields={unmappedFields}
                    onSelect={handleQuickMap}
                    onClose={() => setQuickMapSource(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function FormList() {
  const { graph, selectedNodeId, selectNode, getMappingsForNode } =
    useBlueprint();

  const sortedNodes = useMemo(() => {
    if (!graph) return [];
    return [...graph.nodes].sort(
      (a, b) => a.position.x - b.position.x || a.position.y - b.position.y,
    );
  }, [graph]);

  const selectedNodeAncestors = useMemo(() => {
    if (!graph || !selectedNodeId) return new Set<string>();
    return new Set(getAllAncestors(selectedNodeId, graph.nodes));
  }, [graph, selectedNodeId]);

  const selectedNodeContext = useMemo(() => {
    if (!graph || !selectedNodeId) return null;
    return resolveNodeContext(selectedNodeId, graph);
  }, [graph, selectedNodeId]);

  const unmappedFields = useMemo(() => {
    if (!selectedNodeId || !selectedNodeContext) return [];
    const mappings = getMappingsForNode(selectedNodeId);
    return selectedNodeContext.prefillableFields
      .filter((f) => !mappings[f.key])
      .map((f) => ({ key: f.key, label: f.label }));
  }, [selectedNodeId, selectedNodeContext, getMappingsForNode]);

  if (!graph) return null;

  return (
    <nav className="form-list" aria-label="Form list">
      <h2 className="form-list__title">Forms</h2>
      <ul className="form-list__items" role="listbox">
        {sortedNodes.map((node) => (
          <FormListItem
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            onSelect={() =>
              selectNode(node.id === selectedNodeId ? null : node.id)
            }
            isUpstreamOfSelected={selectedNodeAncestors.has(node.id)}
            selectedNodeContext={selectedNodeContext}
            unmappedFields={unmappedFields}
          />
        ))}
      </ul>
    </nav>
  );
}
