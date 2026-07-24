import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#14213D',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 56 56" fill="none">
          <path d="M14 32 A14 14 0 0 1 42 32" stroke="#E2A63C" strokeWidth="4" strokeLinecap="round" />
          <circle cx="28" cy="33" r="5" fill="#E2A63C" />
        </svg>
      </div>
    ),
    size,
  )
}
