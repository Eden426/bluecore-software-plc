function Svg({ className, children }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden
    >
      <g
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </svg>
  );
}

/** Hub — system integration */
export function IconIntegration({ className = "h-8 w-8" }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="5" r="2.25" />
      <circle cx="6" cy="18" r="2.25" />
      <circle cx="18" cy="18" r="2.25" />
      <path d="M12 7v3M10.2 14.5 7.5 16.2M13.8 14.5 16.5 16.2" />
    </Svg>
  );
}

/** Monitor — web applications */
export function IconWebApp({ className = "h-8 w-8" }) {
  return (
    <Svg className={className}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Svg>
  );
}

/** Chip — AI */
export function IconAI({ className = "h-8 w-8" }) {
  return (
    <Svg className={className}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      <path d="M5.6 5.6 7 7M17 17l1.4 1.4M17.4 5.6 16 7M7 17l-1.4 1.4" />
    </Svg>
  );
}

/** Gear — custom software */
export function IconCustomDev({ className = "h-8 w-8" }) {
  return (
    <Svg className={className}>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  );
}

/** Spark — digital transformation */
export function IconTransform({ className = "h-8 w-8" }) {
  return (
    <Svg className={className}>
      <path d="M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5L12 3Z" />
      <path d="M19 5 18 7M5 19l-1 2" />
    </Svg>
  );
}

/** Cloud — cloud & DevOps */
export function IconCloudOps({ className = "h-8 w-8" }) {
  return (
    <Svg className={className}>
      <path d="M7 18a4 4 0 0 1 0-8h.5A5.5 5.5 0 0 1 17.5 9a4 4 0 0 1 .3 8H7Z" />
      <path d="M12 12v6M10 16h4" />
    </Svg>
  );
}

/** Document + arrows — digitization */
export function IconDigitize({ className = "h-8 w-8" }) {
  return (
    <Svg className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h4" />
      <path d="M18 20h3M19.5 18.5v3M3 8h3M4.5 6.5v3" />
    </Svg>
  );
}

/** Pen — design & consulting */
export function IconDesign({ className = "h-8 w-8" }) {
  return (
    <Svg className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </Svg>
  );
}

/** Shield + check — security & QA */
export function IconShieldQA({ className = "h-8 w-8" }) {
  return (
    <Svg className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  );
}
