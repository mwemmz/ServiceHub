import { Platform } from 'react-native';

/**
 * Themes the parts of the page the app does not draw —
 * scrollbars, text selection, the caret, and keyboard focus —
 * so they belong to the same world as the design system.
 * Web only; no-op on native.
 */
export function installWebChrome() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('servicehub-web-chrome')) return;

  const style = document.createElement('style');
  style.id = 'servicehub-web-chrome';
  style.textContent = `
    html, body { background: #0A1020; }
    ::selection { background: rgba(212,163,115,0.45); color: #fff; }
    * { caret-color: #D4A373; }
    ::-webkit-scrollbar { width: 12px; height: 12px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: rgba(212,163,115,0.32);
      border-radius: 999px;
      border: 3px solid #0A1020;
    }
    ::-webkit-scrollbar-thumb:hover { background: rgba(212,163,115,0.5); }
    :focus-visible {
      outline: 2px solid #D4A373;
      outline-offset: 2px;
      border-radius: 6px;
    }
    body { -webkit-font-smoothing: antialiased; }
  `;
  document.head.appendChild(style);
}