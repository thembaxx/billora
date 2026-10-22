import { useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '@phosphor-icons/react';
import type { ServiceRequest, Workspace } from '../../types';
import {
  isReady,
  localDay,
  requestEvent,
  requestKinds,
  requestLetter,
  type RequestMutation,
} from '../../lib/requests';
import { RequestEvidence } from './RequestEvidence';

export function RequestEditor({
  request: r,
  data,
  onMutate,
  onDone,
  hidden,
}: {
  request: ServiceRequest;
  data: Workspace;
  onMutate: RequestMutation;
  onDone: () => void;
  hidden: boolean;
}) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const patch = (fields: Partial<ServiceRequest>) =>
    onMutate(r.id, (current) => ({ ...current, ...fields, status: 'draft', confirmed: false }));
  function next(form: HTMLFormElement) {
    if (!form.reportValidity()) return;
    if (step < 2) setStep(step + 1);
    else if (
      isReady(r) &&
      onMutate(r.id, (current) => ({
        ...current,
        status: 'ready',
        events: [
          ...current.events,
          requestEvent('Request reviewed and marked ready. Nothing submitted.'),
        ],
      }))
    )
      onDone();
  }
  return (
    <form
      className="request-editor"
      onSubmit={(event) => {
        event.preventDefault();
        next(event.currentTarget);
      }}
    >
      <ol className="request-steps" aria-label="Request preparation steps">
        {['Describe', 'Gather evidence', 'Review'].map((label, i) => (
          <li
            key={label}
            aria-current={step === i ? 'step' : undefined}
            className={i < step ? 'complete' : ''}
          >
            <span>{i < step ? <CheckIcon size={14} /> : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="request-editor-heading">
        <h3 ref={heading} tabIndex={-1}>
          {
            [
              'First, tell the story.',
              'A little preparation helps.',
              'Everything, ready for your review.',
            ][step]
          }
        </h3>
        <p>Draft saved on this device as you make changes. Nothing is sent.</p>
      </div>
      {step === 0 && (
        <div className="form-stack">
          <div className="form-columns">
            <label>
              Property
              <select
                value={r.propertyId}
                onChange={(e) => {
                  const p = data.properties.find((p) => p.id === e.target.value);
                  if (p)
                    patch({
                      propertyId: p.id,
                      property: {
                        name: p.name,
                        address: p.address,
                        account: p.account,
                        municipality: p.municipality,
                      },
                      statement: undefined,
                      checked: [],
                    });
                }}
              >
                {data.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Issue type
              <select
                value={r.kind}
                onChange={(e) =>
                  patch({
                    kind: e.target.value as ServiceRequest['kind'],
                    checked: r.checked.filter((v) => v === 'authority'),
                  })
                }
              >
                {Object.entries(requestKinds).map(([id, value]) => (
                  <option key={id} value={id}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            What happened?
            <textarea
              value={r.description}
              minLength={20}
              maxLength={5000}
              required
              rows={5}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Explain what happened, where, and any steps you have already taken."
            />
            <small>
              At least 20 characters. Include useful facts and avoid unnecessary personal details.
            </small>
          </label>
          <label>
            What help would you like?
            <textarea
              value={r.desiredOutcome}
              minLength={5}
              maxLength={2000}
              required
              rows={3}
              onChange={(e) => patch({ desiredOutcome: e.target.value })}
              placeholder="For example, a breakdown of an estimated water charge."
            />
          </label>
          <div className="form-columns">
            <label>
              When did you first notice? <span className="optional">Optional</span>
              <input
                type="date"
                max={localDay()}
                value={r.incidentDate}
                onChange={(e) => patch({ incidentDate: e.target.value })}
              />
            </label>
            <label>
              Related statement <span className="optional">Optional</span>
              <select
                value={r.statement?.id || ''}
                onChange={(e) => {
                  const s = data.statements.find((s) => s.id === e.target.value);
                  patch({
                    statement: s
                      ? {
                          id: s.id,
                          period: s.period,
                          amount: s.amount,
                          source: s.source,
                          fileId: s.fileId,
                          fileName: s.fileName,
                        }
                      : undefined,
                  });
                }}
              >
                <option value="">No linked statement</option>
                {data.statements
                  .filter((s) => s.propertyId === r.propertyId)
                  .sort((a, b) => b.period.localeCompare(a.period))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.period} · {s.source === 'sample' ? 'Sample' : 'Reviewed import'}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {r.statement && (
            <p className="request-help">
              {r.statement.source === 'sample'
                ? 'This is an illustrative sample statement. It is labelled as a sample in your draft and is not evidence of a real bill.'
                : r.statement.fileId
                  ? 'The original PDF will be included in the request pack if it is still saved on this device.'
                  : 'This manually entered statement has no original PDF. Its reviewed figures will appear in the draft.'}
            </p>
          )}
        </div>
      )}
      {step === 1 && <RequestEvidence request={r} onMutate={onMutate} onBusy={setBusy} />}
      {step === 2 && (
        <>
          <div
            className="request-letter-preview"
            role="region"
            aria-label="Draft letter preview"
            tabIndex={0}
          >
            <span className="request-badge">UNSENT DRAFT</span>
            <pre>{requestLetter(r, false, hidden)}</pre>
          </div>
          <p className="request-help">
            Downloads include the full records and evidence even when balances are hidden. Free-text
            descriptions and original documents may also contain amounts.
          </p>
          <label className="check-label request-review">
            <input
              type="checkbox"
              required
              checked={r.confirmed}
              onChange={(e) =>
                onMutate(r.id, (current) => ({ ...current, confirmed: e.target.checked }))
              }
            />
            <span>
              I’ve reviewed the details and evidence. I understand Billora has not submitted this
              request.
            </span>
          </label>
        </>
      )}
      <div className="request-editor-actions">
        <button className="text-button muted" type="button" onClick={onDone} disabled={busy}>
          Save &amp; finish later
        </button>
        <div>
          {step > 0 && (
            <button
              className="button secondary"
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={busy}
            >
              <ArrowLeftIcon size={17} />
              Back
            </button>
          )}
          <button className="button primary" type="submit" disabled={busy}>
            {step < 2 ? 'Continue' : 'Mark ready for submission'}
            <ArrowRightIcon size={17} />
          </button>
        </div>
      </div>
    </form>
  );
}
