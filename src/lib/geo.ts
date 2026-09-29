import type { OffsetWell } from '../types';

export const inRadius = (wells: OffsetWell[], radiusKm: number) =>
  wells.filter((w) => w.distanceKm <= radiusKm).sort((a, b) => a.distanceKm - b.distanceKm);
