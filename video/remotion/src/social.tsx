import React from 'react';
import {Img} from 'remotion';
import {C, FONT_BODY, img} from './lib';

// Generic, unbranded social-post UI (illustrative only).

export const Heart: React.FC<{size: number; fill?: string; stroke?: string}> = ({size, fill = 'none', stroke = C.white}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.1 1.7-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"
      fill={fill} stroke={stroke} strokeWidth={1.8} strokeLinejoin="round"
    />
  </svg>
);

const Bubble: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.1A8.5 8.5 0 1 1 20.5 11.5z" fill="none" stroke={C.white} strokeWidth={1.8} strokeLinejoin="round" />
  </svg>
);

const Send: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M21 3 10 14M21 3l-6.5 18-4.5-7-7-4.5L21 3z" fill="none" stroke={C.white} strokeWidth={1.8} strokeLinejoin="round" />
  </svg>
);

export const Post: React.FC<{
  photo: string; pos?: string; width: number; imgH: number; likes: string; liked?: boolean; caption?: string;
  iconOpacity?: number; style?: React.CSSProperties;
}> = ({photo, pos = 'center', width, imgH, likes, liked = false, caption, iconOpacity = 1, style}) => {
  const u = width / 900; // design at 900px wide
  return (
    <div
      style={{
        width, background: '#121413', borderRadius: 34 * u, overflow: 'hidden', border: `1.5px solid ${C.line}`,
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)', fontFamily: FONT_BODY, color: C.white, ...style,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 20 * u, padding: `${22 * u}px ${26 * u}px`}}>
        <div style={{width: 64 * u, height: 64 * u, borderRadius: '50%', padding: 4 * u, background: `conic-gradient(${C.green}, #f5d76e, ${C.red}, ${C.green})`}}>
          <div style={{width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: `${3 * u}px solid #121413`}}>
            <Img src={img(photo)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}} />
          </div>
        </div>
        <div style={{fontWeight: 800, fontSize: 34 * u}}>totally.rich</div>
        <div style={{marginLeft: 'auto', fontWeight: 900, fontSize: 34 * u, color: C.gray}}>•••</div>
      </div>
      <div style={{height: imgH, overflow: 'hidden'}}>
        <Img src={img(photo)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}} />
      </div>
      <div style={{padding: `${22 * u}px ${26 * u}px ${26 * u}px`}}>
        <div style={{display: 'flex', gap: 26 * u, opacity: iconOpacity}}>
          <Heart size={56 * u} fill={liked ? C.red : 'none'} stroke={liked ? C.red : C.white} />
          <Bubble size={56 * u} />
          <Send size={56 * u} />
        </div>
        <div style={{fontWeight: 800, fontSize: 32 * u, marginTop: 14 * u, fontVariantNumeric: 'tabular-nums', opacity: iconOpacity}}>{likes}</div>
        {caption && <div style={{fontWeight: 500, fontSize: 30 * u, marginTop: 8 * u, color: '#c9cfcb'}}>{caption}</div>}
      </div>
    </div>
  );
};

/** Lock-screen style notification banner (generic). */
export const Notice: React.FC<{title: string; body: string; accent?: string; style?: React.CSSProperties}> = ({
  title, body, accent = C.red, style,
}) => (
  <div
    style={{
      position: 'absolute', left: 70, width: 940, padding: '24px 28px', borderRadius: 30, display: 'flex', gap: 22, alignItems: 'center',
      background: 'rgba(28,32,30,0.92)', border: `1.5px solid ${C.line}`, boxShadow: '0 24px 50px rgba(0,0,0,0.55)',
      fontFamily: FONT_BODY, color: C.white, ...style,
    }}
  >
    <div style={{width: 68, height: 68, borderRadius: 18, background: accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 40, color: '#fff'}}>
      $
    </div>
    <div style={{flex: 1}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 28, letterSpacing: '0.04em', color: C.gray}}>
        <span>{title}</span>
        <span style={{fontWeight: 600}}>now</span>
      </div>
      <div style={{fontWeight: 700, fontSize: 34, marginTop: 6}}>{body}</div>
    </div>
  </div>
);
