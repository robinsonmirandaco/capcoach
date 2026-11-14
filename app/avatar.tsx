"use client";

export type Mood = "idle" | "listening" | "thinking" | "speaking" | "happy";

/**
 * El avatar de Cap Coach: un mundito de océano, inspirado en el logo de
 * Plastic Fisherman (turquesa, con la botella-pez nadando alrededor).
 * Parpadea, flota, mueve la boca al hablar y reacciona según el estado.
 */
export function World({ mood = "idle", size = 64 }: { mood?: Mood; size?: number }) {
  return (
    <svg className={"world " + mood} width={size} height={size} viewBox="0 0 140 140" aria-hidden="true">
      <ellipse className="w-shadow" cx="70" cy="132" rx="26" ry="4" fill="rgba(10,74,104,.18)" />

      {/* anillos al escuchar */}
      <circle className="w-ring" cx="70" cy="72" r="46" fill="none" stroke="#ef4f6b" strokeWidth="3" />
      <circle className="w-ring two" cx="70" cy="72" r="46" fill="none" stroke="#ef4f6b" strokeWidth="3" />

      <g className="w-body">
        <circle cx="70" cy="72" r="40" fill="#19b3d3" />
        {/* brillo */}
        <path d="M40 54a34 34 0 0 1 22-18" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".55" />
        {/* olas */}
        <path d="M33 92c7 5 12-3 19 1s12 5 19 0 12-4 19 1 9 2 12-1" stroke="#8fe3f2" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".8" />
        <path d="M42 102c6 4 10-2 16 1s10 4 16 0 9-3 14 0" stroke="#8fe3f2" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".55" />
        {/* islas */}
        <path d="M39 50c3-7 12-9 16-4s-2 8-7 9-11 1-9-5z" fill="#4fae2c" />
        <path d="M92 46c4-2 9 0 9 4s-4 6-8 5-4-6-1-9z" fill="#4fae2c" />

        {/* cara */}
        <g className="w-eyes">
          <circle cx="57" cy="70" r="8" fill="#0c2b3a" />
          <circle cx="83" cy="70" r="8" fill="#0c2b3a" />
          <circle cx="59.6" cy="67" r="2.8" fill="#fff" />
          <circle cx="85.6" cy="67" r="2.8" fill="#fff" />
          <circle cx="54.6" cy="72.6" r="1.3" fill="#fff" />
          <circle cx="80.6" cy="72.6" r="1.3" fill="#fff" />
        </g>
        <ellipse cx="46" cy="81" rx="5.5" ry="3.2" fill="#ef4f6b" opacity=".55" />
        <ellipse cx="94" cy="81" rx="5.5" ry="3.2" fill="#ef4f6b" opacity=".55" />
        <path className="w-smile" d="M63 82q7 7 14 0" stroke="#0c2b3a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <g className="w-mouth">
          <ellipse cx="70" cy="84" rx="6.5" ry="5.5" fill="#0c2b3a" />
          <ellipse cx="70" cy="87" rx="3.6" ry="2.2" fill="#ef4f6b" />
        </g>

        {/* la tapa, de sombrero */}
        <g transform="rotate(-13 70 30)">
          <rect x="55" y="22" width="30" height="11" rx="3.5" fill="#f7c53d" />
          <rect x="53" y="31" width="34" height="5" rx="2.5" fill="#e0aa1c" />
          <path d="M61 25v6M67 25v6M73 25v6M79 25v6" stroke="#e0aa1c" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </g>

      {/* la botella-pez nada alrededor del mundo */}
      <g className="w-fish">
        <g>
          <path d="M-9 0l-7-5.5v11z" fill="#fff" stroke="#0a4a68" strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="-10" y="-5.5" width="17" height="11" rx="4.5" fill="#fff" stroke="#0a4a68" strokeWidth="1.4" />
          <rect x="6.4" y="-3.4" width="5" height="6.8" rx="1.4" fill="#f7c53d" stroke="#0a4a68" strokeWidth="1.2" />
          <circle cx="2.2" cy="-1.2" r="1.4" fill="#0a4a68" />
          <path d="M-5.5-2.2h4M-5.5 1.6h3" stroke="#19b3d3" strokeWidth="1.3" strokeLinecap="round" />
          <animateMotion dur="11s" repeatCount="indefinite" rotate="auto" path="M70 16a56 56 0 1 1 -.1 0z" />
        </g>
      </g>
    </svg>
  );
}
