import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {BACK, C, FONT_BODY, FONT_HEAD, IN, IN_OUT, OUT, cut, mix, money, p} from '../lib';
import {T} from '../timing';
import {useT} from '../ui';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const PAY = 850; // hypothetical: midpoint of $700–$1,000
const stampAt = (i: number) => 5.72 + i * 0.29;
const FLIP = T.when + 0.05; // "when that money could…" → payments become savings

// 0:05.3–0:10.7 — twelve monthly payments stamped onto a calendar, then flipped into savings.
export const S3Calendar: React.FC = () => {
  const t = useT();
  const enter = p(t, 5.3, 5.6, OUT);
  const exit = p(t, 10.75, 10.9, IN);
  const paid = MONTHS.reduce((s, _, i) => s + PAY * p(t, stampAt(i), stampAt(i) + 0.15), 0);
  const green = p(t, FLIP, FLIP + 0.5, IN_OUT);
  const accent = green > 0.5 ? C.green : C.red;
  const rangeHot = p(t, T.seven, T.seven + 0.2) * (1 - p(t, 7.9, 8.2));

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 90% 60% at 50% 40%, ${green > 0.5 ? '#0f2418' : '#1a1111'}, ${C.bg} 75%)`,
        transform: `translateY(${(1 - enter) * 120}px)`, opacity: enter * (1 - exit),
      }}
    >
      {/* header: the payment being described */}
      <div style={{position: 'absolute', left: 70, right: 70, top: 214, display: 'flex', alignItems: 'center', gap: 26}}>
        <Img src={cut('car_highway')} style={{width: 230, filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.6))', opacity: 1 - green * 0.6}} />
        <div>
          <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 26, letterSpacing: '0.2em', color: C.gray}}>
            {green > 0.5 ? 'IF YOU KEPT IT INSTEAD' : 'CAR PAYMENT · EVERY MONTH'}
          </div>
          <div
            style={{
              fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 84, letterSpacing: '-0.04em', color: green > 0.5 ? C.green : C.white,
              transform: `scale(${1 + rangeHot * 0.06})`, transformOrigin: 'left center', whiteSpace: 'nowrap',
              textShadow: rangeHot > 0 ? `0 0 ${30 * rangeHot}px rgba(255,87,87,0.6)` : undefined,
            }}
          >
            $700–$1,000
          </div>
        </div>
      </div>

      {/* calendar grid */}
      <div style={{position: 'absolute', left: 70, top: 470, width: 940, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16}}>
        {MONTHS.map((m, i) => {
          const k = p(t, stampAt(i), stampAt(i) + 0.22, BACK);
          const on = t >= stampAt(i);
          const flip = p(t, FLIP + i * 0.03, FLIP + 0.3 + i * 0.03, IN_OUT);
          const c = flip > 0.5 ? C.green : C.red;
          return (
            <div
              key={m}
              style={{
                height: 150, borderRadius: 20, background: on ? (flip > 0.5 ? 'rgba(54,224,121,0.10)' : 'rgba(255,87,87,0.10)') : 'rgba(245,247,245,0.04)',
                border: `1.5px solid ${on ? c + '88' : C.line}`, position: 'relative', overflow: 'hidden',
                transform: `scaleX(${Math.abs(Math.cos(flip * Math.PI))})`,
              }}
            >
              <div style={{position: 'absolute', left: 18, top: 14, fontFamily: FONT_BODY, fontWeight: 800, fontSize: 24, letterSpacing: '0.14em', color: C.gray}}>{m}</div>
              {on && (
                <div
                  style={{
                    position: 'absolute', left: 0, right: 0, bottom: 22, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 46,
                    letterSpacing: '-0.02em', color: c, transform: `scale(${mix(1.8, 1, k)}) rotate(${flip > 0.5 ? 0 : -4}deg)`, opacity: Math.min(1, k * 2),
                  }}
                >
                  {flip > 0.5 ? '+' : '−'}${PAY}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* running total */}
      <div style={{position: 'absolute', left: 70, right: 70, top: 990, textAlign: 'center'}}>
        <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 28, letterSpacing: '0.2em', color: C.gray}}>
          {green > 0.5 ? 'COULD GO TO YOUR GOALS' : 'PAID FOR THE CAR THIS YEAR'}
        </div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 150, letterSpacing: '-0.05em', color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginTop: 6}}>
          {money(paid)}
        </div>
        <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 24, color: C.gray, marginTop: 10}}>
          Hypothetical: $850/mo (middle of $700–$1,000) × 12 months
        </div>
      </div>
    </AbsoluteFill>
  );
};

