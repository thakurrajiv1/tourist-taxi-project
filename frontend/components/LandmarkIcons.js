/**
 * Minimal line-art landmarks, hand-drawn in code rather than sourced as
 * stock photography — zero licensing risk, and consistent with the
 * route-line signature's illustrated style. Each uses currentColor so it
 * can be tinted per-card via CSS.
 */

const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function TajIcon(props) {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40" {...props}>
      <path {...common} d="M32 10 C 26 10 24 18 26 24 L 38 24 C 40 18 38 10 32 10 Z" />
      <path {...common} d="M20 50 L20 30 C20 26 24 24 32 24 C40 24 44 26 44 30 L44 50" />
      <circle {...common} cx="32" cy="16" r="1.6" fill="currentColor" />
      <path {...common} d="M12 50 L52 50" />
      <path {...common} d="M14 30 L14 50 M50 30 L50 50" />
    </svg>
  );
}

export function PalaceIcon(props) {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40" {...props}>
      <path {...common} d="M14 50 L14 26 L20 20 L20 50" />
      <path {...common} d="M26 50 L26 22 L32 16 L38 22 L38 50" />
      <path {...common} d="M44 50 L44 26 L50 20 L50 50" />
      <path {...common} d="M10 50 L54 50" />
      <path {...common} d="M20 34 L26 34 M38 34 L44 34" />
    </svg>
  );
}

export function MountainIcon(props) {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40" {...props}>
      <path {...common} d="M8 48 L22 26 L30 36 L40 18 L56 48 Z" />
      <path {...common} d="M35 26 L40 18 L45 26" />
      <path {...common} d="M8 48 L56 48" />
    </svg>
  );
}

export function TempleDomeIcon(props) {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40" {...props}>
      <path {...common} d="M20 50 L20 34 C20 24 44 24 44 34 L44 50" />
      <path {...common} d="M32 24 L32 14" />
      <circle {...common} cx="32" cy="12" r="2" fill="currentColor" />
      <path {...common} d="M14 50 L50 50" />
      <path {...common} d="M24 50 L24 40 M40 50 L40 40" />
    </svg>
  );
}

export function GhatIcon(props) {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40" {...props}>
      <path {...common} d="M12 44 L52 44" />
      <path {...common} d="M16 44 L16 38 L48 38 L48 44" />
      <path {...common} d="M20 38 L20 32 L44 32 L44 38" />
      <path {...common} d="M28 32 L28 18 L36 18 L36 32" />
      <path {...common} d="M32 18 L32 10" />
      <path {...common} d="M8 50 C 16 46 48 46 56 50" />
    </svg>
  );
}

export function GateIcon(props) {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40" {...props}>
      <path {...common} d="M18 50 L18 22 C18 14 46 14 46 22 L46 50" />
      <path {...common} d="M18 34 L46 34" />
      <path {...common} d="M10 50 L54 50" />
    </svg>
  );
}

/**
 * Maps a city name to the most fitting icon. Falls back to MountainIcon
 * for anywhere not explicitly mapped.
 */
export function getLandmarkIcon(cityName = '') {
  const name = cityName.toLowerCase();
  if (name.includes('agra')) return TajIcon;
  if (name.includes('jaipur')) return PalaceIcon;
  if (name.includes('amritsar')) return TempleDomeIcon;
  if (name.includes('haridwar') || name.includes('rishikesh')) return GhatIcon;
  if (name.includes('delhi')) return GateIcon;
  return MountainIcon;
}
