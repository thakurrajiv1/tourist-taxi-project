import { motion } from 'framer-motion';

const WAYPOINTS = [
  { x: 55, y: 385, label: 'DELHI' },
  { x: 175, y: 300, label: 'CHANDIGARH' },
  { x: 300, y: 195, label: 'SHIMLA' },
  { x: 430, y: 70, label: 'MANALI' },
];

/**
 * The hero's thesis, made literal: a road drawing itself from Delhi up
 * into the hills to Manali — one of the company's real seeded routes.
 * This stands in for a stock photo — it IS the product (a priced route)
 * rendered as the page's opening image.
 */
export default function RouteMapHero() {
  return (
    <svg
      viewBox="0 0 480 420"
      style={{ width: '100%', height: 'auto', maxWidth: 440 }}
      role="img"
      aria-label="Illustrated route map from Delhi to Manali"
    >
      {/* Mountain silhouette backdrop near the destination */}
      <path
        d="M300,110 L345,45 L375,85 L410,20 L460,110 Z"
        fill="var(--color-primary-dark)"
        opacity="0.15"
      />

      {/* The road */}
      <motion.path
        d="M55,385 C 110,345 130,320 175,300 C 230,275 260,240 300,195 C 345,145 385,120 430,70"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="4"
        strokeDasharray="14 12"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.2 }}
      />

      {/* Waypoint markers */}
      {WAYPOINTS.map((wp, i) => (
        <motion.g
          key={wp.label}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.3, duration: 0.4, ease: 'backOut' }}
        >
          <circle
            cx={wp.x}
            cy={wp.y}
            r={i === WAYPOINTS.length - 1 ? 9 : 6}
            fill={i === WAYPOINTS.length - 1 ? 'var(--color-accent)' : 'var(--color-primary)'}
            stroke="var(--color-white)"
            strokeWidth="2.5"
          />
          <text
            x={wp.x}
            y={wp.y - 16}
            textAnchor="middle"
            fontFamily="var(--font-mono), monospace"
            fontSize="11"
            fontWeight="600"
            fill="var(--color-primary-dark)"
          >
            {wp.label}
          </text>
        </motion.g>
      ))}

      {/* Distance milestone tag */}
      <motion.g
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.4 }}
      >
        <rect x="225" y="245" width="76" height="28" rx="6" fill="var(--color-accent)" />
        <text
          x="263"
          y="263"
          textAnchor="middle"
          fontFamily="var(--font-mono), monospace"
          fontSize="12"
          fontWeight="700"
          fill="var(--color-primary-dark)"
        >
          540 KM
        </text>
      </motion.g>
    </svg>
  );
}
