export function Flower() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x="45"
          y="5"
          width="10"
          height="90"
          rx="5"
          transform={`rotate(${i * 22.5} 50 50)`}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
