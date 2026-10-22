import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ArrowRightIcon,
  CrosshairIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  NavigationArrowIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import type { Property } from '../types';
import {
  SA_CENTER,
  searchSouthAfricanPlaces,
  validPoint,
  type GeoPoint,
  type NamedPlace,
} from '../lib/location';
import { GeoCompass } from './GeoCompass';
import { LiveMap } from './LiveMap';

export function PlaceExplorer({
  onChoose,
  properties = [],
  onProperty,
}: {
  onChoose?: (place: NamedPlace) => void;
  properties?: Property[];
  onProperty?: (property: Property) => void;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const searchRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NamedPlace[]>([]);
  const [center, setCenter] = useState<GeoPoint>(
    () => properties.find((property) => validPoint(property.location))?.location || SA_CENTER,
  );
  const [zoom, setZoom] = useState(6);
  const [selected, setSelected] = useState<NamedPlace | null>(null);
  const [device, setDevice] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      searchRef.current?.abort();
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useGSAP(
    () => {
      if (reduced) return;
      gsap.from('.geo-enter', {
        opacity: 0,
        y: 12,
        duration: 0.48,
        ease: 'power2.out',
        stagger: 0.07,
        clearProps: 'all',
      });
    },
    { scope },
  );

  async function find() {
    if (!online || searching) {
      setError('Place search needs an internet connection.');
      return;
    }
    searchRef.current?.abort();
    const controller = new AbortController();
    searchRef.current = controller;
    setSearching(true);
    setError('');
    try {
      const found = await searchSouthAfricanPlaces(query, controller.signal);
      setResults(found);
      if (!found.length)
        setError('No matching places found in South Africa. Try a town or nearby landmark.');
      else {
        setCenter(found[0]);
        setZoom(14);
        setSelected(found[0]);
      }
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : 'Could not search right now.');
      }
    } finally {
      setSearching(false);
    }
  }

  function locate() {
    setError('');
    if (!window.isSecureContext || !navigator.geolocation) {
      setError('Location is not supported here. Use a secure connection or search for a place.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        setLocating(false);
        if (!validPoint(point)) {
          setError('Your device returned invalid coordinates.');
          return;
        }
        setDevice(point);
        setCenter(point);
        setZoom(coords.accuracy > 500 ? 13 : 16);
        // Device coordinates are never stored until the user explicitly selects a pin.
      },
      (reason) => {
        setLocating(false);
        setError(
          reason.code === 1
            ? 'Location permission was not granted. You can still search or tap the map.'
            : 'Your location is unavailable right now. Try searching for a place.',
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  }

  function pick(point: GeoPoint) {
    setSelected({
      ...point,
      label: 'Pinned location (' + point.lat.toFixed(5) + ', ' + point.lng.toFixed(5) + ')',
    });
  }

  function choose(place: NamedPlace) {
    setSelected(place);
    setCenter(place);
    setZoom(Math.max(zoom, 14));
  }

  return (
    <div className="geo-explorer" ref={scope}>
      <div className="geo-explorer-heading geo-enter">
        <div>
          <span className="geo-eyebrow">Explore your places</span>
          <h3>Find your little corner of SA.</h3>
          <p>Search for a town, street or landmark. Place a pin exactly where it belongs.</p>
        </div>
        <GeoCompass reduced={reduced} />
      </div>
      <div className="geo-search-panel geo-enter">
        <div className="geo-search" role="search">
          <MagnifyingGlassIcon size={20} aria-hidden="true" />
          <input
            aria-label="Find a place in South Africa"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Town, street or landmark…"
            maxLength={140}
            type="search"
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void find();
              }
            }}
          />
          <button
            className="button primary small"
            disabled={searching || !online || query.trim().length < 3}
            type="button"
            onClick={() => void find()}
          >
            {searching ? 'Finding…' : 'Find'}
            <ArrowRightIcon size={16} aria-hidden="true" />
          </button>
        </div>
        <button
          className="button secondary geo-locate"
          type="button"
          onClick={locate}
          disabled={locating}
          aria-label="Use my current device location"
        >
          <CrosshairIcon size={19} aria-hidden="true" />
          {locating ? 'Locating…' : 'My location'}
        </button>
      </div>
      {error && (
        <p role="alert" className="geo-alert">
          <WarningCircleIcon size={18} aria-hidden="true" />
          {error}
        </p>
      )}
      {results.length > 0 && (
        <div className="geo-results" aria-label="Place search results">
          {results.map((place, index) => (
            <button
              type="button"
              key={index + ':' + place.lat + ':' + place.lng}
              onClick={() => choose(place)}
              aria-pressed={selected?.lat === place.lat && selected.lng === place.lng}
            >
              <MapPinIcon size={18} aria-hidden="true" />
              <span>{place.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="geo-map-frame geo-enter">
        <LiveMap
          center={center}
          zoom={zoom}
          onCenter={setCenter}
          onZoom={setZoom}
          onPick={pick}
          selected={selected}
          device={device}
          online={online}
          properties={properties}
          onProperty={onProperty}
        />
        <div className="geo-map-hint" aria-hidden="true">
          <NavigationArrowIcon size={15} weight="fill" />
          Drag to move · Tap to pin
        </div>
      </div>
      <div className="geo-location-footer geo-enter">
        <div className="geo-selection">
          <MapPinIcon size={25} weight="duotone" aria-hidden="true" />
          <div>
            <strong>{selected ? 'Your selected place' : 'Choose a spot on the map'}</strong>
            <small>
              {selected ? selected.label : 'Select a result, tap the map or pin the centre.'}
            </small>
          </div>
        </div>
        <div className="geo-selection-actions">
          <button type="button" className="button secondary small" onClick={() => pick(center)}>
            Pin map centre
          </button>
          {onChoose && (
            <button
              type="button"
              className="button primary small"
              disabled={!selected}
              onClick={() => selected && onChoose(selected)}
            >
              Use this place
              <ArrowRightIcon size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <p className="geo-disclosure">
        <ShieldCheckIcon size={16} aria-hidden="true" />
        Location is requested only when you tap My location. Search terms go to OpenStreetMap
        Nominatim and visible map tiles load from OpenStreetMap. Device coordinates are not saved
        unless you choose a place. Map imagery and searches need internet; no map tiles are
        downloaded for offline use.
      </p>
    </div>
  );
}
