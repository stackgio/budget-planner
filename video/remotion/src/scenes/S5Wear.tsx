import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {C, FONT_BODY, FONT_HEAD, IN, IN_OUT, OUT, cut, mix, p, shake} from '../lib';
import {T} from '../timing';
import {Photo, RevealLine, useT} from '../ui';
import {CART_TOTAL} from './S5Cart';

const FIG = {x: 250, y: 420, w: 690, h: 870};
const at = (nx: number, ny: number) => ({x: FIG.x + nx * FIG.w, y: FIG.y + ny * FIG.h});
const JACKET = at(0.9, 0.4);
const SHOE = at(0.11, 0.57);
const FACE = at(0.77, 0.09);

/** A debt tag that drops in on a string and clips onto the outfit. */
const DebtTag: React.FC<{t: number; at: number; anchor: {x: number; y: number}; dx: number; dy: number; big?: boolean; amount: string}> = ({
  t, at, anchor, dx, dy, big, amount,
}) => {
  const k = p(t, at - 0.25, at + 0.05, OUT);
  const settle = t > at ? Math.sin((t - at) * 14) * Math.exp(-(t - at) * 5) * 10 : 0;
  if (t < at - 0.25) return null;
  const tx = anchor.x + dx;
  const ty = mix(anchor.y - 700, anchor.y + dy, k);
  const w = big ? 300 : 220;
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <line x1={anchor.x} y1={anchor.y} x2={tx} y2={ty} stroke={C.red} strokeWidth={4} opacity={p(k, 0.7, 1)} />
        <circle cx={anchor.x} cy={anchor.y} r={10} fill={C.red} opacity={p(k, 0.9, 1)} />
      </svg>
      <div
        style={{
          position: 'absolute', left: tx - w / 2, top: ty, width: w, padding: big ? '16px 0 18px' : '12px 0 14px', textAlign: 'center',
          background: C.red, color: '#fff', borderRadius: 16, transform: `rotate(${(dx > 0 ? 6 : -6) + settle}deg)`, transformOrigin: '50% 0%',
          boxShadow: '0 20px 40px rgba(255,87,87,0.35)', clipPath: 'polygon(50% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)',
        }}
      >
        <div style={{width: 18, height: 18, borderRadius: 9, background: 'rgba(0,0,0,0.5)', margin: '0 auto 6px'}} />
        <div style={{fontFamily: FONT_BODY, fontWeight: 900, fontSize: big ? 26 : 22, letterSpacing: '0.2em'}}>DEBT</div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: big ? 66 : 52, letterSpacing: '-0.02em'}}>{amount}</div>
      </div>
    </>
  );
};

// 0:19.5–0:23.2 — "Imagine literally wearing your debt." Debt tags clip onto the outfit.
export const S5Wear: React.FC = () => {
  const t = useT();
  const inK = p(t, 19.5, 19.95, OUT);
  const exit = p(t, 22.92, 23.2, IN);
  const zoom = mix(1, 1.45, p(t, T.thats, T.thats + 0.18, OUT));
  const sk = shake(t, T.debt2, 10, 0.25);
  const sk2 = shake(t, T.thats + 0.05, 10, 0.3);
  const red = p(t, T.wearing, T.debt2 + 0.3, IN_OUT);
  return (
    <AbsoluteFill style={{background: C.bg, opacity: p(t, 19.45, 19.6), transform: `translateX(${-exit * 1100}px)`}}>
      <Photo src="stage_floor.jpg" zoom={1.1} pos="50% 75%" />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 45% at 60% 55%, rgba(255,87,87,${0.05 + red * 0.15}), rgba(0,0,0,0) 70%)`}} />

      {/* headline, revealed with the words */}
      <div style={{position: 'absolute', left: 60, top: 200, opacity: 1 - p(t, T.thats, T.thats + 0.15)}}>
        <RevealLine t={t} at={T.wearing - 0.05} size={118}>WEARING</RevealLine>
        <RevealLine t={t} at={T.your - 0.05} size={118} color={C.red}>YOUR DEBT</RevealLine>
      </div>

      <AbsoluteFill style={{transform: `translate(${sk.x + sk2.x}px, ${sk.y + sk2.y}px) scale(${zoom})`, transformOrigin: `${FACE.x}px ${FACE.y}px`}}>
        <Img
          src={cut('man_fullbody')}
          style={{position: 'absolute', left: FIG.x, top: FIG.y + (1 - inK) * 240, width: FIG.w, opacity: inK, filter: 'drop-shadow(0 34px 40px rgba(0,0,0,0.65))'}}
        />
        <DebtTag t={t} at={T.wearing + 0.15} anchor={SHOE} dx={-30} dy={110} amount="−$220" />
        <DebtTag t={t} at={T.debt2} anchor={JACKET} dx={-40} dy={150} big amount={`−$${CART_TOTAL}`} />
      </AbsoluteFill>

      {/* comedic beat on "That's crazy!" */}
      {t >= T.thats && (
        <div
          style={{
            position: 'absolute', left: 70, top: 190, fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 210, color: C.white,
            letterSpacing: '-0.04em', transform: `rotate(-5deg) scale(${mix(1.6, 1, p(t, T.thats, T.thats + 0.18, OUT))})`, transformOrigin: 'left center',
            opacity: p(t, T.thats, T.thats + 0.08), textShadow: '0 10px 40px rgba(0,0,0,0.7)',
          }}
        >
          🤯
        </div>
      )}
    </AbsoluteFill>
  );
};
