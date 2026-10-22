// Adapted from EasyUI Animated Number by Suraj Maurya (MIT).
// https://easyui.site/components/animated-number — see THIRD_PARTY_NOTICES.md.
import { useEffect } from 'react';
import { motion, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { money } from '../lib/data';

function Digit({ digit, reduced }: { digit: string; reduced: boolean }) {
  const numeric = /\d/.test(digit);
  const spring = useSpring(Number(digit) || 0, { stiffness: 170, damping: 25, mass: 0.6 });
  const y = useTransform(spring, (current) => `-${current * 10}%`);
  useEffect(() => {
    if (numeric) {
      if (reduced) spring.jump(Number(digit));
      else spring.set(Number(digit));
    }
  }, [digit, numeric, reduced, spring]);
  if (!numeric) return <span>{digit}</span>;
  return (
    <span className="amount-digit">
      <motion.span style={{ y }}>
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n}>{n}</span>
        ))}
      </motion.span>
    </span>
  );
}
export function AnimatedAmount({ value, reduced = false }: { value: number; reduced?: boolean }) {
  const system = useReducedMotion();
  return (
    <span className="animated-amount" role="img" aria-label={money(value)}>
      <span aria-hidden="true">
        {[...money(value)].map((digit, i) => (
          <Digit key={i} digit={digit} reduced={reduced || !!system} />
        ))}
      </span>
    </span>
  );
}
