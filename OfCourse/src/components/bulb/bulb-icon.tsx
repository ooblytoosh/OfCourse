import { cn } from "@/lib/utils";

// Glass fill strength per level: unlit, cracked, dim, glowing, bright, radiant.
const FILL = [0, 0, 0.16, 0.42, 0.72, 0.95];
const GLOW = ["none", "none", "drop-shadow(0 0 2px var(--brand))", "drop-shadow(0 0 4px color-mix(in oklch, var(--brand) 70%, transparent))", "drop-shadow(0 0 7px var(--brand))", "drop-shadow(0 0 6px var(--brand)) drop-shadow(0 0 14px color-mix(in oklch, var(--brand) 60%, transparent))"];

const GLASS =
  "M12 2.5C7.3 2.5 4 6 4 10.3c0 2.9 1.5 4.9 3 6.4 1 1 1.6 2 1.6 3.3V21h6.8v-1c0-1.3.6-2.3 1.6-3.3 1.5-1.5 3-3.5 3-6.4C20 6 16.7 2.5 12 2.5Z";

// The lightbulb. level: 0 unlit, 1 cracked, 2 dim, 3 glowing, 4 bright,
// 5 radiant. `flash` plays the switch-on flicker; `crack` plays the crack.
export function BulbIcon({
  level,
  size = 20,
  flash = false,
  crack = false,
  className,
}: {
  level: number;
  size?: number;
  flash?: boolean;
  crack?: boolean;
  className?: string;
}) {
  const cracked = level === 1;
  const lit = level >= 2;
  return (
    <svg
      viewBox="-3 -3 30 33"
      width={size}
      height={size * 1.1}
      aria-hidden
      className={cn("shrink-0 overflow-visible transition-[filter] duration-500", className)}
      style={{ filter: GLOW[level] }}
      data-level={level}
    >
      {level === 5 && (
        <g className="bulb-rays" stroke="var(--brand)" strokeWidth="1.3" strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line key={deg} x1="12" y1="-1.6" x2="12" y2="-0.1" transform={`rotate(${deg} 12 10.5)`} />
          ))}
        </g>
      )}
      <g className={cn(flash && "bulb-flash", level === 2 && "bulb-dim", level === 5 && "bulb-shimmer")}>
        <path
          d={GLASS}
          fill="var(--brand)"
          fillOpacity={FILL[level]}
          stroke={cracked ? "var(--muted-foreground)" : lit ? "var(--brand)" : "currentColor"}
          strokeOpacity={cracked ? 0.7 : lit ? 0.95 : 0.7}
          strokeWidth="1.4"
          strokeLinejoin="round"
          className="transition-[fill-opacity,stroke] duration-500"
        />
        {level >= 4 && <ellipse cx="12" cy="9.5" rx="3.6" ry="3.2" fill="white" fillOpacity={level === 5 ? 0.55 : 0.3} />}
        <path
          d="M9.4 13.2l1.3 2.4 1.3-2.4 1.3 2.4 1.3-2.4M10.3 21v-5.1M13.7 21v-5.1"
          fill="none"
          stroke={lit ? (level >= 3 ? "oklch(0.97 0.05 95)" : "var(--brand)") : "currentColor"}
          strokeOpacity={lit ? 1 : 0.55}
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={cracked ? "1.4 1.2" : undefined}
          className={cn(flash && "bulb-filament")}
        />
      </g>
      {cracked && (
        <path
          d="M12.6 2.8l-1.7 3.3 2.2 1.6-2.6 3.1 1.8 1.8-1.4 2.2"
          fill="none"
          stroke="var(--foreground)"
          strokeOpacity="0.75"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className={cn(crack && "bulb-crack")}
        />
      )}
      <path
        d="M8.7 22.8h6.6M8.9 24.8h6.2"
        stroke={lit ? "var(--brand)" : "currentColor"}
        strokeOpacity={lit ? 0.8 : 0.6}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M10.4 26.8h3.2" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
