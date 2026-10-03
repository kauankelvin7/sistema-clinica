import { useId } from 'react'

/** Decorative document illustration; never contains patient information. */
export default function ClinicalArtwork({ className = '' }: { className?: string }) {
  const id = useId()
  return (
    <svg className={`clinical-artwork ${className}`} viewBox="0 0 420 360" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="white" stopOpacity=".6" />
          <stop offset=".5" stopColor="white" stopOpacity=".08" />
          <stop offset="1" stopColor="white" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff9f5" /><stop offset="1" stopColor="#d3bab7" />
        </linearGradient>
        <linearGradient id={`${id}-seal`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#79b5a5" /><stop offset="1" stopColor="#275c51" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="18" stdDeviation="12" floodColor="#281519" floodOpacity=".25" />
        </filter>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <path d="M54 262 233 175 390 265 208 351Z" fill={`url(#${id}-glass)`} stroke="white" strokeOpacity=".45" />
        <g transform="translate(114 24) skewY(22)">
          <rect width="194" height="249" rx="20" fill={`url(#${id}-glass)`} stroke="white" strokeOpacity=".65" />
          <rect x="23" y="26" width="148" height="69" rx="12" fill="white" fillOpacity=".22" stroke="white" strokeOpacity=".4" />
          <circle cx="47" cy="49" r="11" fill="#9b9d8a" fillOpacity=".65" />
          <path d="M32 80v-9a15 15 0 0 1 30 0v9" fill="#9b9d8a" fillOpacity=".65" />
          <path d="M81 50h61M81 65h48M81 79h35" stroke="white" strokeOpacity=".45" strokeWidth="6" strokeLinecap="round" />
        </g>
        <g transform="translate(141 118) rotate(17)">
          <rect width="150" height="183" rx="17" fill={`url(#${id}-glass)`} stroke="white" strokeOpacity=".8" />
          <path d="M27 25h66l28 28v97a8 8 0 0 1-8 8H27a8 8 0 0 1-8-8V33a8 8 0 0 1 8-8Z" fill={`url(#${id}-paper)`} />
          <path d="M93 25v21a7 7 0 0 0 7 7h21" fill="white" fillOpacity=".6" />
          <path d="M37 66h49M37 83h64M37 100h56M37 117h39" stroke="#957c80" strokeOpacity=".6" strokeWidth="6" strokeLinecap="round" />
          <circle cx="112" cy="141" r="33" fill="white" fillOpacity=".25" stroke="white" strokeOpacity=".75" />
          <circle cx="112" cy="141" r="26" fill={`url(#${id}-seal)`} />
          <path d="m100 142 8 8 17-18" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g transform="translate(65 202) skewY(22)">
          <rect width="132" height="67" rx="12" fill={`url(#${id}-glass)`} stroke="white" strokeOpacity=".65" />
          <circle cx="25" cy="25" r="9" fill="white" fillOpacity=".3" />
          <path d="M12 51v-7a13 13 0 0 1 26 0v7" fill="white" fillOpacity=".3" />
          <path d="M53 26h58M53 41h43M53 53h29" stroke="white" strokeOpacity=".3" strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}
