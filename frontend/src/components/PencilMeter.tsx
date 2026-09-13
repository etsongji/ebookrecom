interface PencilMeterProps {
  value: number;
  max: number;
  label?: string;
}

export default function PencilMeter({ value, max, label }: PencilMeterProps) {
  return (
    <span className="pencil" role="img" aria-label={label ?? `난이도 ${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={i < value ? 'on' : undefined} />
      ))}
    </span>
  );
}
