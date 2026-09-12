/* ============================================================
   icons.js — inline SVG set. Vector, themeable via currentColor,
   nothing to download.
   ============================================================ */
const svg = (p, o = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${o}>${p}</svg>`;

export const I = {
  check:    svg('<path d="M4.5 12.5l5 5 10-11"/>', 'stroke-width="3"'),
  plus:     svg('<path d="M12 5v14M5 12h14"/>'),
  minus:    svg('<path d="M5 12h14"/>'),
  x:        svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  chevR:    svg('<path d="M9 5l7 7-7 7"/>'),
  chevL:    svg('<path d="M15 5l-7 7 7 7"/>'),
  chevD:    svg('<path d="M6 9l6 6 6-6"/>'),

  today:    svg('<rect x="3" y="4.5" width="18" height="16" rx="3.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M9 14.5l2 2 4-4.5" stroke-width="2.2"/>'),
  list:     svg('<rect x="3" y="4.5" width="18" height="16" rx="3.5"/><path d="M7.5 9.5h9M7.5 13h9M7.5 16.5h5"/>'),
  chart:    svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke-linecap="round"/>'),
  cog:      svg('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.7 1.7 0 00.35 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.35 1.7 1.7 0 00-1 1.56V21a2 2 0 11-4 0v-.14a1.7 1.7 0 00-1.1-1.56 1.7 1.7 0 00-1.87.35l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.35-1.87 1.7 1.7 0 00-1.56-1H3a2 2 0 110-4h.14a1.7 1.7 0 001.56-1.1 1.7 1.7 0 00-.35-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.35H9a1.7 1.7 0 001-1.56V3a2 2 0 114 0v.14a1.7 1.7 0 001 1.56 1.7 1.7 0 001.87-.35l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.35 1.87V9a1.7 1.7 0 001.56 1H21a2 2 0 110 4h-.14a1.7 1.7 0 00-1.56 1z"/>'),

  flame:    svg('<path d="M12.8 2.2c.6 3.1-.5 5-2.2 6.7-1.9 1.8-4.4 3.4-5.2 6.2-1.2 4 1.5 7.8 5.6 7.8s6.9-3 6.9-6.8c0-2.3-1-4.1-2.3-5.4-.2 1.2-.8 2.1-1.7 2.6.4-3.1-.4-7.4-5.1-11.1" fill="currentColor" stroke="none"/>'),
  target:   svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  sparkle:  svg('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" fill="currentColor" stroke="none"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="currentColor" stroke="none"/>'),
  trophy:   svg('<path d="M7 4h10v5a5 5 0 01-10 0z"/><path d="M17 5.5h2.5a2.5 2.5 0 01-2.5 4.5M7 5.5H4.5A2.5 2.5 0 007 10"/><path d="M12 14v3M8.5 20.5h7M10 17.5h4l.7 3h-5.4z"/>'),

  pencil:   svg('<path d="M16.4 3.6a2.3 2.3 0 013.3 3.3L7.5 19.1 3 20.5l1.4-4.5z"/>'),
  trash:    svg('<path d="M4 6.5h16M9.5 6.5V4.2c0-.7.5-1.2 1.2-1.2h2.6c.7 0 1.2.5 1.2 1.2v2.3M6.5 6.5l1 13c0 .8.7 1.5 1.5 1.5h6c.8 0 1.5-.7 1.5-1.5l1-13"/>'),
  archive:  svg('<rect x="3" y="4" width="18" height="5" rx="1.6"/><path d="M5 9v10a1.7 1.7 0 001.7 1.7h10.6A1.7 1.7 0 0019 19V9M10 13h4"/>'),
  restore:  svg('<path d="M3.5 12a8.5 8.5 0 108.5-8.5 8.4 8.4 0 00-6.3 2.8"/><path d="M3 3.5v4.2h4.2"/>'),
  grip:     svg('<circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/>'),
  up:       svg('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  down:     svg('<path d="M12 5v14M19 12l-7 7-7-7"/>'),

  download: svg('<path d="M12 3v12M7.5 10.5L12 15l4.5-4.5"/><path d="M4 17v2.2A1.8 1.8 0 005.8 21h12.4A1.8 1.8 0 0020 19.2V17"/>'),
  upload:   svg('<path d="M12 15V3M7.5 7.5L12 3l4.5 4.5"/><path d="M4 17v2.2A1.8 1.8 0 005.8 21h12.4A1.8 1.8 0 0020 19.2V17"/>'),
  share:    svg('<path d="M12 3v13M8 7l4-4 4 4"/><path d="M5 13v6.2A1.8 1.8 0 006.8 21h10.4A1.8 1.8 0 0019 19.2V13"/>'),
  copy:     svg('<rect x="9" y="9" width="12" height="12" rx="2.4"/><path d="M5.5 15A2.5 2.5 0 013 12.5V5.5A2.5 2.5 0 015.5 3h7A2.5 2.5 0 0115 5.5"/>'),

  sun:      svg('<circle cx="12" cy="12" r="4.2"/><path d="M12 1.8v2.4M12 19.8v2.4M4.5 4.5l1.7 1.7M17.8 17.8l1.7 1.7M1.8 12h2.4M19.8 12h2.4M4.5 19.5l1.7-1.7M17.8 6.2l1.7-1.7"/>'),
  moon:     svg('<path d="M20.5 14.3A8.6 8.6 0 019.7 3.5a8.6 8.6 0 1010.8 10.8z"/>'),
  info:     svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8v.4" stroke-linecap="round"/>'),
  warn:     svg('<path d="M10.3 3.7L2.6 17a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 3.7a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 16.6v.4"/>'),
  calendar: svg('<rect x="3" y="4.5" width="18" height="16" rx="3.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
  phone:    svg('<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/>'),
  install:  svg('<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M12 7v7M9 11.2l3 3 3-3"/>'),
  clock:    svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>'),
  book:     svg('<path d="M4 4.5A1.5 1.5 0 015.5 3H11a2 2 0 012 2v15a1.6 1.6 0 00-1.6-1.6H5.5A1.5 1.5 0 014 17z"/><path d="M20 4.5A1.5 1.5 0 0018.5 3H13a2 2 0 00-2 2v15a1.6 1.6 0 011.6-1.6h5.9A1.5 1.5 0 0020 17z"/>')
};

export const icon = (name, cls = '') =>
  cls ? I[name].replace('<svg ', `<svg class="${cls}" `) : I[name];
