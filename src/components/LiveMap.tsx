import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { MinusIcon, PlusIcon, MapPinIcon } from '@phosphor-icons/react';
import {
  geoAtScreen, panMap, screenPoint, visibleTiles, validPoint,
  MAX_ZOOM, MIN_ZOOM, type GeoPoint, type NamedPlace,
} from '../lib/location';
import type { Property } from '../types';

interface LiveMapProps {
  center: GeoPoint;
  zoom: number;
  onCenter: (value: GeoPoint) => void;
  onZoom: (value: number) => void;
  onPick: (value: GeoPoint) => void;
  selected: NamedPlace | null;
  device: GeoPoint | null;
  properties?: Property[];
  onProperty?: (property: Property) => void;
  online: boolean;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  center: GeoPoint;
  moved: boolean;
}

export function LiveMap({
  center, zoom, onCenter, onZoom, onPick, selected, device,
  properties = [], onProperty, online,
}: LiveMapProps) {
  const host = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { width, height } = size;
  const tiles = online ? visibleTiles(center, zoom, width, height) : [];
  const location = (p: GeoPoint) => screenPoint(p, center, zoom, width, height);

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button, a')) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      center,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) active.moved = true;
    if (active.moved) onCenter(panMap(active.center, zoom, dx, dy));
  }

  function up(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!active.moved) {
      const rect = event.currentTarget.getBoundingClientRect();
      onPick(geoAtScreen(center, zoom, width, height, event.clientX - rect.left, event.clientY - rect.top));
    }
  }

  function keyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const delta = 70;
    if (event.key === 'ArrowLeft') onCenter(panMap(center, zoom, delta, 0));
    else if (event.key === 'ArrowRight') onCenter(panMap(center, zoom, -delta, 0));
    else if (event.key === 'ArrowUp') onCenter(panMap(center, zoom, 0, delta));
    else if (event.key === 'ArrowDown') onCenter(panMap(center, zoom, 0, -delta));
    else if (event.key === '+' || event.key === '=') onZoom(Math.min(MAX_ZOOM, zoom + 1));
    else if (event.key === '-') onZoom(Math.max(MIN_ZOOM, zoom - 1));
    else if (event.key === 'Enter') onPick(center);
    else return;
    event.preventDefault();
  }

  return (
    <div className="live-map-shell">
      <div
        ref={host}
        className="live-map-viewport"
        role="group"
        aria-label="Interactive map. Drag to pan, use arrow keys to move, plus and minus to zoom, or Enter to choose the centre."
        tabIndex={0}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => { drag.current = null; }}
        onKeyDown={keyDown}
        onDoubleClick={(event) => {
          event.preventDefault();
          onZoom(Math.min(MAX_ZOOM, zoom + 1));
        }}
      >
        <div className="live-map-grid" aria-hidden="true" />
        {tiles.map((tile) => (
          <img
            key={zoom + ':' + tile.x + ':' + tile.y}
            className="live-map-tile"
            src={tile.url}
            width="256"
            height="256"
            alt=""
            draggable={false}
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ transform: 'translate3d(' + tile.left + 'px,' + tile.top + 'px,0)' }}
          />
        ))}
        {properties.filter((property) => validPoint(property.location)).map((property) => {
          const p = location(property.location!);
          if (p.x < -45 || p.x > width + 45 || p.y < -45 || p.y > height + 45) return null;
          return (
            <button
              type="button"
              key={property.id}
              className="live-map-pin property"
              style={{ left: p.x, top: p.y }}
              aria-label={'Open property on map: ' + property.name}
              onClick={() => onProperty?.(property)}
            >
              <MapPinIcon size={29} weight="fill" />
              <span>{property.name}</span>
            </button>
          );
        })}
        {device && (() => {
          const p = location(device);
          return (
            <div className="live-map-device" style={{ left: p.x, top: p.y }} aria-hidden="true">
              <i /><span />
            </div>
          );
        })()}
        {selected && (() => {
          const p = location(selected);
          return (
            <div className="live-map-pin selected" style={{ left: p.x, top: p.y }} aria-hidden="true">
              <MapPinIcon size={35} weight="fill" />
            </div>
          );
        })()}
        {!online && (
          <div className="live-map-offline" role="status">
            Map tiles require an internet connection. Saved pins remain available.
          </div>
        )}
      </div>
      <div className="live-map-controls" aria-label="Map zoom controls">
        <button type="button" onClick={() => onZoom(Math.min(MAX_ZOOM, zoom + 1))}
          disabled={zoom >= MAX_ZOOM} aria-label="Zoom map in">
          <PlusIcon size={19} />
        </button>
        <button type="button" onClick={() => onZoom(Math.max(MIN_ZOOM, zoom - 1))}
          disabled={zoom <= MIN_ZOOM} aria-label="Zoom map out">
          <MinusIcon size={19} />
        </button>
      </div>
      <a
        className="live-map-attribution"
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
      >
        © OpenStreetMap contributors
      </a>
    </div>
  );
}