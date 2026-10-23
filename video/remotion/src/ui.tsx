import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {C, FONT_BODY, FONT_HEAD, FPS, IN_OUT, OUT, cut, img, mix, p} from './lib';
import {CAPTIONS, Cap} from './timing';

export const useT = () => useCurrentFrame() / FPS;

/** Full-bleed photo with slow push, optional blur/darkening. */
export const Photo: React.FC<{
  src: string; zoom?: number; blur?: number; dark?: number; pos?: string; style?: React.CSSProperties;
}> = ({src, zoom = 1, blur = 0, dark = 0, pos = 'center', style}) => (
  <AbsoluteFill style={{overflow: 'hidden', ...style}}>
    <Img
      src={img(src)}
      style={{
        width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos,
        transform: `scale(${zoom})`, filter: blur ? `blur(${blur}px)` : undefined,
      }}
    />
    {dark > 0 && <AbsoluteFill style={{background: `rgba(11,13,12,${dark})`}} />}
  </AbsoluteFill>
);

/** Transparent product/person cutout positioned in frame pixels. */
export const Cutout: React.FC<{
  name: string; x: number; y: number; w: number; rot?: number; scale?: number; opacity?: number;
  shadow?: boolean; style?: React.CSSProperties; origin?: string;
}> = ({name, x, y, w, rot = 0, scale = 1, opacity = 1, shadow = true, style, origin = 'center'}) => (
  <Img
    src={cut(name)}
    style={{
      position: 'absolute', left: x, top: y, width: w, opacity,
      transform: `rotate(${rot}deg) scale(${scale})`, transformOrigin: origin,
      filter: shadow ? 'drop-shadow(0 28px 34px rgba(0,0,0,0.55)) drop-shadow(0 6px 10px rgba(0,0,0,0.35))' : undefined,
      ...style,
    }}
  />
);

/** Headline line revealed upward from behind a mask. */
export const RevealLine: React.FC<{
  t: number; at: number; children: React.ReactNode; size: number; color?: string; dur?: number;
  style?: React.CSSProperties; out?: number;
}> = ({t, at, children, size, color = C.white, dur = 0.42, style, out}) => {
  const k = p(t, at, at + dur, OUT);
  const o = out !== undefined ? p(t, out, out + 0.25, IN_OUT) : 0;
  return (
    <div style={{overflow: 'hidden', lineHeight: 0.98, paddingBottom: size * 0.06}}>
      <div
        style={{
          fontFamily: FONT_HEAD, fontWeight: 900, fontSize: size, color, letterSpacing: '-0.035em',
          textTransform: 'uppercase', transform: `translateY(${(1 - k) * 105 - o * 105}%)`,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Small kicker label, e.g. "NUMBER ONE". */
export const Kicker: React.FC<{t: number; at: number; children: React.ReactNode; color?: string}> = ({
  t, at, children, color = C.green,
}) => {
  const k = p(t, at, at + 0.35);
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 14, padding: '12px 24px 12px 18px',
        borderRadius: 999, background: 'rgba(11,13,12,0.72)', border: `1.5px solid ${color}55`,
        fontFamily: FONT_BODY, fontWeight: 800, fontSize: 30, letterSpacing: '0.2em', color,
        opacity: k, transform: `translateX(${(1 - k) * -30}px)`, backdropFilter: 'blur(8px)',
      }}
    >
      <span style={{width: 12, height: 12, borderRadius: 6, background: color, boxShadow: `0 0 14px ${color}`}} />
      {children}
    </div>
  );
};

export const Glass: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) => (
  <div
    style={{
      position: 'absolute', background: C.panel, border: `1.5px solid ${C.line}`, borderRadius: 30,
      boxShadow: '0 30px 60px rgba(0,0,0,0.5)', backdropFilter: 'blur(14px)', ...style,
    }}
  >
    {children}
  </div>
);

/** Paper price tag with string hole; flips to a red debt label when `debt` is 1. */
export const PriceTag: React.FC<{price: string; label?: string; debt?: number; style?: React.CSSProperties}> = ({
  price, label, debt = 0, style,
}) => {
  const bg = debt > 0.5 ? C.red : '#F4F1EA';
  const fg = debt > 0.5 ? '#fff' : '#121412';
  const flip = Math.abs(Math.cos(debt * Math.PI));
  return (
    <div
      style={{
        position: 'absolute', width: 210, height: 112, borderRadius: '14px 14px 14px 14px',
        clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)',
        background: bg, color: fg, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingLeft: 52, transform: `scaleY(${flip})`, boxShadow: '0 12px 24px rgba(0,0,0,0.4)', ...style,
      }}
    >
      <div style={{position: 'absolute', left: 16, top: 47, width: 18, height: 18, borderRadius: 9, background: 'rgba(0,0,0,0.55)'}} />
      <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 18, letterSpacing: '0.16em', opacity: 0.75}}>
        {debt > 0.5 ? 'DEBT' : label ?? 'PRICE'}
      </div>
      <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 46, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>
        {debt > 0.5 ? `−${price}` : price}
      </div>
    </div>
  );
};

const colorOf = (c?: string) => (c === 'g' ? C.green : c === 'r' ? C.red : C.white);

/** Narration captions: phrase-level, gentle rise-in, keyword color only. */
export const Captions: React.FC = () => {
  const t = useT();
  const cap = CAPTIONS.find((c: Cap) => t >= c.s - 0.02 && t < c.e + 0.12);
  if (!cap) return null;
  const k = p(t, cap.s - 0.02, cap.s + 0.16, OUT);
  const o = p(t, cap.e - 0.02, cap.e + 0.12, IN_OUT);
  return (
    <div
      style={{
        position: 'absolute', left: 120, right: 120, top: 1352, textAlign: 'center',
        opacity: k * (1 - o), transform: `translateY(${(1 - k) * 16}px) scale(${mix(0.97, 1, k)})`,
      }}
    >
      {cap.lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: FONT_BODY, fontWeight: 800, fontSize: 62, lineHeight: 1.16, letterSpacing: '-0.012em',
            color: C.white, textShadow: '0 3px 0 rgba(0,0,0,0.55), 0 6px 24px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.9)',
          }}
        >
          {line.map((wd, j) => (
            <span key={j} style={{color: colorOf(wd.c)}}>
              {wd.text}
              {j < line.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

/** Film grain + vignette finishing layer. */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  const ox = Math.floor((Math.sin(f * 7.1) * 0.5 + 0.5) * 512);
  const oy = Math.floor((Math.cos(f * 3.7) * 0.5 + 0.5) * 512);
  return (
    <>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${img('grain.png')})`, backgroundSize: '512px 512px',
          backgroundPosition: `${ox}px ${oy}px`, mixBlendMode: 'overlay', opacity: 0.09,
        }}
      />
    </>
  );
};

export const Watermark: React.FC<{opacity?: number}> = ({opacity = 0.5}) => (
  <div
    style={{
      position: 'absolute', left: 64, top: 1560, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 28,
      letterSpacing: '0.04em', color: C.white, opacity, textShadow: '0 2px 8px rgba(0,0,0,0.6)',
    }}
  >
    @stackwithgio
  </div>
);
