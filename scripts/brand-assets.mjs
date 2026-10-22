import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const root = new URL('../public/', import.meta.url);
const mark = await sharp(new URL('brand/billora-master.png', root).pathname)
  .trim({ threshold: 40 })
  .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
await sharp(mark).resize(160, 160).png().toFile(new URL('logo.png', root).pathname);
await sharp(mark).resize(32, 32).png().toFile(new URL('favicon.png', root).pathname);
for (const [size, name] of [
  [192, 'icon-192'],
  [512, 'icon-512'],
  [180, 'apple-touch-icon'],
])
  await sharp(mark)
    .resize(size, size)
    .flatten({ background: '#fffaf5' })
    .png()
    .toFile(new URL(`icons/${name}.png`, root).pathname);
const safe = await sharp(mark).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#fffaf5' } })
  .composite([{ input: safe, left: 51, top: 51 }])
  .png()
  .toFile(new URL('icons/maskable-512.png', root).pathname);
await mkdir(new URL('splash/', root), { recursive: true });
for (const [width, height, ratio] of [
  [390, 844, 3],
  [393, 852, 3],
  [430, 932, 3],
  [375, 812, 3],
  [414, 896, 2],
  [768, 1024, 2],
]) {
  for (const [theme, bg, ink] of [
    ['light', '#f5f5f8', '#292b2f'],
    ['dark', '#17181c', '#f0efed'],
  ]) {
    const n = 84 * ratio;
    const icon = await sharp(mark).resize(n, n).png().toBuffer();
    const text = Buffer.from(
      `<svg width="${width * ratio}" height="${height * ratio}" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="${height * ratio * 0.43 + n + 39 * ratio}" text-anchor="middle" font-family="sans-serif" font-size="${25 * ratio}" font-weight="600" letter-spacing="-${ratio}" fill="${ink}">billora.</text></svg>`,
    );
    await sharp({
      create: { width: width * ratio, height: height * ratio, channels: 4, background: bg },
    })
      .composite([
        {
          input: icon,
          left: Math.round((width * ratio - n) / 2),
          top: Math.round(height * ratio * 0.43),
        },
        { input: text },
      ])
      .png()
      .toFile(new URL(`splash/${width}x${height}-${theme}.png`, root).pathname);
  }
}
const icon64 = mark.toString('base64');
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f5f5f8"/><rect x="765" y="72" width="365" height="486" rx="80" fill="#edebe6"/><image href="data:image/png;base64,${icon64}" x="792" y="157" width="310" height="310"/><image href="data:image/png;base64,${icon64}" x="62" y="61" width="66" height="66"/><g fill="#292b2f" font-family="sans-serif"><text x="139" y="106" font-size="42" font-weight="600" letter-spacing="-2">billora.</text><text x="70" y="287" font-size="66" letter-spacing="-3">A little clarity.</text><text x="70" y="357" font-size="49" letter-spacing="-2" fill="#666a73">For everything home.</text><text x="72" y="475" font-size="23" fill="#626671">Your municipal accounts, together.</text><text x="72" y="518" font-size="17" fill="#626671">Made for life in South Africa.</text></g></svg>`;
await sharp(Buffer.from(social)).png().toFile(new URL('social.png', root).pathname);
await writeFile(
  new URL('brand/README.md', root),
  '# Billora brand assets\n\nThe original Billora b monogram combines a coral stem, an apricot bowl and a folded yellow statement. It was generated with OpenAI Image Gen using the user’s app-icon references, then prepared at native icon sizes.\n\nRun `npm run assets` from the repository root to rebuild icons, splash screens, the social image and the Anatomy figure. Keep the master PNG unchanged.\n',
);
console.log(
  'Billora mark, favicons, install icons, social card and 12 themed launch images updated.',
);
