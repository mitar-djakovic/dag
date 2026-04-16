import { useMemo, useState } from 'react';

import { useBlueprint } from '../context/BlueprintContext';
import { resolveNodeContext } from '../services/dag';
import type { PrefillMapping } from '../types';
import { PrefillModal } from './PrefillModal';

export function PrefillPanel() {
  const { graph, selectedNodeId, getMappingsForNode, clearMapping } =
    useBlueprint();
  const [modalFieldKey, setModalFieldKey] = useState<string | null>(null);

  const nodeContext = useMemo(() => {
    if (!graph || !selectedNodeId) return null;
    return resolveNodeContext(selectedNodeId, graph);
  }, [graph, selectedNodeId]);

  if (!selectedNodeId || !nodeContext) {
    return (
      <div className="prefill-panel prefill-panel--empty">
        <p>Select a form to configure prefill mappings</p>
      </div>
    );
  }

  const { node, prefillableFields } = nodeContext;
  const mappings = getMappingsForNode(selectedNodeId);

  const handleClearMapping = (fieldKey: string) => {
    clearMapping(selectedNodeId, fieldKey);
  };

  const formatMappingLabel = (mapping: PrefillMapping) =>
    `${mapping.sourceLabel}.${mapping.sourceFieldKey}`;

  return (
    <div className="prefill-panel">
      <div className="prefill-panel__header">
        <h2>{node.data.name}</h2>
        <p className="prefill-panel__subtitle">Prefill configuration</p>
      </div>

      <div className="prefill-panel__toggle">
        <span>Prefill fields for this form</span>
        <span
          className="toggle toggle--active"
          role="switch"
          aria-checked="true"
          tabIndex={0}
        >
          <span className="toggle__track">
            <span className="toggle__thumb" />
          </span>
        </span>
      </div>

      <ul className="prefill-panel__fields">
        {prefillableFields.map(({ key, label }) => {
          const mapping = mappings[key];
          const isMapped = Boolean(mapping);

          return (
            <li
              key={key}
              className={`prefill-field ${isMapped ? 'prefill-field--mapped' : 'prefill-field--unmapped'}`}
            >
              {isMapped ? (
                <div className="prefill-field__content">
                  <span className="prefill-field__label">
                    {label}: {formatMappingLabel(mapping)}
                  </span>
                  <button
                    className="prefill-field__clear"
                    onClick={() => handleClearMapping(key)}
                    aria-label={`Clear prefill for ${label}`}
                    type="button"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle
                        cx="7"
                        cy="7"
                        r="6"
                        fill="currentColor"
                        opacity="0.15"
                      />
                      <path
                        d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  className="prefill-field__content prefill-field__content--clickable"
                  onClick={() => setModalFieldKey(key)}
                  type="button"
                >
                  <span className="prefill-field__icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <ellipse
                        cx="8"
                        cy="8"
                        rx="7"
                        ry="4"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />
                      <ellipse
                        cx="8"
                        cy="8"
                        rx="7"
                        ry="7"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />
                    </svg>
                  </span>
                  <span className="prefill-field__label">{label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {modalFieldKey !== null && (
        <PrefillModal
          nodeId={selectedNodeId}
          fieldKey={modalFieldKey}
          fieldLabel={
            prefillableFields.find((f) => f.key === modalFieldKey)?.label ??
            modalFieldKey
          }
          onClose={() => setModalFieldKey(null)}
        />
      )}
    </div>
  );
}
