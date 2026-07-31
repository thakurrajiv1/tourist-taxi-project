import { motion } from 'framer-motion';

/**
 * The signature element of the design: a hand-drawn dashed road that
 * "draws itself" in. Used as a section divider standing in for a plain
 * <hr>, since the product this company sells IS routes between places —
 * this makes that literal rather than decorative.
 */
export default function RouteDivider({ color = 'var(--color-border)' }) {
  return (
    <svg
      viewBox="0 0 1140 24"
      preserveAspectRatio="none"
      style={{ width: '100%', height: 24, display: 'block' }}
      aria-hidden="true"
    >
      <motion.path
        d="M0,12 Q 190,2 380,12 T 760,12 T 1140,12"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="10 10"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="0"
        cy="12"
        r="5"
        fill="var(--color-accent)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9 }}
      />
      <motion.circle
        cx="1140"
        cy="12"
        r="5"
        fill="var(--color-primary)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.0 }}
      />
    </svg>
  );
}
