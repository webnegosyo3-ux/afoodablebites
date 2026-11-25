import React from 'react';

interface QRCodeDisplayProps {
  /** Size of the QR card in pixels (default 280) */
  size?: number;
  /** Show the branded card wrapper (default true) */
  showCard?: boolean;
  className?: string;
}

const QR_URL = 'https://afoodablebites.vercel.app/';

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  size = 280,
  showCard = true,
  className = '',
}) => {
  const qrImg = (
    <div className="relative inline-flex items-center justify-center">
      {/* QR Code image */}
      <img
        src="/images/afoodable-bites-qr.png"
        alt="Scan to order at Afoodable Bites"
        width={size}
        height={size}
        className="rounded-2xl"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Logo overlay in the centre */}
      <div
        className="absolute rounded-full overflow-hidden border-4 border-white shadow-lg"
        style={{ width: size * 0.22, height: size * 0.22 }}
      >
        <img
          src="/images/afodable-bites-logo.jpg"
          alt="Afoodable Bites"
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    </div>
  );

  if (!showCard) return <div className={className}>{qrImg}</div>;

  return (
    <div className={`inline-flex flex-col items-center bg-white rounded-3xl shadow-2xl overflow-hidden ${className}`}>
      {/* Amber top bar */}
      <div className="w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

      <div className="px-6 pt-5 pb-2 flex flex-col items-center space-y-3">
        {/* Headline */}
        <div className="text-center">
          <p className="font-black text-zinc-900 text-lg leading-tight">Afoodable Bites</p>
          <p className="text-zinc-500 text-xs font-medium">Always Serving Hot! 🔥</p>
        </div>

        {/* QR */}
        {qrImg}

        {/* CTA */}
        <div className="text-center space-y-0.5">
          <p className="font-bold text-zinc-800 text-sm">📱 Scan to Order Online</p>
          <p className="text-zinc-400 text-xs break-all">{QR_URL}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-zinc-900 px-4 py-2 text-center">
        <p className="text-amber-400 text-xs font-black tracking-wide">
          🍗 Order. Scan. Enjoy!
        </p>
      </div>

      {/* Amber bottom bar */}
      <div className="w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-400" />
    </div>
  );
};

export default QRCodeDisplay;
