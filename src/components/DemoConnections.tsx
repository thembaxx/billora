import { useState, type FormEvent } from 'react';
import {
  ArrowClockwiseIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CloudIcon,
  LinkIcon,
  PlugIcon,
  ShieldCheckIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import type { Workspace } from '../types';
import {
  demoResponse,
  readDemo,
  saveDemo,
  type DemoConnection,
  type DemoWorkspace,
} from '../lib/demo';
import { download, money } from '../lib/data';
import { Modal } from './Modal';

export function DemoConnections({
  data,
  onClose,
  onAddProperty,
}: {
  data: Workspace;
  onClose: () => void;
  onAddProperty: () => void;
}) {
  const [demo, setDemo] = useState<DemoWorkspace>(readDemo);
  const [propertyId, setPropertyId] = useState(data.properties[0]?.id || '');
  const [authorised, setAuthorised] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const property = data.properties.find((p) => p.id === propertyId);
  function persist(next: DemoWorkspace) {
    try {
      saveDemo(next);
      setDemo(next);
      return true;
    } catch {
      setError('This browser couldn’t save the demo. Check device storage and try again.');
      return false;
    }
  }
  function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get('name') || '').trim(),
      email = String(fields.get('email') || '').trim();
    if (!name || !email) return;
    setError('');
    if (
      persist({
        account: {
          id: crypto.randomUUID(),
          name,
          email,
          createdAt: new Date().toISOString(),
          demo: true,
        },
        connections: [],
      })
    )
      setMessage('Demo cloud account created. This profile is saved only in this browser.');
  }
  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authorised || !property || !demo.account) return;
    setBusy(property.id);
    setError('');
    setMessage('');
    await new Promise((resolve) => setTimeout(resolve, 350));
    const now = new Date().toISOString();
    const previous = demo.connections.find((c) => c.propertyId === property.id);
    const connection: DemoConnection = {
      id: previous?.id || crypto.randomUUID(),
      propertyId: property.id,
      municipality: property.municipality,
      demo: true,
      authorisedAt: now,
      lastSyncedAt: now,
    };
    if (
      persist({
        ...demo,
        connections: [...demo.connections.filter((c) => c.propertyId !== property.id), connection],
      })
    ) {
      setAuthorised(false);
      setMessage('Demo connection ready. The balance below is simulated, not live municipal data.');
    }
    setBusy(null);
  }
  async function sync(connection: DemoConnection) {
    setBusy(connection.id);
    setMessage('');
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (
      persist({
        ...demo,
        connections: demo.connections.map((c) =>
          c.id === connection.id ? { ...c, lastSyncedAt: new Date().toISOString() } : c,
        ),
      })
    )
      setMessage('Demo sync complete. Simulated response refreshed on this device.');
    setBusy(null);
  }
  return (
    <Modal
      title="A connected future. A clear demo."
      description="Preview cloud accounts and authorised municipal connections."
      onClose={onClose}
      wide
    >
      <div className="demo-disclosure">
        <span className="demo-label">DEMO INTEGRATION</span>
        <p>
          This is a local simulation. No cloud account is created, no municipality is connected, and
          no data is sent. Authorisation and sync results below are for demonstration only.
        </p>
      </div>
      {!demo.account ? (
        <form className="form-stack demo-profile-form" onSubmit={createAccount}>
          <div className="demo-section-heading">
            <CloudIcon size={24} weight="duotone" />
            <div>
              <h3>Your demo cloud account</h3>
              <p>Try the account experience with made-up details.</p>
            </div>
          </div>
          <div className="form-columns">
            <label>
              Demo display name
              <input
                name="name"
                required
                maxLength={50}
                placeholder="Alex Morgan"
                autoComplete="off"
              />
            </label>
            <label>
              Demo email address
              <input
                name="email"
                required
                type="email"
                maxLength={160}
                placeholder="alex@example.com"
                autoComplete="off"
              />
            </label>
          </div>
          <p className="small-note">
            Use a made-up address. No password is needed and no email will be sent.
          </p>
          <button className="button primary full" type="submit">
            Create demo cloud account
            <ArrowRightIcon />
          </button>
        </form>
      ) : (
        <>
          <div className="demo-account">
            <span className="demo-account-icon">
              <CloudIcon size={24} weight="duotone" />
            </span>
            <div>
              <strong>{demo.account.name}</strong>
              <small>{demo.account.email}</small>
              <span>Demo profile · stored on this device</span>
            </div>
            <span className="demo-label">DEMO</span>
          </div>
          <div className="demo-section-heading">
            <PlugIcon size={24} weight="duotone" />
            <div>
              <h3>Preview an authorised connection</h3>
              <p>Walk through consent without using municipal credentials.</p>
            </div>
          </div>
          {data.properties.length ? (
            <form className="form-stack" onSubmit={(event) => void connect(event)}>
              <label>
                Property for demo connection
                <select
                  aria-label="Property for demo connection"
                  value={propertyId}
                  onChange={(e) => {
                    setPropertyId(e.target.value);
                    setAuthorised(false);
                  }}
                >
                  {data.properties.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="demo-provider">
                <span>
                  <LinkIcon size={19} /> {property?.municipality}
                </span>
                <small>Simulated connector · no live partnership</small>
              </div>
              <div className="demo-scopes">
                <span>
                  <CheckCircleIcon />
                  View a simulated balance
                </span>
                <span>
                  <CheckCircleIcon />
                  Preview statement availability
                </span>
                <span>
                  <ShieldCheckIcon />
                  Read-only demo permissions
                </span>
              </div>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={authorised}
                  required
                  onChange={(e) => setAuthorised(e.target.checked)}
                />
                For this demo, I confirm I’m authorised to manage this property.
              </label>
              <button className="button primary full" type="submit" disabled={!!busy}>
                {busy === propertyId ? 'Simulating connection…' : 'Connect demo account'}
                <ArrowRightIcon />
              </button>
            </form>
          ) : (
            <div className="note-box demo-empty">
              <p>Add a property before previewing a municipal connection.</p>
              <button className="button secondary" onClick={onAddProperty}>
                Add property
                <ArrowRightIcon />
              </button>
            </div>
          )}
          {demo.connections
            .filter((c) => data.properties.some((p) => p.id === c.propertyId))
            .map((connection) => {
              const response = demoResponse(connection);
              return (
                <section className="demo-connection" key={connection.id}>
                  <div className="card-heading">
                    <div>
                      <h3>{data.properties.find((p) => p.id === connection.propertyId)?.name}</h3>
                      <p>{connection.municipality}</p>
                    </div>
                    <span className="demo-label">DEMO CONNECTION</span>
                  </div>
                  <div className="demo-balance">
                    <span>
                      Simulated balance
                      <strong className="numeric">{money(response.balance.amount)}</strong>
                      <small>{response.reference}</small>
                    </span>
                    <span>
                      <strong className="numeric">{response.statementCount}</strong>demo statements
                    </span>
                  </div>
                  <p className="demo-sync-time">
                    Last demo sync:{' '}
                    {new Date(connection.lastSyncedAt).toLocaleString('en-ZA', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    . Nothing was retrieved from a municipality.
                  </p>
                  <div className="demo-connection-actions">
                    <button
                      className="button secondary small"
                      onClick={() => void sync(connection)}
                      disabled={!!busy}
                    >
                      <ArrowClockwiseIcon />
                      {busy === connection.id ? 'Simulating…' : 'Run demo sync'}
                    </button>
                    <button
                      className="button secondary small"
                      onClick={() =>
                        download(
                          JSON.stringify(response, null, 2),
                          'billora-demo-response.json',
                          'application/json',
                        )
                      }
                    >
                      <ArrowDownIcon />
                      Demo response
                    </button>
                    <button
                      className="text-button muted"
                      onClick={() => {
                        if (
                          persist({
                            ...demo,
                            connections: demo.connections.filter((c) => c.id !== connection.id),
                          })
                        )
                          setMessage('Demo connection removed.');
                      }}
                    >
                      Disconnect demo
                    </button>
                  </div>
                </section>
              );
            })}
          <button
            className="text-button muted demo-reset"
            onClick={() => {
              if (persist({ account: null, connections: [] }))
                setMessage('Demo account and simulated connections reset.');
            }}
          >
            <TrashIcon size={15} />
            Reset demo account & connections
          </button>
        </>
      )}
      {message && (
        <p className="demo-success" role="status">
          <CheckCircleIcon size={20} />
          {message}
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <p className="small-note demo-footer">
        Real cloud authentication, protected storage and municipal access require a separate
        production backend and authorised provider agreements. Demo balances never change your
        imported statements or payment notes.{' '}
        <a
          className="inline-policy-link"
          href="/legal/integrations/"
          target="_blank"
          rel="noreferrer"
        >
          Read the integration disclaimer<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </Modal>
  );
}
