import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {BACK, C, FONT_BODY, FONT_HEAD, IN, IN_OUT, OUT, cut, mix, money, p, shake} from '../lib';
import {T} from '../timing';
import {Photo, useT} from '../ui';
import {Heart} from '../social';

// Purchases that get swiped onto the card: [label, amount, swipe start]
const BUYS = [
  {n: 1, label: 'CAR', amt: 48900, at: 0.08},
  {n: 2, label: 'CLOTHES', amt: 1240, at: 0.5},
  {n: 3, label: 'IMPRESSING PEOPLE', amt: 1580, at: 0.92},
];
const SWIPE = 0.36;

const CARD = {cx: 540, cy: 900, w: 620, h: 384};

/** Generic (unbranded) credit card with live balance. */
const CreditCard: React.FC<{t: number; balance: number; debt: number}> = ({t, balance, debt}) => {
  const hit = BUYS.reduce((m, b) => Math.max(m, 1 - p(t, b.at + SWIPE - 0.02, b.at + SWIPE + 0.25, OUT)) * (t >= b.at + SWIPE - 0.02 ? 1 : 0), 0);
  return (
    <div
      style={{
        position: 'absolute', left: CARD.cx - CARD.w / 2, top: CARD.cy - CARD.h / 2, width: CARD.w, height: CARD.h, borderRadius: 34,
        background: 'linear-gradient(135deg, #26302b 0%, #121614 55%, #0a0c0b 100%)', border: `2px solid ${debt > 0 ? C.red : 'rgba(245,247,245,0.18)'}`,
        boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 ${30 + hit * 60}px rgba(255,87,87,${0.15 + hit * 0.35 + debt * 0.3})`,
        transform: `rotate(-6deg) scale(${1 + hit * 0.03})`, overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0) 60%)'}} />
      <div style={{position: 'absolute', left: 44, top: 40, fontFamily: FONT_BODY, fontWeight: 800, fontSize: 26, letterSpacing: '0.24em', color: C.gray}}>CREDIT</div>
      <div style={{position: 'absolute', left: 44, top: 92, width: 78, height: 58, borderRadius: 10, background: 'linear-gradient(135deg,#e6c66e,#a9842f)'}} />
      <div style={{position: 'absolute', right: 40, top: 36, textAlign: 'right', fontFamily: FONT_BODY}}>
        <div style={{fontWeight: 800, fontSize: 22, letterSpacing: '0.2em', color: C.gray}}>BALANCE OWED</div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 76, letterSpacing: '-0.03em', color: C.red, fontVariantNumeric: 'tabular-nums', marginTop: 2}}>
          {money(balance)}
        </div>
      </div>
      <div style={{position: 'absolute', left: 44, bottom: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 34, letterSpacing: '0.12em', color: '#cfd5d1'}}>
        •••• •••• •••• 4291
      </div>
    </div>
  );
};

/** A purchase flying into the card. */
const Purchase: React.FC<{t: number; at: number; from: {x: number; y: number}; children: React.ReactNode}> = ({t, at, from, children}) => {
  const k = p(t, at, at + SWIPE, IN_OUT);
  if (t < at || k >= 1) return null;
  const x = mix(from.x, CARD.cx, k);
  const y = mix(from.y, CARD.cy, k);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${mix(1, 0.25, k * k)})`, opacity: 1 - p(k, 0.8, 1)}}>
      {children}
    </div>
  );
};

// 0:00–0:02.5 — "I REFUSE TO LOOK RICH ON CREDIT." Purchases swipe onto a card; the balance climbs.
export const S1Hook: React.FC = () => {
  const t = useT();
  const exit = p(t, 2.3, 2.5, IN);
  const bal = BUYS.reduce((s, b) => s + b.amt * p(t, b.at + SWIPE - 0.04, b.at + SWIPE + 0.3, OUT), 0);
  const debt = p(t, T.debt1, T.debt1 + 0.1);
  const sk = shake(t, T.debt1, 14, 0.3);
  const head = p(t, 0, 0.25, OUT);

  return (
    <AbsoluteFill style={{background: C.bg, transform: `translateX(${-exit * 1100}px)`}}>
      <Photo src="stage_floor.jpg" zoom={1.08} pos="50% 70%" dark={0.2} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 26% at 50% 47%, rgba(255,87,87,${0.08 + debt * 0.12}), rgba(0,0,0,0) 70%)`}} />

      {/* Headline — on screen from frame 0 */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 196, transform: `scale(${mix(1.04, 1, head)})`, transformOrigin: '0% 0%'}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 84, letterSpacing: '-0.03em', color: C.white, lineHeight: 1}}>I REFUSE TO</div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 176, letterSpacing: '-0.05em', color: C.white, lineHeight: 0.92, marginTop: 8}}>LOOK RICH</div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 176, letterSpacing: '-0.05em', color: C.red, lineHeight: 0.92}}>
          ON CREDIT<span style={{color: C.white}}>.</span>
        </div>
      </div>

      <AbsoluteFill style={{transform: `translate(${sk.x}px, ${sk.y}px)`}}>
        <CreditCard t={t} balance={bal} debt={debt} />
      </AbsoluteFill>

      <Purchase t={t} at={BUYS[0].at} from={{x: -260, y: 780}}>
        <Img src={cut('car_highway')} style={{width: 640, filter: 'drop-shadow(0 20px 26px rgba(0,0,0,0.6))'}} />
      </Purchase>
      <Purchase t={t} at={BUYS[1].at} from={{x: 1300, y: 760}}>
        <Img src={cut('sneakers_hightop')} style={{width: 460, filter: 'drop-shadow(0 20px 26px rgba(0,0,0,0.6))'}} />
      </Purchase>
      <Purchase t={t} at={BUYS[2].at} from={{x: 760, y: -200}}>
        <div
          style={{
            width: 230, height: 400, borderRadius: 40, background: '#121413', border: '6px solid #2b302d', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          <Heart size={110} fill={C.red} stroke={C.red} />
          <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 52, color: C.white}}>2.4k</div>
        </div>
      </Purchase>

      {/* The three things, introduced as they hit the card */}
      <div style={{position: 'absolute', left: 40, right: 40, top: 1128, display: 'flex', justifyContent: 'center', gap: 14}}>
        {BUYS.map((b) => {
          const k = p(t, b.at + SWIPE - 0.04, b.at + SWIPE + 0.3, BACK);
          return (
            <div
              key={b.n}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 12px 12px', borderRadius: 999,
                background: 'rgba(17,21,19,0.92)', border: `1.5px solid ${C.line}`, opacity: Math.min(1, k * 2),
                transform: `translateY(${(1 - k) * 30}px) scale(${mix(0.7, 1, k)})`,
                fontFamily: FONT_BODY, fontWeight: 800, fontSize: 28, letterSpacing: '0.06em', color: C.white, whiteSpace: 'nowrap',
              }}
            >
              <span style={{width: 40, height: 40, borderRadius: 20, background: C.green, color: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 24}}>
                {b.n}
              </span>
              {b.label}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

