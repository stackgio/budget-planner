import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {BACK, C, FONT_BODY, FONT_HEAD, IN_OUT, OUT, cut, img, mix, p} from '../lib';
import {T} from '../timing';
import {Photo, RevealLine, useT} from '../ui';
import {Heart} from '../social';

const Tile: React.FC<{t: number; at: number; x: number; n: number; label: string; children: React.ReactNode}> = ({t, at, x, n, label, children}) => {
  const k = p(t, at, at + 0.5, BACK);
  const o = p(t, at, at + 0.15);
  return (
    <div style={{position: 'absolute', left: x, top: 300, width: 300, opacity: o, transform: `translateY(${(1 - k) * 80}px) scale(${mix(0.85, 1, k)})`}}>
      <div
        style={{
          position: 'relative', width: 300, height: 300, borderRadius: 34, overflow: 'hidden', background: 'linear-gradient(160deg, #1b211e, #0f1211)',
          border: `1.5px solid ${C.line}`, boxShadow: '0 26px 50px rgba(0,0,0,0.55)',
        }}
      >
        {children}
        <div
          style={{
            position: 'absolute', left: 18, top: 18, width: 54, height: 54, borderRadius: 27, background: C.green, color: C.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 32,
          }}
        >
          {n}
        </div>
      </div>
      <div style={{marginTop: 18, textAlign: 'center', fontFamily: FONT_BODY, fontWeight: 800, fontSize: 30, letterSpacing: '0.06em', color: C.white, lineHeight: 1.15, whiteSpace: 'pre-line'}}>
        {label}
      </div>
    </div>
  );
};

// 0:35.35–end — return to the three categories; comment prompt.
export const S9CTA: React.FC = () => {
  const t = useT();
  const enter = p(t, 35.35, 35.7, OUT);
  const breathe = 0.5 + 0.5 * Math.sin(t * 2.4);
  const bob = Math.sin(t * 6) * 8 * p(t, 37.0, 37.3);
  const q = p(t, T.whats + 0.1, T.whats + 0.4, OUT);
  return (
    <AbsoluteFill style={{background: C.bg, opacity: enter}}>
      <Photo src="stage_floor.jpg" zoom={1.08} pos="50% 75%" dark={0.25} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 40% at 50% 52%, rgba(54,224,121,${0.1 + breathe * 0.05}), rgba(0,0,0,0) 70%)`}} />

      <Tile t={t} at={T.whats} x={45} n={1} label="CAR">
        <Img src={cut('car_highway')} style={{position: 'absolute', left: -10, top: 120, width: 330}} />
      </Tile>
      <Tile t={t} at={T.whats + 0.15} x={390} n={2} label={'CLOTHES\n& SHOES'}>
        <Img src={cut('sneakers_hightop')} style={{position: 'absolute', left: 20, top: 60, width: 270, transform: 'rotate(-6deg)'}} />
      </Tile>
      <Tile t={t} at={T.whats + 0.3} x={735} n={3} label={'IMPRESSING\nPEOPLE'}>
        <Img src={img('man_black_suv.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '78% 40%'}} />
        <div style={{position: 'absolute', right: 16, bottom: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(11,13,12,0.8)', color: C.white, fontFamily: FONT_BODY, fontWeight: 800, fontSize: 24}}>
          <Heart size={28} fill={C.red} stroke={C.red} /> 2.4k
        </div>
      </Tile>

      <div style={{position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center'}}>
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <RevealLine t={t} at={T.you - 0.1} size={124}>WHAT&apos;S YOUR</RevealLine>
        </div>
        <div
          style={{
            fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 250, letterSpacing: '-0.05em', lineHeight: 0.95, color: C.green,
            textShadow: `0 0 ${40 + breathe * 30}px rgba(54,224,121,0.35)`,
            transform: `scale(${mix(0.6, 1, p(t, T.you + 0.12, T.you + 0.5, BACK))})`, opacity: p(t, T.you + 0.12, T.you + 0.22),
          }}
        >
          #1?
        </div>
      </div>

      {/* spoken question, then the comment prompt */}
      <div
        style={{
          position: 'absolute', left: 110, right: 110, top: 1188, textAlign: 'center', fontFamily: FONT_BODY, fontWeight: 700, fontSize: 40,
          lineHeight: 1.25, color: '#cfd5d1', opacity: q * (1 - p(t, 37.9, 38.2, IN_OUT)),
        }}
      >
        What&apos;s one thing <span style={{color: C.green, fontWeight: 900}}>YOU</span> refuse to go into debt for?
      </div>
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: 1330, display: 'flex', justifyContent: 'center',
          opacity: p(t, 36.85, 37.0), transform: `scale(${mix(0.7, 1, p(t, 36.85, 37.2, BACK))})`,
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 18, padding: '24px 46px', borderRadius: 999, background: C.green, color: C.bg,
            fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 56, letterSpacing: '-0.01em', boxShadow: `0 18px 50px rgba(54,224,121,${0.25 + breathe * 0.15})`,
          }}
        >
          COMMENT BELOW <span style={{display: 'inline-block', transform: `translateY(${bob}px)`}}>↓</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1500, textAlign: 'center', fontFamily: FONT_BODY, fontWeight: 700, fontSize: 32, color: C.white, opacity: 0.6 * p(t, 36.0, 36.4)}}>
        @stackwithgio
      </div>
    </AbsoluteFill>
  );
};

