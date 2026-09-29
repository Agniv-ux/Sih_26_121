/** Screenshot mode (?shot=1): frozen simulation, fixed bit depth, no animations. Read once at load. */
const params = new URLSearchParams(window.location.search);
export const SHOT = params.get('shot') === '1';
export const shotParam = (key: string) => (SHOT ? params.get(key) : null);

if (SHOT) document.documentElement.classList.add('shot');

declare global {
  interface Window {
    __nwisReady?: boolean;
    __nwisTiles?: { loading: boolean; loadedOnce: boolean; tilesLoaded: number; errors: number };
  }
}
