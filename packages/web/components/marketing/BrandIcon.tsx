import { cn } from "@/lib/utils";

interface BrandIconProps {
  className?: string;
}

export default function BrandIcon({ className }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      {/* Outer tire ring */}
      <circle
        cx="32"
        cy="32"
        r="30"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="opacity-90"
      />

      {/* Inner tire ring */}
      <circle
        cx="32"
        cy="32"
        r="24"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        className="opacity-70"
      />

      {/* Tire tread pattern */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = i * 30 * (Math.PI / 180);
        const startX = 32 + 27 * Math.cos(angle);
        const startY = 32 + 27 * Math.sin(angle);
        const endX = 32 + 21 * Math.cos(angle);
        const endY = 32 + 21 * Math.sin(angle);

        return (
          <line
            key={i}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="currentColor"
            strokeWidth="1"
            className="opacity-60"
          />
        );
      })}

      {/* Center bolt/hub */}
      <circle
        cx="32"
        cy="32"
        r="8"
        fill="currentColor"
        className="opacity-90"
      />

      {/* Bolt holes */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = i * 60 * (Math.PI / 180);
        const x = 32 + 14 * Math.cos(angle);
        const y = 32 + 14 * Math.sin(angle);

        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2.5"
            fill="currentColor"
            className="opacity-80"
          />
        );
      })}

      {/* Center hub detail */}
      <circle
        cx="32"
        cy="32"
        r="4"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        className="opacity-60"
      />

      {/* Speed lines/motion effect */}
      <path
        d="M 8 32 Q 16 28 24 32 Q 16 36 8 32"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        className="opacity-40"
      />
      <path
        d="M 6 28 Q 12 25 18 28"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        className="opacity-30"
      />
      <path
        d="M 6 36 Q 12 39 18 36"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        className="opacity-30"
      />
    </svg>
  );
}
