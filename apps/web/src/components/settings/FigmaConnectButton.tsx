'use client';

interface FigmaConnectButtonProps {
  connected: boolean;
}

export function FigmaConnectButton({ connected }: FigmaConnectButtonProps) {
  return (
    <a
      href="/api/figma/connect"
      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 38 57" fill="none">
        <path d="M19 28.5A9.5 9.5 0 0 1 28.5 19h0A9.5 9.5 0 0 1 38 28.5h0A9.5 9.5 0 0 1 28.5 38H19V28.5z" fill="#1ABCFE"/>
        <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5A9.5 9.5 0 0 1 9.5 57h0A9.5 9.5 0 0 1 0 47.5h0z" fill="#0ACF83"/>
        <path d="M19 0v19h9.5A9.5 9.5 0 0 0 28.5 0H19z" fill="#FF7262"/>
        <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5h0z" fill="#F24E1E"/>
        <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5h0z" fill="#A259FF"/>
      </svg>
      {connected ? 'Reconnect Figma' : 'Connect Figma'}
    </a>
  );
}
