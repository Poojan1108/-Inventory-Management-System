import React from 'react';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="15 14 69 81" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="frontLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00A3FF" />
          <stop offset="100%" stopColor="#0047FF" />
        </linearGradient>
        <linearGradient id="topLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A8CFF" />
          <stop offset="100%" stopColor="#0033CC" />
        </linearGradient>
      </defs>

      {/* Front Left Face */}
      <path d="M15 35 V74 L48 93 V54 Z" fill="url(#frontLeftGrad)" />
      
      {/* Top Left Piece */}
      <path d="M48 14 L15 33 L51 53 L84 34 Z" fill="url(#topLeftGrad)" />
      
      {/* Gap separator using dark blue background line to simulate depth */}
      <path d="M40 22 L79 43.5 L74 46 L35 24.5 Z" fill="#0A1930" />
      
      {/* Front Right Face (Dark Blue) */}
      <path d="M50 55.5 L84 36 V75 L50 94.5 Z" fill="#0A1930" />
      
      {/* White Front Flap / Tape overlapping */}
      <path d="M48 54 L52 52 V61 L48 63 Z" fill="#F8FAFC" />

      {/* Bar Chart (White) */}
      {/* Short */}
      <path d="M57 82 V70 L61 67.5 V79.5 Z" fill="white" />
      {/* Medium */}
      <path d="M64 78 V60 L68 57.5 V75.5 Z" fill="white" />
      {/* Tall */}
      <path d="M71 74 V50 L75 47.5 V71.5 Z" fill="white" />
    </svg>
  );
}
