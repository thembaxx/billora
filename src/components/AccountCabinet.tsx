import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArchiveIcon, ArrowUpRightIcon } from '@phosphor-icons/react';
import cabinetArt from '../assets/account-cabinet.svg?raw';
import { latestStatements, money } from '../lib/data';
import type { Workspace } from '../types';

export function AccountCabinet({
  data,
  hidden,
  reduced = false,
}: {
  data: Workspace;
  hidden: boolean;
  reduced?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const positions = useRef([0, 0, 0, 0]);
  const system = useReducedMotion();
  const latest = latestStatements(data);
  const categories = [
    { key: 'electricity' as const, label: 'Electricity', color: '#d95635' },
    { key: 'water' as const, label: 'Water', color: '#7e9fbc' },
    { key: 'rates' as const, label: 'Rates', color: '#a9bc91' },
    { key: 'services' as const, label: 'Other', color: '#b39bd3' },
  ].map((c) => ({ ...c, total: latest.reduce((a, s) => a + s.categories[c.key], 0) }));
  const total = categories.reduce((a, c) => a + c.total, 0);
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const svg = root.querySelector('svg')!;
    const x = Number(svg.dataset.travelX),
      y = Number(svg.dataset.travelY);
    const drawers = [...root.querySelectorAll<SVGGElement>('[data-drawer]')];
    let frame = 0,
      last = 0,
      visible = true;
    const place = (progress: number) => {
      let settled = true;
      drawers.forEach((drawer) => {
        const i = Number(drawer.dataset.drawer),
          target = i === selected ? 1 : 0;
        positions.current[i] =
          reduced || system
            ? target
            : positions.current[i] + (target - positions.current[i]) * progress;
        if (Math.abs(target - positions.current[i]) > 0.001) settled = false;
        else positions.current[i] = target;
        drawer.setAttribute(
          'transform',
          `translate(${x * positions.current[i]} ${y * positions.current[i]})`,
        );
        drawer.dataset.active = String(i === selected);
        drawer.style.setProperty('--drawer-color', categories[i].color);
      });
      return settled;
    };
    const tick = (time: number) => {
      const dt = last ? Math.min((time - last) / 1000, 1 / 30) : 1 / 60;
      last = time;
      if (visible && !document.hidden && !place(1 - Math.exp(-dt / 0.13)))
        frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) {
        last = 0;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(tick);
      } else cancelAnimationFrame(frame);
    });
    observer.observe(root);
    if (reduced || system) place(1);
    else frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [selected, reduced, system]);
  const active = categories[selected];
  return (
    <section className="card account-cabinet iso-plate" aria-labelledby="cabinet-title">
      <div className="cabinet-heading">
        <span>
          <ArchiveIcon size={17} />
          YOUR BILL ORGANISER
        </span>
        <span className="tiny-tag">Interactive</span>
      </div>
      <h2 id="cabinet-title">A place for every part.</h2>
      <p>Open a drawer. See what’s inside your latest bills.</p>
      <div
        ref={host}
        className="cabinet-art"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: cabinetArt }}
      />
      <div className="cabinet-controls" role="group" aria-label="Explore bill categories">
        {categories.map((c, i) => (
          <button key={c.key} aria-pressed={selected === i} onClick={() => setSelected(i)}>
            <i style={{ background: c.color }} />
            {c.label}
            {selected === i && <ArrowUpRightIcon size={14} />}
          </button>
        ))}
      </div>
      <div className="cabinet-readout" aria-live="polite">
        <span>
          {active.label}
          <small>
            {total ? Math.round((active.total / total) * 100) : 0}% of your latest bills
          </small>
        </span>
        <strong className="numeric">{hidden ? 'R •••••' : money(active.total)}</strong>
      </div>
      <p className="cabinet-caption">
        The same figures as your breakdown.{' '}
        {data.statements.some((s) => s.source === 'sample')
          ? 'Includes sample statements.'
          : 'Based on reviewed imports.'}
      </p>
    </section>
  );
}
