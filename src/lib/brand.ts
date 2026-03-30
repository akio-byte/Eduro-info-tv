const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export const EDURO_PRIMARY_BLUE = '#253b70';
export const EDURO_FONT_STACK = ['Ubuntu', '"Segoe UI"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'].join(
  ', ',
);

export const EDURO_THEME = {
  primary: EDURO_PRIMARY_BLUE,
  primaryStrong: '#1d2f5a',
  primarySoft: '#dfe6f3',
  surface: '#f3f5f8',
  surfaceMuted: '#e8edf5',
  panel: '#ffffff',
  border: '#d4dce8',
  ink: '#1c2740',
  muted: '#5f6d87',
  displayBackground: '#111826',
  displayPanel: '#1b2740',
  displayPanelSoft: '#223251',
} as const;

export function getEduroAccentColor(color?: string | null) {
  if (!color) {
    return EDURO_PRIMARY_BLUE;
  }

  const normalized = color.trim();
  return HEX_COLOR_PATTERN.test(normalized) ? normalized : EDURO_PRIMARY_BLUE;
}
