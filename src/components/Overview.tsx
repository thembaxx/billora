import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ArrowDownIcon,
  BuildingsIcon,
  CheckIcon,
  FileTextIcon,
  LeafIcon,
  PlusIcon,
  SparkleIcon,
  DropIcon,
  ShieldCheckIcon,
  ChartLineUpIcon,
} from '@phosphor-icons/react';
import type { Property, Settings, View, Workspace } from '../types';
import { dateLabel, latestStatements } from '../lib/data';
import Building from './Building';
import { AnimatedAmount } from './AnimatedAmount';
import { Flower } from './Flower';
import { SpendingChart } from './SpendingChart';
import { PropertyCard } from './PropertyCard';
import { RequestEntry } from './requests/RequestEntry';

interface Props {
  data: Workspace;
  settings: Settings;
  reduced: boolean;
  navigate: (v: View) => void;
  onImport: () => void;
  onProperty: (p: Property) => void;
  onReminders: () => void;
  onTour: () => void;
  onRequests: () => void;
}
export function Overview({
  data,
  settings,
  reduced,
  navigate,
  onImport,
  onProperty,
  onReminders,
  onTour,
  onRequests,
}: Props) {
  const latest = latestStatements(data);
  const total = latest.reduce((a, s) => a + s.amount, 0);
  const groups = [
    { key: 'electricity' as const, label: 'Electricity' },
    { key: 'water' as const, label: 'Water' },
    { key: 'rates' as const, label: 'Rates' },
    { key: 'services' as const, label: 'Other' },
  ].map((c) => ({ ...c, value: latest.reduce((a, s) => a + s.categories[c.key], 0) }));
  const largest = [...groups].sort((a, b) => b.value - a.value)[0];
  const next = latest
    .filter((s) => !s.paidNote)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const sample = data.statements.some((s) => s.source === 'sample');
  const remaining = next
    ? Math.round(
        (Date.parse(next.dueDate + 'T00:00:00Z') -
          Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) /
          86400000,
      )
    : 0;
  return (
    <>
      <div className="dashboard-grid">
        <section className="card balance-card reveal">
          <div className="card-heading">
            <span className="subtle">Latest account totals</span>
            <span className="tiny-tag">
              {sample
                ? data.statements.some((s) => s.source === 'imported')
                  ? 'Sample + imported'
                  : 'Sample overview'
                : 'Imported balances'}
              <span className="status-dot" />
            </span>
          </div>
          <div className="balance-amount numeric">
            {settings.hideBalances ? 'R •••••' : <AnimatedAmount value={total} reduced={reduced} />}
          </div>
          <p>
            Across {data.properties.length} municipal accounts{' '}
            <span className="balance-flower" aria-hidden="true">
              <Flower />
            </span>
          </p>
          <div className="segmented-bar" aria-hidden="true">
            {groups.map((c) => (
              <span key={c.key} style={{ width: `${total ? (c.value / total) * 100 : 0}%` }} />
            ))}
          </div>
          <div className="balance-legend">
            <span>
              <i /> Electricity
            </span>
            <span>
              <i /> Water
            </span>
            <span>
              <i /> Rates & more
            </span>
          </div>
        </section>
        <button className="card due-card reveal" onClick={onReminders}>
          <div className="card-heading">
            <span>Next due date</span>
            <span className="round-arrow">
              <ArrowUpRightIcon size={17} />
            </span>
          </div>
          {next ? (
            <>
              <div className="due-date">
                <strong className="numeric">{next.dueDate.slice(-2)}</strong>
                <span>
                  {dateLabel(next.dueDate, { month: 'short' })}
                  <small>{new Date(next.dueDate + 'T12:00:00').getFullYear()}</small>
                </span>
              </div>
              <div className="due-bottom">
                <span className="status-dot" />
                {remaining >= 0
                  ? `${remaining} days to go`
                  : `${Math.abs(remaining)} days past due`}
                <span className="due-bars" aria-hidden="true">
                  |||||||||||||
                </span>
              </div>
            </>
          ) : (
            <p>
              You’re all caught up.
              <br />A good place to be.
            </p>
          )}
        </button>
        <section className="feature-card reveal">
          <div className="feature-heading">
            <span className="feature-kicker">
              <span className="status-dot" /> YOUR LITTLE CORNER OF SA
            </span>
            <h2>
              A place for
              <br />
              every property.
            </h2>
            <p>
              One home or a growing portfolio.
              <br />
              See the whole picture.
            </p>
          </div>
          <div className="feature-orbit" aria-hidden="true" />
          <Building reduced={reduced} />
          <div className="feature-footer">
            <div>
              <span className="feature-number numeric">
                {String(data.properties.length).padStart(2, '0')}
              </span>
              <span>
                Properties
                <br />
                <small>A little more organised.</small>
              </span>
            </div>
            <button className="button white" onClick={() => navigate('properties')}>
              Explore properties
              <ArrowUpRightIcon size={17} />
            </button>
          </div>
        </section>
        <div className="chart-area reveal">
          <SpendingChart data={data} hidden={settings.hideBalances} />
        </div>
        <section className="card properties-overview reveal">
          <div className="card-heading">
            <div>
              <h2>Your places</h2>
              <p>Different addresses. One clear view.</p>
            </div>
            <button className="text-button" onClick={() => navigate('properties')}>
              View all
              <ArrowUpRightIcon size={15} />
            </button>
          </div>
          {data.properties.length ? (
            <div className="property-pair">
              {data.properties.slice(0, 2).map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  statement={latest.find((s) => s.propertyId === p.id)}
                  onClick={() => onProperty(p)}
                  hidden={settings.hideBalances}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <BuildingsIcon size={36} />
              <p>Your properties will feel right at home here.</p>
              <button className="button secondary" onClick={() => navigate('properties')}>
                Add a property
                <PlusIcon />
              </button>
            </div>
          )}
        </section>
        <section className="card insight-card reveal">
          <div className="card-heading">
            <span className="insight-icon">
              <SparkleIcon size={20} weight="duotone" />
            </span>
            <span className="tiny-tag">A little insight</span>
          </div>
          <h2>
            Good to know.
            <br />
            Even better to understand.
          </h2>
          <p>
            {data.statements.length
              ? `${largest.label} makes up the biggest share of your latest bills. See where the rest goes.`
              : 'Import a statement to start seeing your spending more clearly.'}
          </p>
          <div className="insight-visual" aria-hidden="true">
            {groups.slice(0, 3).map((c) => (
              <div className="mini-column" key={c.key}>
                <span
                  style={{
                    height: `${largest.value ? Math.max(4, (c.value / largest.value) * 90) : 4}%`,
                  }}
                />
                <small>{c.label}</small>
              </div>
            ))}
            <div className="floating-circle">
              <LeafIcon size={26} weight="light" />
            </div>
          </div>
          <button className="text-button" onClick={() => navigate('insights')}>
            Find your perspective
            <ArrowUpRightIcon size={17} />
          </button>
        </section>
      </div>
      <RequestEntry requests={data.requests} onOpen={onRequests} />
      <div className="bottom-grid">
        <section className="card getting-started reveal">
          <div className="card-heading">
            <div>
              <span className="eyebrow">MAKE YOURSELF AT HOME</span>
              <h2>Small steps. Nicely sorted.</h2>
            </div>
            <button className="icon-button" onClick={onTour} aria-label="Open Billora introduction">
              <ArrowUpRightIcon size={22} />
            </button>
          </div>
          <div className="setup-steps">
            <button onClick={() => navigate('properties')}>
              <span className={`step-circle ${!sample && data.properties.length ? 'done' : ''}`}>
                {!sample && data.properties.length ? <CheckIcon /> : <BuildingsIcon />}
              </span>
              <span>
                Add your own property<small>Your home. Your rental. Your business.</small>
              </span>
              <ArrowRightIcon />
            </button>
            <button onClick={onImport}>
              <span
                className={`step-circle ${data.statements.some((s) => s.source === 'imported') ? 'done' : ''}`}
              >
                <FileTextIcon />
              </span>
              <span>
                Import and review a bill<small>Check figures against your original PDF.</small>
              </span>
              <ArrowRightIcon />
            </button>
            <button onClick={() => navigate('insights')}>
              <span className="step-circle">
                <ChartLineUpIcon />
              </span>
              <span>
                Compare two months
                <small>Import consecutive months for the same property.</small>
              </span>
              <ArrowRightIcon />
            </button>
            <button onClick={onRequests}>
              <span className="step-circle">
                <FileTextIcon />
              </span>
              <span>
                Prepare your query pack
                <small>Review and download evidence. Submit it yourself.</small>
              </span>
              <ArrowRightIcon />
            </button>
          </div>
        </section>
        <section className="card reassurance-card reveal">
          <div className="reassurance-art" aria-hidden="true">
            <div />
            <ShieldCheckIcon size={47} weight="duotone" />
            <span />
          </div>
          <h2>
            Your accounts.
            <br />
            Your peace of mind.
          </h2>
          <p>
            Saved on this device. Payments stay with your municipality, exactly where they belong.
          </p>
          <span className="small-note">
            <DropIcon size={14} /> A calmer way to manage the everyday.
          </span>
        </section>
      </div>
      <footer className="app-footer">
        <span>
          <img src="/logo.png" width="19" alt="" />
          billora<span className="footer-dot">.</span>
          <small>A little clarity for everything home.</small>
        </span>
        <a href="https://github.com/thembaxx/billora" target="_blank" rel="noreferrer">
          Made for South Africa
          <ArrowUpRightIcon size={14} />
        </a>
        <a href="/?help=1">
          Help &amp; project notes <ArrowUpRightIcon size={14} />
        </a>
        <a href="/legal/">
          Privacy &amp; legal <ArrowUpRightIcon size={14} />
        </a>
        <button
          className="text-button"
          onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })}
        >
          Back to top
          <ArrowDownIcon style={{ rotate: '180deg' }} />
        </button>
      </footer>
    </>
  );
}
