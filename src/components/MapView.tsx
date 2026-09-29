import { useEffect, useMemo, useRef } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router';
import type { FilterId, OffsetWell } from '../types';
import { ACTIVE } from '../data';
import { C, ISSUE_COLORS, ISSUE_LABEL } from '../lib/constants';
import { SHOT, shotParam } from '../lib/shot';
import { useApp } from '../state/AppState';
import WellPopup from './WellPopup';

// Overlay sizes (px) – used to keep the fitted circle and popups clear of the slider card and legend.
const PAD = 14;
const SLIDER_H = 78;
const LEGEND_H = 64;

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const activeIcon = L.divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;transform:translate(-11px,-11px) rotate(45deg);background:${C.accent};border:3px solid #fff;box-shadow:0 0 0 2px ${C.accent}"></div>`,
  iconSize: [0, 0],
});

const matches = (w: OffsetWell, f: FilterId) => f === 'All' || w.mainIssue === f;

function tileTracker(): L.LeafletEventHandlerFnMap {
  window.__nwisTiles = { loading: true, loadedOnce: false, tilesLoaded: 0, errors: 0 };
  const t = () => window.__nwisTiles!;
  return {
    loading: () => (t().loading = true),
    load: () => {
      t().loading = false;
      t().loadedOnce = true;
    },
    tileload: () => t().tilesLoaded++,
    tileerror: () => t().errors++,
  };
}

/** Fits the radius circle (with padding for overlays) and handles focus / popup requests. */
function MapController({ markers }: { markers: React.RefObject<Record<string, L.CircleMarker | null>> }) {
  const map = useMap();
  const { radiusKm, focus, filter, setFilter, wellsInRadius } = useApp();
  const first = useRef(true);

  useEffect(() => {
    const bounds = L.latLng(ACTIVE.lat, ACTIVE.lon).toBounds(radiusKm * 2000);
    map.fitBounds(bounds, { paddingTopLeft: [PAD, SLIDER_H + PAD * 2], paddingBottomRight: [PAD, LEGEND_H + PAD * 2], animate: false });
    if (first.current) {
      first.current = false;
      const popup = shotParam('popup');
      window.setTimeout(() => {
        if (popup) markers.current?.[popup]?.openPopup();
        window.setTimeout(() => (window.__nwisReady = true), 400);
      }, 200);
    }
  }, [radiusKm, map, markers]);

  useEffect(() => {
    if (!focus) return;
    const w = wellsInRadius.find((x) => x.name === focus.name);
    if (!w) return;
    if (!matches(w, filter)) setFilter('All');
    const open = () => markers.current?.[w.name]?.openPopup();
    map.once('moveend', () => window.setTimeout(open, 50));
    map.flyTo([w.lat, w.lon], Math.max(map.getZoom(), 11.5), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);
  return null;
}

export default function MapView() {
  const nav = useNavigate();
  const { radiusKm, setRadiusKm, filter, wellsInRadius } = useApp();
  const markers = useRef<Record<string, L.CircleMarker | null>>({});
  const tileEvents = useMemo(tileTracker, []);

  const shown = wellsInRadius.filter((w) => matches(w, filter));

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[ACTIVE.lat, ACTIVE.lon]}
        zoom={11}
        zoomSnap={0.1}
        zoomDelta={0.5}
        className="h-full w-full"
        zoomControl={false}
        fadeAnimation={!SHOT}
        zoomAnimation={!SHOT}
        markerZoomAnimation={!SHOT}
        inertia={!SHOT}
        attributionControl
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} subdomains="abcd" maxZoom={19} eventHandlers={tileEvents} />
        <ZoomControl />
        <MapController markers={markers} />

        <Circle
          center={[ACTIVE.lat, ACTIVE.lon]}
          radius={radiusKm * 1000}
          pathOptions={{ color: C.navy, weight: 1.5, dashArray: '6 5', fillColor: C.navy, fillOpacity: 0.04 }}
          interactive={false}
        />

        {shown.map(
          (w) =>
            w.trajectory && (
              <Polyline key={`${w.name}-traj`} positions={[[w.lat, w.lon], ...w.trajectory.points.slice(1)]} pathOptions={{ color: ISSUE_COLORS[w.mainIssue], weight: 2.5, dashArray: '4 4' }} />
            ),
        )}
        {shown.map(
          (w) =>
            w.trajectory && (
              <CircleMarker key={`${w.name}-bhl`} center={w.trajectory.points[w.trajectory.points.length - 1]} radius={3.5} interactive={false} pathOptions={{ color: ISSUE_COLORS[w.mainIssue], weight: 1.5, fillColor: '#fff', fillOpacity: 1 }} />
            ),
        )}

        {shown.map((w) => (
          <CircleMarker
            key={w.name}
            ref={(m) => {
              markers.current[w.name] = m;
            }}
            center={[w.lat, w.lon]}
            radius={8}
            pathOptions={{ color: '#fff', weight: 2, fillColor: ISSUE_COLORS[w.mainIssue], fillOpacity: 1 }}
          >
            <Tooltip permanent direction="right" offset={[9, 0]} className="well-label">
              {w.name}
            </Tooltip>
            <Popup
              className="nwis-popup"
              minWidth={400}
              maxWidth={400}
              autoPanPaddingTopLeft={[PAD, SLIDER_H + PAD * 2]}
              autoPanPaddingBottomRight={[PAD, LEGEND_H + PAD * 2]}
            >
              <WellPopup well={w} onDepth={() => nav(`/depth?wells=${w.name}`)} onReports={() => nav(`/documents?well=${w.name}`)} />
            </Popup>
          </CircleMarker>
        ))}

        <Marker position={[ACTIVE.lat, ACTIVE.lon]} icon={activeIcon} zIndexOffset={1000}>
          <Tooltip permanent direction="right" offset={[14, 0]} className="well-label active-label">
            {ACTIVE.name} (active)
          </Tooltip>
        </Marker>
      </MapContainer>

      {/* Radius slider card (top-left) */}
      <div className="card absolute left-[14px] top-[14px] z-[1000] w-[270px] px-3 py-2" style={{ height: SLIDER_H }}>
        <div className="flex items-baseline justify-between text-[0.88rem]">
          <span className="font-semibold">Search radius</span>
          <span className="text-[1.05rem] font-bold text-navy">{radiusKm} km</span>
        </div>
        <input type="range" min={1} max={20} step={1} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="mt-1 w-full accent-[#0B3D91]" aria-label="Search radius in km" />
        <div className="text-[0.82rem] text-muted">
          <b className="text-ink">{wellsInRadius.length}</b> offset wells inside radius
        </div>
      </div>

      <Legend />
    </div>
  );
}

function ZoomControl() {
  const map = useMap();
  useEffect(() => {
    const z = L.control.zoom({ position: 'topright' }).addTo(map);
    return () => {
      z.remove();
    };
  }, [map]);
  return null;
}

function Legend() {
  const items: { label: string; node: React.ReactNode }[] = [
    { label: 'Active well', node: <span style={{ width: 11, height: 11, background: C.accent, transform: 'rotate(45deg)', display: 'inline-block' }} /> },
    ...(['Mud Loss', 'Stuck Pipe', 'Kick', 'Cementing Issue', 'No Issue'] as const).map((k) => ({
      label: ISSUE_LABEL[k],
      node: <span className="dot" style={{ background: ISSUE_COLORS[k], width: 12, height: 12 }} />,
    })),
    { label: 'Deviated well path', node: <svg width="22" height="8"><path d="M0 4h22" stroke="#555" strokeWidth="2" strokeDasharray="4 3" /></svg> },
    { label: 'Search radius', node: <svg width="22" height="12"><circle cx="11" cy="6" r="5" fill="none" stroke={C.navy} strokeWidth="1.5" strokeDasharray="3 2" /></svg> },
  ];
  return (
    <div className="card absolute bottom-[14px] left-[14px] z-[1000] px-3 py-1.5" style={{ height: LEGEND_H }}>
      <div className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted">Legend – main past problem</div>
      <div className="mt-1 grid grid-cols-4 gap-x-4 gap-y-0.5 text-[0.8rem]">
        {items.map((i) => (
          <span key={i.label} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="flex w-[22px] justify-center">{i.node}</span>
            {i.label}
          </span>
        ))}
      </div>
    </div>
  );
}
