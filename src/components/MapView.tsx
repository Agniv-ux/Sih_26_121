import { Fragment, useEffect, useMemo, useRef, type RefObject } from 'react';
import L from 'leaflet';
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import type { ActiveWell, FilterId, OffsetWell, ShotMode } from '../types';
import { FILTERS, ISSUE_COLORS } from '../lib/constants';
import WellPopup from './WellPopup';
import { IssueDot } from './IssueTag';

export interface FocusRequest {
  name: string;
  nonce: number;
  fly: boolean;
  /** Place the popup to the left of the marker instead of above it (screenshot mode). */
  side?: boolean;
}

interface Props {
  active: ActiveWell;
  wellsInRadius: OffsetWell[];
  visibleWells: OffsetWell[];
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  filter: FilterId;
  onFilterChange: (f: FilterId) => void;
  selectedWell: string | null;
  onSelectWell: (name: string | null) => void;
  focusRequest: FocusRequest | null;
  onViewDepth: (name: string) => void;
  shot: ShotMode;
  onFitted: () => void;
}

type TileStatus = { loading: boolean; loadedOnce: boolean; errors: number; tilesLoaded: number };
declare global {
  interface Window {
    __nwisTiles?: TileStatus;
    __nwisReady?: boolean;
  }
}
const tileStatus: TileStatus = { loading: true, loadedOnce: false, errors: 0, tilesLoaded: 0 };
window.__nwisTiles = tileStatus;

const activeIcon = L.divIcon({
  className: '',
  html: '<div class="active-well"><span class="ring"></span><span class="core"></span></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/** Fit the map so the whole radius circle is visible. */
function FitToRadius({
  center,
  radiusKm,
  instant,
  topPad,
  onFitted,
}: {
  center: L.LatLngExpression;
  radiusKm: number;
  instant: boolean;
  topPad: number;
  onFitted: () => void;
}) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    const bounds = L.latLng(center).toBounds(radiusKm * 2000 * 1.04);
    const run = () => {
      map.fitBounds(bounds, { paddingTopLeft: [24, topPad], paddingBottomRight: [24, 24], animate: !instant && !first.current });
      first.current = false;
      onFitted();
    };
    if (first.current || instant) {
      run();
      return;
    }
    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm]);
  return null;
}

function FocusController({ request, wells, markers }: { request: FocusRequest | null; wells: OffsetWell[]; markers: RefObject<Map<string, L.CircleMarker>> }) {
  const map = useMap();
  useEffect(() => {
    if (!request) return;
    const well = wells.find((w) => w.name === request.name);
    if (!well) return;
    const open = () => {
      const marker = markers.current.get(request.name);
      if (!marker) return;
      marker.openPopup();
      const popup = marker.getPopup();
      if (!request.side || !popup) return;
      // React renders the popup content through a portal, so measure once it has laid out.
      const place = (tries: number) => {
        const el = popup.getElement();
        const card = el?.querySelector('.leaflet-popup-content-wrapper') as HTMLElement | null;
        if (!card || card.offsetHeight < 50) {
          if (tries > 0) setTimeout(() => place(tries - 1), 50);
          return;
        }
        // Leaflet anchors a popup by its bottom centre; shift it so its right edge sits just left of the marker, vertically centred.
        popup.options.offset = L.point(-(card.offsetWidth / 2 + 50), card.offsetHeight / 2);
        popup.update();
      };
      setTimeout(() => place(20), 50);
    };
    if (!request.fly) {
      open();
      return;
    }
    map.flyTo([well.lat, well.lon], Math.max(map.getZoom(), 12), { duration: 0.8 });
    map.once('moveend', open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.nonce]);
  return null;
}

export default function MapView(props: Props) {
  const { active, wellsInRadius, visibleWells, radiusKm, filter, selectedWell, shot } = props;
  const center: [number, number] = [active.lat, active.lon];
  const markers = useRef(new Map<string, L.CircleMarker>());
  const fill = ((radiusKm - 1) / 19) * 100;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTERS) c[f.id] = f.id === 'All' ? wellsInRadius.length : wellsInRadius.filter((w) => w.mainIssue === f.id).length;
    return c;
  }, [wellsInRadius]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={11}
        zoomSnap={0.1}
        zoomDelta={0.5}
        zoomControl={false}
        className="h-full w-full"
        fadeAnimation={!shot}
        zoomAnimation={!shot}
        markerZoomAnimation={!shot}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
          eventHandlers={{
            loading: () => {
              tileStatus.loading = true;
            },
            load: () => {
              tileStatus.loading = false;
              tileStatus.loadedOnce = true;
            },
            tileload: () => {
              tileStatus.tilesLoaded += 1;
            },
            tileerror: () => {
              tileStatus.errors += 1;
            },
          }}
        />
        <ZoomControl position="bottomright" />
        <FitToRadius center={center} radiusKm={radiusKm} instant={!!shot} topPad={24} onFitted={props.onFitted} />
        <FocusController request={props.focusRequest} wells={visibleWells} markers={markers} />

        <Circle
          center={center}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#F59E0B', weight: 1.5, opacity: 0.8, dashArray: '6 6', fillColor: '#F59E0B', fillOpacity: 0.04 }}
          interactive={false}
        />

        {visibleWells.map((w) => {
          const color = ISSUE_COLORS[w.mainIssue];
          const selected = selectedWell === w.name;
          return (
            <Fragment key={w.name}>
              {w.bhl && (
                <>
                  <Polyline
                    positions={[
                      [w.lat, w.lon],
                      [w.bhl.lat, w.bhl.lon],
                    ]}
                    pathOptions={{ color, weight: 2.5, opacity: 0.9 }}
                    interactive={false}
                  />
                  <CircleMarker
                    center={[w.bhl.lat, w.bhl.lon]}
                    radius={3}
                    pathOptions={{ color, fillColor: color, fillOpacity: 1, weight: 1 }}
                    interactive={false}
                  />
                </>
              )}
              <CircleMarker
                ref={(m) => {
                  if (m) markers.current.set(w.name, m);
                  else markers.current.delete(w.name);
                }}
                center={[w.lat, w.lon]}
                radius={selected ? 10 : 8}
                pathOptions={{ color: selected ? '#E5E7EB' : '#0F172A', weight: 2, fillColor: color, fillOpacity: 1 }}
                eventHandlers={{
                  popupopen: () => props.onSelectWell(w.name),
                  popupclose: () => props.onSelectWell(null),
                }}
              >
                <Tooltip permanent direction="right" offset={[10, 0]} className="well-label">
                  {w.name}
                </Tooltip>
                <Popup
                  className={shot === 'popup' ? 'side-popup' : undefined}
                  autoPan={shot !== 'popup'}
                  minWidth={356}
                  maxWidth={356}
                  autoPanPaddingTopLeft={[24, 72]}
                  autoPanPaddingBottomRight={[24, 24]}
                  offset={[0, -6]}
                >
                  <WellPopup well={w} onViewDepth={props.onViewDepth} />
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}

        <Marker position={center} icon={activeIcon} zIndexOffset={1000} interactive={false}>
          <Tooltip permanent direction="right" offset={[14, 0]} className="well-label active-label">
            {active.name}
          </Tooltip>
        </Marker>
      </MapContainer>

      {/* Radius card */}
      <div className="absolute left-4 top-4 z-[1000] w-60 rounded-lg border border-line bg-panel/95 p-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[0.75rem] uppercase tracking-wider text-muted">Search radius</span>
          <span className="text-[1.15rem] font-semibold text-ink">
            {radiusKm} <span className="text-[0.85rem] font-normal text-muted">km</span>
          </span>
        </div>
        <input
          aria-label="Search radius in kilometres"
          type="range"
          min={1}
          max={20}
          step={1}
          value={radiusKm}
          onChange={(e) => props.onRadiusChange(Number(e.target.value))}
          className="radius mt-3 w-full"
          style={{ ['--fill' as string]: `${fill}%` }}
        />
        <div className="mt-1 flex justify-between text-[0.7rem] text-muted">
          <span>1 km</span>
          <span>20 km</span>
        </div>
        <div className="mt-2 border-t border-line pt-2 text-[0.85rem] text-ink">
          <span className="font-semibold">{wellsInRadius.length}</span> <span className="text-muted">offset wells in radius</span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="pointer-events-none absolute left-[272px] right-4 top-4 z-[1000] flex justify-end">
        <div className="pointer-events-auto flex flex-wrap justify-end gap-1.5 rounded-lg border border-line bg-panel/95 p-1.5">
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => props.onFilterChange(f.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[0.85rem] font-medium border ${
                  on ? 'border-accent bg-accent/15 text-ink' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {f.id !== 'All' && <IssueDot issue={f.id} size={8} />}
                {f.label}
                <span className={on ? 'text-accent' : 'text-muted/80'}>{counts[f.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-line bg-panel/95 px-3.5 py-3 text-[0.8rem]">
        <div className="mb-2 text-[0.7rem] uppercase tracking-wider text-muted">Main past problem</div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
          {(['Mud Loss', 'Stuck Pipe', 'Kick', 'Cementing Issue', 'No major issue'] as const).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full border-2 border-bg"
                style={{ background: ISSUE_COLORS[k], boxShadow: `0 0 0 1px ${ISSUE_COLORS[k]}` }}
              />
              {k === 'Cementing Issue' ? 'Cementing' : k}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-accent border-2 border-bg" style={{ boxShadow: '0 0 0 1.5px #F59E0B' }} />
            Active well
          </div>
        </div>
        <div className="mt-2 flex gap-5 border-t border-line pt-2 text-muted">
          <span className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-5 bg-muted" /> Trajectory (deviated)
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-5 border-t-2 border-dashed border-accent" /> Radius
          </span>
        </div>
      </div>
    </div>
  );
}
