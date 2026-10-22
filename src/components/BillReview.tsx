import { ArrowUpRightIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { Settings, Statement, Workspace } from '../types';
import { billChanges, type BillChange } from '../lib/insights';
import { dateLabel, money } from '../lib/data';

export function BillReview({
  data,
  settings,
  onStatement,
  onRequest,
}: {
  data: Workspace;
  settings: Settings;
  onStatement: (statement: Statement) => void;
  onRequest: (change: BillChange) => void;
}) {
  const changes = billChanges(data);
  const alerts = changes.filter((change) => change.notable);
  const privacy = (value: number) => settings.hideBalances ? 'R •••••' : money(value);
  return (
    <section className="card bill-review" aria-labelledby="bill-review-title">
      <div className="card-heading">
        <div>
          <h2 id="bill-review-title">Your bill, a little clearer.</h2>
          <p>Reviewed personal statements only. Compare consecutive months and check the source.</p>
        </div>
        <WarningCircleIcon size={24} weight="duotone" />
      </div>
      {!changes.length ? (
        <p className="small-note">
          Your first comparison starts when you have two consecutive months of imported bills for
          the same property. Sample data is never used for alerts.
        </p>
      ) : (
        <>
          {alerts.length > 0 && (
            <p className="import-notice" role="status">
              <WarningCircleIcon size={18} />
              {alerts.length} notable increase{alerts.length === 1 ? '' : 's'} worth reviewing.
              These are comparisons, not confirmed billing errors.
            </p>
          )}
          <div className="bill-review-list">
            {changes.map((change) => (
              <article
                key={change.current.id + '-' + change.category}
                className={change.notable ? 'bill-review-row notable' : 'bill-review-row'}
              >
                <div>
                  <strong>{change.label}</strong>
                  <small>
                    {change.propertyName} · {dateLabel(change.previous.period + '-01', { month: 'short', year: 'numeric' })}
                    {' → '}
                    {dateLabel(change.current.period + '-01', { month: 'short', year: 'numeric' })}
                  </small>
                  <small>
                    {privacy(change.before)} → {privacy(change.after)}
                    {change.percent === null ? ' · Previous amount was zero' :
                      ' · ' + Math.abs(change.percent).toFixed(1) + '% ' +
                        (change.difference >= 0 ? 'increase' : 'decrease')}
                  </small>
                </div>
                <div className="bill-review-actions">
                  <strong className="numeric">
                    {settings.hideBalances ? 'R •••••' :
                      (change.difference >= 0 ? '+' : '−') + money(Math.abs(change.difference))}
                  </strong>
                  <button className="text-button" onClick={() => onStatement(change.previous)}>
                    Previous bill <ArrowUpRightIcon size={15} />
                  </button>
                  <button className="text-button" onClick={() => onStatement(change.current)}>
                    Current bill <ArrowUpRightIcon size={15} />
                  </button>
                  {change.notable && (
                    <button className="text-button" onClick={() => onRequest(change)}>
                      Prepare a query <ArrowUpRightIcon size={15} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <p className="small-note">
            Flags require a rise of at least 30% and R100 for a reviewed category
            (R250 for the total). They cannot establish faulty readings, tariff errors or debt.
            Unreviewed category allocations are excluded.
          </p>
        </>
      )}
    </section>
  );
}
