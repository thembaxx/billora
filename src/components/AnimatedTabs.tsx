// Adapted from EasyUI Animated Tabs by Suraj Maurya (MIT).
// https://easyui.site/components/animated-tabs — see THIRD_PARTY_NOTICES.md.
import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';

export function AnimatedTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  compact = false,
}: {
  items: { id: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  compact?: boolean;
}) {
  const id = useId();
  return (
    <div className={`animated-tabs ${compact ? 'compact' : ''}`} role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          aria-pressed={value === item.id}
          className={value === item.id ? 'active' : ''}
          onClick={() => onChange(item.id)}
        >
          {value === item.id && (
            <motion.span
              className="tab-indicator"
              layoutId={id}
              transition={{ type: 'spring', stiffness: 390, damping: 31 }}
            />
          )}
          <span className="tab-label">
            {item.icon}
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
