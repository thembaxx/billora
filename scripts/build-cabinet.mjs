// Original Billora figure, built with Anatomy by Ryan (MIT). See vendor/ANATOMY-LICENSE.
import { writeFileSync } from 'node:fs';
import * as k from './vendor/anatomy-iso.mjs';

// Figure: a four-drawer municipal bill cabinet. A selected drawer opens toward the reader.
// 79 purposeful solids: 5 base/feet, 7 case pieces, 3 dividers, 8 slide rails,
// and 14 parts per drawer (tray, walls, face, pull, label frame, card and paper).
const P = k.fitProjection(
  [
    [-58, -32, 0],
    [58, 76, 0],
    [-58, -32, 154],
    [58, 76, 154],
  ],
  420,
  310,
  { pad: 19, azimuth: 52, elevation: 29 },
);
const S = (plan, z, h, cls = '') =>
  k.solidSvg(k.slabOf(plan, z, h, P, 6, 0.55), { tone: 'mid', crease: 'none', className: cls });
const slab = (x, y, w, d, z, h, cls = '') =>
  S({ x, y, w, d, r: Math.min(1.5, w / 3, d / 3) }, z, h, cls);
const dot = (x, y, z, r = 0.7) => {
  const [cx, cy] = k.iso([x, y, z], P);
  return `<circle class="cabinet-screw" cx="${cx}" cy="${cy}" r="${r}"/>`;
};
const fixed = [];
for (const x of [-46, 38])
  for (const y of [-22, 28]) fixed.push(slab(x, y, 8, 8, 0, 9, 'cabinet-foot'));
fixed.push(slab(-56, -32, 112, 72, 9, 5, 'cabinet-base'));
fixed.push(slab(-50, -27, 100, 5, 14, 130, 'cabinet-case'));
fixed.push(slab(-50, -22, 4, 57, 14, 130, 'cabinet-case'));
fixed.push(slab(-50, -27, 100, 65, 14, 4, 'cabinet-case'));
for (const z of [49, 80, 111]) fixed.push(slab(-46, -22, 92, 57, z, 2, 'cabinet-divider'));
for (let i = 0; i < 4; i++)
  for (const x of [-44, 42]) fixed.push(slab(x, -20, 2, 55, 19 + i * 31, 2, 'cabinet-rail'));
// The left front stile is behind a drawer once that drawer is extended.
fixed.push(slab(-50, 35, 4, 3, 18, 126, 'cabinet-trim'));
const drawers = Array.from({ length: 4 }, (_, i) => {
  const z = 19 + i * 31;
  const pieces = [
    slab(-43, -18, 86, 48, z, 2, 'drawer-tray'),
    slab(-43, -18, 2, 48, z + 2, 23, 'drawer-tray'),
    slab(41, -18, 2, 48, z + 2, 23, 'drawer-tray'),
    slab(-41, -18, 82, 2, z + 2, 23, 'drawer-tray'),
  ];
  for (let n = 0; n < 3; n++)
    pieces.push(slab(-36, -10 + n * 2, 69 - n * 2, 33, z + 3 + n * 0.7, 0.6, 'cabinet-paper'));
  pieces.push(slab(-45, 30, 90, 4, z, 27, 'drawer-front'));
  pieces.push(slab(-29, 34, 34, 1, z + 13, 9, 'drawer-label-frame'));
  pieces.push(slab(-27, 35.1, 30, 0.35, z + 14.5, 6, 'drawer-label-card'));
  for (const x of [16, 32]) pieces.push(slab(x, 34, 2, 4, z + 12, 3, 'drawer-handle'));
  pieces.push(slab(16, 37, 18, 2, z + 12, 3, 'drawer-handle'));
  pieces.push(slab(30, 34.2, 6, 0.35, z + 20, 2, 'drawer-index'));
  pieces.push(dot(-40, 34.2, z + 4), dot(40, 34.2, z + 4));
  // Short rules are printed text, not floating structural lines.
  for (let n = 0; n < 3; n++) {
    const a = k.iso([-24, 35.5, z + 16 + n * 1.4], P),
      b = k.iso([-7 + n * 3, 35.5, z + 16 + n * 1.4], P);
    pieces.push(
      k.lineSvg(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, {
        free: true,
        className: 'cabinet-label-rule',
      }),
    );
  }
  return `<g class="cabinet-drawer" data-drawer="${3 - i}">${pieces.join('')}</g>`;
});
const front = [
  slab(46, -22, 4, 57, 14, 130, 'cabinet-case'),
  slab(46, 35, 4, 3, 18, 126, 'cabinet-trim'),
  slab(-52, -29, 104, 67, 144, 5, 'cabinet-cap'),
];
front.push(
  ...[
    [-46, -23],
    [46, -23],
    [-46, 32],
    [46, 32],
  ].map(([x, y]) => dot(x, y, 149, 1)),
);
const [dx, dy] = k.axisVector(P, [0, 30, 0]);
const art = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 310" data-travel-x="${dx.toFixed(3)}" data-travel-y="${dy.toFixed(3)}" data-parts="79"><ellipse class="cabinet-shadow" cx="211" cy="280" rx="112" ry="17"/>${fixed.join('')}${drawers.join('')}${front.join('')}</svg>`;
writeFileSync(new URL('../src/assets/account-cabinet.svg', import.meta.url), art + '\n');
console.log('Anatomy cabinet: 79 solids, 4 independently selectable drawers.');
