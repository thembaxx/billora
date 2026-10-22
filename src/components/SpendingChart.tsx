import { useState } from 'react';
import { TrendDownIcon } from '@phosphor-icons/react';
import type { Workspace } from '../types';
import { money } from '../lib/data';
import { AnimatedTabs } from './AnimatedTabs';

export function SpendingChart({
  data,
  hidden = false,
  expanded = false,
}: {
  data: Workspace;
  hidden?: boolean;
  expanded?: boolean;
}) {
  const [range, setRange] = useState<'6m' | 'year'>('6m');
  const [hover, setHover] = useState<number | null>(null);
  const count = range === '6m' ? 6 : 12;
  const latest =
    data.statements
      .map((s) => s.period)
      .sort()
      .at(-1) || new Date().toISOString().slice(0, 7);
  const [year, month] = latest.split('-').map(Number);
  const points = Array.from({ length: count }, (_, i) => {
    const d = new Date(year, month - count + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return {
      label: d.toLocaleDateString('en-ZA', { month: 'short' }),
      full: d.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }),
      value: data.statements.filter((s) => s.period === key).reduce((a, s) => a + s.amount, 0),
    };
  });
  const max = Math.max(...points.map((p) => p.value), 1000) * 1.25;
  const coords = points.map((p, i) => [48 + i * (550 / (count - 1)), 185 - (p.value / max) * 155]);
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const active = hover ?? count - 1;
  const values = points.filter((p) => p.value > 0);
  const change =
    values.length > 1
      ? ((values.at(-1)!.value - values.at(-2)!.value) / values.at(-2)!.value) * 100
      : 0;
  return (
    <section className={`card spending-card ${expanded ? 'expanded' : ''}`}>
      <div className="card-heading">
        <div>
          <h2>Your spending, at a glance</h2>
          <p>A little perspective goes a long way.</p>
        </div>
        <AnimatedTabs
          items={[
            { id: '6m', label: '6 months' },
            { id: 'year', label: '12 months' },
          ]}
          value={range}
          onChange={setRange}
          label="Spending period"
          compact
        />
      </div>
      <div className="chart-summary">
        <strong className="numeric">{hidden ? 'R •••••' : money(points[active].value)}</strong>
        <span className="chart-month">{points[active].full}</span>
        <span className={`trend ${change > 0 ? 'neutral' : ''}`}>
          <TrendDownIcon size={14} />
          {Math.abs(change).toFixed(1)}% {change > 0 ? 'higher' : 'lower'} than previous month
        </span>
      </div>
      <div className="chart-container">
        <svg
          viewBox="0 0 640 236"
          role="img"
          aria-label={`Monthly spending: ${points.map((p) => `${p.label} ${hidden ? 'hidden' : money(p.value)}`).join(', ')}`}
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--orange)" stopOpacity=".19" />
              <stop offset="1" stopColor="var(--orange)" stopOpacity="0" />
            </linearGradient>
            <pattern id="chart-grid" width="24" height="31" patternUnits="userSpaceOnUse">
              <path d="M10 15h4m-2-2v4" stroke="var(--line)" strokeWidth=".8" />
            </pattern>
          </defs>
          <rect x="35" y="20" width="580" height="180" fill="url(#chart-grid)" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <text x="2" y={35 + i * 70} className="axis-label">
                {hidden ? '••' : `${Math.round((max * (1 - i * 0.45)) / 1000)}k`}
              </text>
            </g>
          ))}
          <path d={`${line} L598,200 L48,200 Z`} fill="url(#chart-fill)" />
          <path
            d={line}
            fill="none"
            stroke="var(--orange)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {coords.map(([x, y], i) => (
            <g key={i}>
              <line
                x1={x}
                x2={x}
                y1={y}
                y2="200"
                stroke={active === i ? 'var(--orange)' : 'transparent'}
                strokeDasharray="3 4"
                strokeOpacity=".4"
              />
              <circle
                cx={x}
                cy={y}
                r={active === i ? 6 : 4}
                fill="var(--orange)"
                stroke="var(--surface)"
                strokeWidth="3"
              />
              <text x={x} y="226" textAnchor="middle" className="axis-label">
                {points[i].label}
              </text>
              <rect
                x={x - 22}
                y="10"
                width="44"
                height="190"
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          ))}
        </svg>
      </div>
      <div className="chart-footer">
        <span>
          <i /> Municipal account totals
        </span>
        <span>
          Based on{' '}
          {data.statements.some((s) => s.source === 'sample')
            ? data.statements.some((s) => s.source === 'imported')
              ? 'sample & imported'
              : 'sample'
            : 'imported'}{' '}
          statements
        </span>
      </div>
    </section>
  );
}
