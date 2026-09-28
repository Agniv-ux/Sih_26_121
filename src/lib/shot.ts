import type { ShotMode } from '../types';

const MODES = ['dashboard', 'popup', 'depth', 'ask'] as const;

export function readShotMode(): ShotMode {
  const v = new URLSearchParams(window.location.search).get('shot');
  return (MODES as readonly string[]).includes(v ?? '') ? (v as ShotMode) : null;
}
