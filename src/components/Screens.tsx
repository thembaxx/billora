import { useState } from 'react';
import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  BuildingsIcon,
  CheckCircleIcon,
  FileArrowDownIcon,
  FileTextIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  MapTrifoldIcon,
  PlusIcon,
  SparkleIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';
import type { Property, Settings, Statement, Workspace } from '../types';
import { latestStatements, money, dateLabel, download } from '../lib/data';
import { PropertyCard } from './PropertyCard';
import { SpendingChart } from './SpendingChart';
import { AccountCabinet } from './AccountCabinet';
import { RequestEntry } from './requests/RequestEntry';
import { PlaceExplorer } from './PlaceExplorer';

export function Properties({
  data,
  settings,
  onAdd,
  onProperty,
  onDemo,
  onRequests,
}: {
  data: Workspace;
  settings: Settings;
  onAdd: () => void;
  onProperty: (p: Property) => void;
  onDemo: () => void;
  onRequests: () => void;
}) {
  const [filter, setFilter] = useState('All properties');
  const [mapView, setMapView] = useState(false);
  const latest = latestStatements(data);
  const rows = data.properties.filter((p) => filter === 'All properties' || p.kind === filter);
  return (
    <>
      <div className="screen-toolbar">
        <span className="count-label">{data.properties.length} places. One workspace.</span>
        <button
          className="button secondary small"
          type="button"
          aria-pressed={mapView}
          onClick={() => setMapView((value) => !value)}
        >
          <MapTrifoldIcon size={18} />
          {mapView ? 'Cards view' : 'Explore map'}
        </button>
        <label className="select-control">
          <FunnelSimpleIcon />
          <select
            aria-label="Filter properties"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {['All properties', 'Home', 'Rental', 'Business'].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      </div>
      {mapView && (
        <section className="card geo-properties-panel">
          <PlaceExplorer properties={rows} onProperty={onProperty} />
          <p className="small-note">
            Only properties with a saved map pin appear as markers. Sample addresses have not been
            geocoded, and Billora never sends your saved addresses to search automatically.
          </p>
        </section>
      )}
      {!mapView && (
        <div className="property-grid">
          {rows.map((p) => (
            <PropertyCard
              large
              key={p.id}
              property={p}
              statement={latest.find((s) => s.propertyId === p.id)}
              hidden={settings.hideBalances}
              onClick={() => onProperty(p)}
            />
          ))}
          <button className="add-property-tile" onClick={onAdd}>
            <span>
              <PlusIcon size={26} />
            </span>
            <h2>Room for one more.</h2>
            <p>
              Add a home, rental or business property.
              <br />
              Make the whole picture a little clearer.
            </p>
            <span className="text-button">
              Add a property
              <ArrowUpRightIcon />
            </span>
          </button>
        </div>
      )}
      <RequestEntry requests={data.requests} onOpen={onRequests} />
      <div className="demo-entry demo-entry-wide">
        <div>
          <span className="demo-label">DEMO INTEGRATION</span>
          <h3>See what a connected account could feel like.</h3>
          <p>
            Preview a cloud profile, authorisation and municipal account sync using simulated data.
          </p>
        </div>
        <button className="button secondary" onClick={onDemo}>
          Explore demo
          <ArrowUpRightIcon />
        </button>
      </div>
      <div className="info-banner">
        <BuildingsIcon size={24} />
        <div>
          <strong>Across municipalities. All together.</strong>
          <p>
            Bring accounts from any South African municipality. All balances come from the
            statements you import.
          </p>
        </div>
      </div>
    </>
  );
}

export function Statements({
  data,
  settings,
  onImport,
  onStatement,
}: {
  data: Workspace;
  settings: Settings;
  onImport: () => void;
  onStatement: (s: Statement) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const rows = [...data.statements]
    .filter(
      (s) =>
        (filter === 'all' || s.propertyId === filter) &&
        `${data.properties.find((p) => p.id === s.propertyId)?.name} ${s.period} ${s.fileName || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.period.localeCompare(a.period) || b.importedAt.localeCompare(a.importedAt));
  const exportCSV = () => {
    const quote = (v: string) => `"${v.replaceAll('"', '""')}"`;
    download(
      [
        'Property,Period,Amount (ZAR),Due date,Source,Personal payment note',
        ...rows.map((s) =>
          [
            quote(data.properties.find((p) => p.id === s.propertyId)?.name || ''),
            s.period,
            s.amount,
            s.dueDate,
            s.source,
            s.paidNote ? 'Marked paid by you' : 'Unmarked',
          ].join(','),
        ),
      ].join('\r\n'),
      'billora-statements.csv',
      'text/csv',
    );
  };
  return (
    <>
      <div className="statement-intro">
        <div className="document-stack" aria-hidden="true">
          <FileTextIcon size={40} weight="duotone" />
          <span />
          <span />
        </div>
        <div>
          <h2>A home for every statement.</h2>
          <p>Original PDFs, amounts and due dates. All easy to find.</p>
        </div>
        <button className="button secondary" onClick={onImport}>
          <UploadSimpleIcon />
          Import a statement
        </button>
      </div>
      <section className="card statement-library">
        <div className="screen-toolbar">
          <label className="search-field">
            <MagnifyingGlassIcon size={18} />
            <input
              placeholder="Find a statement…"
              aria-label="Find a statement"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="toolbar-actions">
            <select
              aria-label="Filter statements by property"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All properties</option>
              {data.properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button className="button secondary small" onClick={exportCSV} disabled={!rows.length}>
              <ArrowDownIcon />
              Export CSV
            </button>
          </div>
        </div>
        <ul className="mobile-statements" aria-label="Municipal statements">
          {rows.map((s) => (
            <li key={s.id}>
              <button onClick={() => onStatement(s)} className="mobile-statement">
                <span className="mobile-statement-heading">
                  <span className="file-icon">
                    <FileTextIcon size={22} weight="duotone" />
                  </span>
                  <span>
                    <strong>
                      {data.properties.find((p) => p.id === s.propertyId)?.name || 'Property'}
                    </strong>
                    <small>{dateLabel(s.period + '-01', { month: 'long', year: 'numeric' })}</small>
                  </span>
                  <ArrowUpRightIcon size={18} />
                </span>
                <span className="mobile-statement-detail">
                  <strong className="numeric">
                    {settings.hideBalances ? 'R •••••' : money(s.amount)}
                  </strong>
                  <span>Due {dateLabel(s.dueDate)}</span>
                  <span className={`source-badge ${s.source}`}>
                    {s.source === 'sample' ? 'Sample' : 'Imported'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Statement / property</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Due date</th>
                <th>Source</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <button className="statement-name" onClick={() => onStatement(s)}>
                      <span className="file-icon">
                        <FileTextIcon size={23} weight="duotone" />
                      </span>
                      <span>
                        <strong>
                          {data.properties.find((p) => p.id === s.propertyId)?.name || 'Property'}
                        </strong>
                        <small>{s.fileName || 'Municipal account summary'}</small>
                      </span>
                    </button>
                  </td>
                  <td>{dateLabel(s.period + '-01', { month: 'short', year: 'numeric' })}</td>
                  <td className="numeric">{settings.hideBalances ? 'R •••••' : money(s.amount)}</td>
                  <td>{dateLabel(s.dueDate)}</td>
                  <td>
                    <span className={`source-badge ${s.source}`}>
                      {s.source === 'sample' ? 'Sample' : 'Imported'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      onClick={() => onStatement(s)}
                      aria-label={`Open ${s.period} statement for ${data.properties.find((p) => p.id === s.propertyId)?.name}`}
                    >
                      <ArrowUpRightIcon size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="empty-state">
            <FileArrowDownIcon size={44} />
            <h2>{query ? 'No matching statements.' : 'Your next chapter starts here.'}</h2>
            <p>
              {query
                ? 'Try another property name or month.'
                : 'Import your first municipal PDF to keep everything in one place.'}
            </p>
            <button className="button primary" onClick={onImport}>
              Import a statement
              <PlusIcon />
            </button>
          </div>
        )}
        <div className="table-footer">
          {rows.length} statements
          <span>
            <CheckCircleIcon /> Originals stay on this device
          </span>
        </div>
      </section>
    </>
  );
}

export function Insights({ data, settings }: { data: Workspace; settings: Settings }) {
  const latest = latestStatements(data);
  const sum = latest.reduce((a, s) => a + s.amount, 0);
  const categories = [
    {
      key: 'electricity' as const,
      label: 'Electricity',
      color: 'orange',
      note: 'Powering your everyday',
    },
    { key: 'water' as const, label: 'Water', color: 'blue', note: 'Every drop, accounted for' },
    {
      key: 'rates' as const,
      label: 'Property rates',
      color: 'green',
      note: 'Your part in the neighbourhood',
    },
    {
      key: 'services' as const,
      label: 'Other / unallocated',
      color: 'purple',
      note: 'Refuse, sanitation and more',
    },
  ].map((c) => ({ ...c, total: latest.reduce((a, s) => a + s.categories[c.key], 0) }));
  return (
    <>
      <SpendingChart data={data} hidden={settings.hideBalances} expanded />
      <div className="insights-grid">
        <section className="card category-card">
          <div className="card-heading">
            <div>
              <h2>Where it all goes</h2>
              <p>Your latest imported account breakdown.</p>
            </div>
            <SparkleIcon size={24} />
          </div>
          <div className="category-bars">
            {categories.map((c) => (
              <div key={c.key} className="category-row">
                <span className={`category-dot ${c.color}`} />
                <div>
                  <strong>{c.label}</strong>
                  <small>{c.note}</small>
                </div>
                <strong className="numeric">
                  {settings.hideBalances ? 'R •••••' : money(c.total)}
                </strong>
                <span className="numeric muted">
                  {sum ? Math.round((c.total / sum) * 100) : 0}%
                </span>
                <div className="category-track">
                  <span
                    className={c.color}
                    style={{ width: `${sum ? (c.total / sum) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="note-box category-context">
            <div>
              <strong>Make room for a closer look.</strong>
              <p>
                A change can come from usage, tariffs or estimated readings. These figures help you
                compare statements; they don’t confirm billing errors or a live municipal balance.
              </p>
            </div>
          </div>
        </section>
        <AccountCabinet
          data={data}
          hidden={settings.hideBalances}
          reduced={settings.reduceMotion}
        />
      </div>
    </>
  );
}
