import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBlueprint } from '../context/BlueprintContext';
import type {
  DataSourceField,
  DataSourceGroup,
} from '../services/data-sources';
import type { PrefillMapping } from '../types';

interface PrefillModalProps {
  nodeId: string;
  fieldKey: string;
  fieldLabel: string;
  onClose: () => void;
}

export function PrefillModal({
  nodeId,
  fieldKey,
  fieldLabel,
  onClose,
}: PrefillModalProps) {
  const { graph, registry, setMapping } = useBlueprint();
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<{
    group: DataSourceGroup;
    field: DataSourceField;
  } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const allGroups = useMemo(() => {
    if (!graph) return [];
    return registry.getAllGroups(nodeId, graph);
  }, [graph, registry, nodeId]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return allGroups;
    const term = search.toLowerCase();
    return allGroups
      .map((group) => ({
        ...group,
        fields: group.fields.filter(
          (f) =>
            f.label.toLowerCase().includes(term) ||
            f.key.toLowerCase().includes(term),
        ),
      }))
      .filter(
        (group) =>
          group.fields.length > 0 ||
          group.sourceLabel.toLowerCase().includes(term),
      );
  }, [allGroups, search]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const handleSelect = useCallback(() => {
    if (!selectedItem) return;

    const mapping: PrefillMapping = {
      sourceType: selectedItem.group.sourceType,
      sourceId: selectedItem.group.sourceId,
      sourceLabel: selectedItem.group.sourceLabel,
      sourceFieldKey: selectedItem.field.key,
      sourceFieldLabel: selectedItem.field.label,
    };

    setMapping(nodeId, fieldKey, mapping);
    onClose();
  }, [selectedItem, setMapping, nodeId, fieldKey, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const getGroupKey = (group: DataSourceGroup) =>
    `${group.sourceType}:${group.sourceId}`;

  const isFieldSelected = (group: DataSourceGroup, field: DataSourceField) =>
    selectedItem?.group.sourceId === group.sourceId &&
    selectedItem?.group.sourceType === group.sourceType &&
    selectedItem?.field.key === field.key;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-label={`Select data element for ${fieldLabel}`}
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h3>Select data element to map</h3>
          <p className="modal__subtitle">
            Mapping to: <strong>{fieldLabel}</strong>
          </p>
        </div>

        <div className="modal__body">
          <div className="modal__sidebar">
            <label className="modal__search-label" htmlFor="data-source-search">
              Available data
            </label>
            <div className="modal__search-wrapper">
              <svg
                className="modal__search-icon"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="6"
                  cy="6"
                  r="4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <line
                  x1="9.5"
                  y1="9.5"
                  x2="13"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                id="data-source-search"
                type="text"
                className="modal__search"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <ul className="modal__groups" role="tree">
              {filteredGroups.length === 0 && (
                <li className="modal__empty">No data sources available</li>
              )}

              {filteredGroups.map((group) => {
                const groupKey = getGroupKey(group);
                const isExpanded = expandedGroups.has(groupKey);

                return (
                  <li key={groupKey} role="treeitem" aria-expanded={isExpanded}>
                    <button
                      className="modal__group-header"
                      onClick={() => toggleGroup(groupKey)}
                      type="button"
                      aria-expanded={isExpanded}
                    >
                      <span
                        className={`modal__chevron ${isExpanded ? 'modal__chevron--open' : ''}`}
                        aria-hidden="true"
                      >
                        <svg
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
                      </span>
                      {group.sourceLabel}
                    </button>

                    {isExpanded && (
                      <ul className="modal__fields" role="group">
                        {group.fields.map((field) => (
                          <li key={field.key}>
                            <button
                              className={`modal__field ${isFieldSelected(group, field) ? 'modal__field--selected' : ''}`}
                              onClick={() => setSelectedItem({ group, field })}
                              type="button"
                            >
                              {field.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="modal__preview">
            {selectedItem ? (
              <div className="modal__preview-content">
                <p className="modal__preview-label">Selected</p>
                <p className="modal__preview-value">
                  {selectedItem.group.sourceLabel}.{selectedItem.field.key}
                </p>
                <dl className="modal__preview-details">
                  <dt>Source</dt>
                  <dd>{selectedItem.group.sourceLabel}</dd>
                  <dt>Field</dt>
                  <dd>{selectedItem.field.label}</dd>
                  <dt>Type</dt>
                  <dd>{selectedItem.group.sourceType}</dd>
                </dl>
              </div>
            ) : (
              <p className="modal__preview-empty">
                Select a field from the left panel
              </p>
            )}
          </div>
        </div>

        <div className="modal__footer">
          <button
            className="btn btn--secondary"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleSelect}
            disabled={!selectedItem}
            type="button"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
