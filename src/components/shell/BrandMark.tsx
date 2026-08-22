/**
 * The ZEVQORA mark, inlined as a component so it can inherit `currentColor`
 * and scale without a network request. Mirrors public/brand/zevqora-mark.svg.
 */
export function BrandMark({
  size = 32,
  title = 'ZEVQORA',
}: {
  readonly size?: number
  readonly title?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label={title}
      focusable="false"
    >
      <g
        stroke="currentColor"
        strokeWidth={3.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="42" cy="32" r="14.5" opacity={0.9} />
        <path d="M31.5 41.5a14.5 14.5 0 0 1 2.6-17.2" opacity={0.55} />
        <path d="M16 16.5h23.5L18.5 47.5H40" />
        <path d="M24.5 35.5 43 25.5l11 20" />
      </g>
      <g fill="currentColor">
        <circle cx="16" cy="16.5" r="3.6" />
        <circle cx="24.5" cy="35.5" r="3.6" />
        <circle cx="43" cy="25.5" r="3.6" />
        <circle cx="54" cy="45.5" r="3.6" />
      </g>
    </svg>
  )
}
