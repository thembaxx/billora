import { useState, type FormEvent } from 'react';
import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  CalendarPlusIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import type { ServiceRequest } from '../../types';
import { portals } from '../../types';
import { download } from '../../lib/data';
import {
  followUpDue,
  localDay,
  requestCalendar,
  requestEvent,
  requestLetter,
  type RequestMutation,
} from '../../lib/requests';

export function RequestTracking({
  request: r,
  onMutate,
  notify,
}: {
  request: ServiceRequest;
  onMutate: RequestMutation;
  notify: (text: string) => void;
}) {
  const [mode, setMode] = useState<'submission' | 'note' | 'resolve' | null>(null);
  function record(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const submission = {
      reference: String(fields.get('reference')).trim(),
      channel: String(fields.get('channel')),
      date: String(fields.get('date')),
      followUpOn: String(fields.get('followUpOn') || ''),
    };
    if (!submission.reference) return;
    if (
      onMutate(r.id, (current) => ({
        ...current,
        status: 'submitted',
        submission,
        events: [
          ...current.events,
          requestEvent(
            `${current.submission ? 'Submission record updated' : 'Submission recorded'} by you: ${submission.reference} · ${submission.channel} · ${submission.date}. Not verified by the municipality.`,
          ),
        ],
      }))
    ) {
      setMode(null);
      notify('Your submission record was saved. Billora did not send anything.');
    }
  }
  return (
    <section className="request-tracking">
      <h3>Your next step</h3>
      <p className="request-help">
        Submit through an official channel, then record what you did. Billora does not send
        requests, verify receipts or fetch municipal updates.
      </p>
      <a
        className="button primary"
        href={portals[r.property.municipality]}
        target="_blank"
        rel="noreferrer"
      >
        {r.property.municipality === 'Other municipality'
          ? 'Find official municipal contact'
          : 'Open official municipal portal'}
        <ArrowUpRightIcon size={18} />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <p className="request-help">
        Portal features vary. Confirm the correct query or service-reporting channel with your
        municipality.
      </p>
      {r.status === 'draft' && (
        <p className="note-box">Finish reviewing your draft before recording a submission.</p>
      )}
      {(r.status === 'ready' || r.status === 'submitted') && mode === null && (
        <div className="request-action-row">
          <button className="button secondary" onClick={() => setMode('submission')}>
            {r.submission ? 'Edit my submission record' : 'Record my submission'}
            <PlusIcon size={17} />
          </button>
          {r.status === 'submitted' && (
            <button className="text-button" onClick={() => setMode('resolve')}>
              Mark resolved for my records <CheckCircleIcon size={18} />
            </button>
          )}
        </div>
      )}
      {r.submission && r.status !== 'resolved' && (
        <div className="request-submission-summary">
          <div>
            <span className="request-badge">RECORDED BY YOU</span>
            <strong>{r.submission.reference}</strong>
            <p>
              {r.submission.date} · {r.submission.channel}
            </p>
          </div>
          {r.submission.followUpOn && (
            <div>
              <small>{followUpDue(r) ? 'Your follow-up is due' : 'Your follow-up date'}</small>
              <strong className="numeric">{r.submission.followUpOn}</strong>
              <small>Chosen by you · not an official deadline</small>
            </div>
          )}
        </div>
      )}
      {r.status === 'submitted' && r.submission && (
        <div className="request-action-row">
          <button
            className="button secondary small"
            onClick={() => {
              download(requestLetter(r, true), `billora-follow-up-${r.localReference}.txt`);
              onMutate(r.id, (current) => ({
                ...current,
                events: [
                  ...current.events,
                  requestEvent('Follow-up draft prepared locally. Nothing sent.'),
                ],
              }));
              notify('Follow-up draft downloaded. Review it before using the official channel.');
            }}
          >
            <ArrowDownIcon size={17} />
            Download follow-up draft
          </button>
          {r.submission.followUpOn && (
            <button
              className="button secondary small"
              onClick={() => {
                download(
                  requestCalendar(r),
                  `billora-follow-up-${r.submission!.followUpOn}.ics`,
                  'text/calendar',
                );
                notify(
                  'Personal reminder downloaded. Open it in your calendar; no background alert is scheduled by Billora.',
                );
              }}
            >
              <CalendarPlusIcon size={17} />
              Calendar reminder
            </button>
          )}
        </div>
      )}
      {mode === 'submission' && (
        <form className="form-stack request-tracking-form" onSubmit={record}>
          <h4>Record your official-channel submission</h4>
          <label>
            Municipal reference / receipt number
            <input
              name="reference"
              required
              maxLength={100}
              defaultValue={r.submission?.reference || ''}
              placeholder="Reference received from the official channel"
            />
          </label>
          <div className="form-columns">
            <label>
              Submitted through
              <select name="channel" defaultValue={r.submission?.channel || 'Official portal'}>
                {[
                  'Official portal',
                  'Municipal email',
                  'Municipal office',
                  'Municipal phone line',
                  'Other official channel',
                ].map((channel) => (
                  <option key={channel}>{channel}</option>
                ))}
              </select>
            </label>
            <label>
              Submission date
              <input
                type="date"
                name="date"
                required
                max={localDay()}
                defaultValue={r.submission?.date || localDay()}
              />
            </label>
          </div>
          <label>
            Personal follow-up date <span className="optional">Optional</span>
            <input type="date" name="followUpOn" defaultValue={r.submission?.followUpOn || ''} />
            <small>Your chosen reminder date, not a promised municipal response deadline.</small>
          </label>
          <label className="check-label">
            <input type="checkbox" required />
            <span>
              I submitted this through an official channel. This is my own record, not a
              municipality-verified update.
            </span>
          </label>
          <div className="request-action-row">
            <button className="button primary" type="submit">
              Save submission record
            </button>
            <button className="text-button muted" type="button" onClick={() => setMode(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {mode === 'resolve' && (
        <div className="request-tracking-form">
          <p>
            This records your own resolution update. Billora has not confirmed it with the
            municipality.
          </p>
          <div className="request-action-row">
            <button
              className="button primary"
              onClick={() => {
                if (
                  onMutate(r.id, (current) => ({
                    ...current,
                    status: 'resolved',
                    events: [
                      ...current.events,
                      requestEvent('Marked resolved by you. Not municipality-verified.'),
                    ],
                  }))
                ) {
                  setMode(null);
                  notify('Resolution recorded for your own records.');
                }
              }}
            >
              Confirm my resolution note
            </button>
            <button className="text-button muted" onClick={() => setMode(null)}>
              Keep open
            </button>
          </div>
        </div>
      )}
      {r.status === 'resolved' && (
        <button
          className="text-button"
          onClick={() => {
            onMutate(r.id, (current) => ({
              ...current,
              status: current.submission ? 'submitted' : 'draft',
              events: [...current.events, requestEvent('Reopened by you for further follow-up.')],
            }));
          }}
        >
          Reopen for my records <ArrowUpRightIcon size={17} />
        </button>
      )}
      <div className="request-timeline-heading">
        <h3>Your activity timeline</h3>
        <button className="text-button" onClick={() => setMode(mode === 'note' ? null : 'note')}>
          Add a note <PlusIcon size={16} />
        </button>
      </div>
      {mode === 'note' && (
        <form
          className="form-stack request-tracking-form"
          onSubmit={(event) => {
            event.preventDefault();
            const text = String(new FormData(event.currentTarget).get('note') || '').trim();
            if (
              text &&
              onMutate(r.id, (current) => ({
                ...current,
                events: [...current.events, requestEvent(`Note recorded by you: ${text}`)],
              }))
            )
              setMode(null);
          }}
        >
          <label>
            Your update
            <textarea
              name="note"
              required
              maxLength={2000}
              rows={3}
              placeholder="For example, who you spoke to and what was agreed."
            />
          </label>
          <div className="request-action-row">
            <button className="button primary small" type="submit">
              Save note
            </button>
            <button className="text-button muted" type="button" onClick={() => setMode(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <ol className="request-timeline">
        {[...r.events].reverse().map((entry) => (
          <li key={entry.id}>
            <span className="request-timeline-dot" aria-hidden="true" />
            <div>
              <p>{entry.text}</p>
              <time dateTime={entry.at}>
                {new Date(entry.at).toLocaleString('en-ZA', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                · local record
              </time>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
