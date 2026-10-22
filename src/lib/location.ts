export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface NamedPlace extends GeoPoint {
  label: string;
}

export interface MapTile {
  x: number;
  y: number;
  left: number;
  top: number;
  url: string;
}

export const SA_CENTER: GeoPoint = { lat: -28.9, lng: 25.4 };
export const MIN_ZOOM = 4;
export const MAX_ZOOM = 18;
const TILE_SIZE = 256;
const MAX_LAT = 85.05112878;

export function validPoint(value: unknown): value is GeoPoint {
  if (!value || typeof value !== 'object') return false;
  const point = value as GeoPoint;
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}

export function project(point: GeoPoint, zoom: number): { x: number; y: number } {
  const lat = Math.max(-MAX_LAT, Math.min(MAX_LAT, point.lat));
  const sin = Math.sin((lat * Math.PI) / 180);
  const world = TILE_SIZE * 2 ** zoom;
  return {
    x: ((point.lng + 180) / 360) * world,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * world,
  };
}

export function unproject(x: number, y: number, zoom: number): GeoPoint {
  const world = TILE_SIZE * 2 ** zoom;
  const longitude = (((((x / world) * 360 + 180) % 360) + 360) % 360) - 180;
  const n = Math.PI * (1 - (2 * Math.max(0, Math.min(world, y))) / world);
  return {
    lat: (180 / Math.PI) * Math.atan(Math.sinh(n)),
    lng: longitude,
  };
}

export function screenPoint(
  point: GeoPoint,
  center: GeoPoint,
  zoom: number,
  width: number,
  height: number,
) {
  const a = project(point, zoom);
  const b = project(center, zoom);
  const world = TILE_SIZE * 2 ** zoom;
  let dx = a.x - b.x;
  if (dx > world / 2) dx -= world;
  if (dx < -world / 2) dx += world;
  return { x: width / 2 + dx, y: height / 2 + a.y - b.y };
}

export function geoAtScreen(
  center: GeoPoint,
  zoom: number,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const c = project(center, zoom);
  return unproject(c.x + x - width / 2, c.y + y - height / 2, zoom);
}

export function panMap(center: GeoPoint, zoom: number, dx: number, dy: number) {
  const c = project(center, zoom);
  return unproject(c.x - dx, c.y - dy, zoom);
}

export function visibleTiles(
  center: GeoPoint,
  zoom: number,
  width: number,
  height: number,
): MapTile[] {
  if (width <= 0 || height <= 0) return [];
  const c = project(center, zoom);
  const tilesPerAxis = 2 ** zoom;
  const leftEdge = c.x - width / 2;
  const topEdge = c.y - height / 2;
  const leftTile = Math.floor(leftEdge / TILE_SIZE);
  const rightTile = Math.floor((leftEdge + width) / TILE_SIZE);
  const topTile = Math.floor(topEdge / TILE_SIZE);
  const bottomTile = Math.floor((topEdge + height) / TILE_SIZE);
  const tiles: MapTile[] = [];
  // The map requests only visible tiles. No offline tile download/prefetching.
  for (let y = topTile; y <= bottomTile && tiles.length < 60; y++) {
    if (y < 0 || y >= tilesPerAxis) continue;
    for (let x = leftTile; x <= rightTile && tiles.length < 60; x++) {
      const wrappedX = ((x % tilesPerAxis) + tilesPerAxis) % tilesPerAxis;
      tiles.push({
        x,
        y,
        left: x * TILE_SIZE - leftEdge,
        top: y * TILE_SIZE - topEdge,
        url: 'https://tile.openstreetmap.org/' + zoom + '/' + wrappedX + '/' + y + '.png',
      });
    }
  }
  return tiles;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

let lastSearchAt = 0;
export async function searchSouthAfricanPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<NamedPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3 || trimmed.length > 140) {
    throw new Error('Enter at least three characters to search for a place.');
  }
  if (Date.now() - lastSearchAt < 1100) {
    throw new Error('Please leave a moment between searches.');
  }
  lastSearchAt = Date.now();
  const params = new URLSearchParams({
    q: trimmed,
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'za',
    addressdetails: '0',
  });
  const response = await fetch('https://nominatim.openstreetmap.org/search?' + params, {
    signal,
    headers: { Accept: 'application/json' },
    referrerPolicy: 'strict-origin-when-cross-origin',
  });
  if (!response.ok) throw new Error('Place search is unavailable right now. Try again later.');
  const body: unknown = await response.json();
  if (!Array.isArray(body)) throw new Error('Unexpected place-search response.');
  return (body as SearchResult[])
    .slice(0, 5)
    .map((result) => ({
      lat: Number(result.lat),
      lng: Number(result.lon),
      label: String(result.display_name || '').slice(0, 180),
    }))
    .filter((point) => validPoint(point) && point.label);
}
