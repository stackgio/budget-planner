import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {C, FONT_BODY, FONT_HEAD, IN, IN_OUT, OUT, cut, mix, p, shake} from '../lib';
import {T} from '../timing';
import {Photo, PriceTag, useT} from '../ui';
import {ITEMS, stackPos} from './S5Cart';

const FIG = {x: 160, y: 340, w: 762, h: 960};
const at = (nx: number, ny: number) => ({x: FIG.x + nx * FIG.w, y: FIG.y + ny * FIG.h});
// Where each purchase "lives" on the outfit, and where its tag hangs.
const ANCHORS = [at(0.72, 0.24), at(0.93, 0.42), at(0.48, 0.4), at(0.12, 0.58), at(0.72, 0.94)];
const TAGS = [
  {x: 420, y: 520, rot: -6},
  {x: 935, y: 640, rot: 5},
  {x: 360, y: 690, rot: 4},
  {x: 215, y: 1060, rot: -5},
  {x: 935, y: 1170, rot: 6},
];
const FACE = at(0.77, 0.09);

// 0:19.5–0:23.2 — the purchases become debt labels attached to the outfit.
export const S5Wear: React.FC = () => {
  const t = useT();
  const inK = p(t, 19.5, 20.0, OUT);
  const exit = p(t, 22.92, 23.2, IN);
  const zoom = mix(1, 1.55, p(t, T.thats, T.thats + 0.16, OUT));
  const sk = shake(t, T.thats + 0.05, 16, 0.35);
  const sk2 = shake(t, T.debt2, 12, 0.25);
  const flash = t > T.thats ? Math.max(0, Math.sin((t - T.thats) * Math.PI * 4)) * (1 - p(t, T.thats, T.s5End)) : 0;
  const redGlow = p(t, T.wearing, T.debt2 + 0.3, IN_OUT);
  const label = p(t, T.debt2, T.debt2 + 0.14, OUT);

  return (
    <AbsoluteFill
      style={{
        background: C.bg, opacity: p(t, 19.45, 19.6),
        transform: `translateX(${-exit * 1100}px)`, filter: exit > 0 ? `blur(${exit * 10}px)` : undefined,
      }}
    >
      <Photo src="stage_floor.jpg" zoom={1.1} pos="50% 75%" />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 45% at 50% 55%, rgba(255,87,87,${0.06 + redGlow * 0.16}), rgba(0,0,0,0) 70%)`}} />

      <AbsoluteFill style={{transform: `translate(${sk.x + sk2.x}px, ${sk.y + sk2.y}px) scale(${zoom})`, transformOrigin: `${FACE.x}px ${FACE.y}px`}}>
        <Img
          src={cut('man_fullbody')}
          style={{
            position: 'absolute', left: FIG.x, top: FIG.y + (1 - inK) * 260, width: FIG.w, opacity: inK,
            filter: 'drop-shadow(0 34px 40px rgba(0,0,0,0.65))',
          }}
        />
        {/* strings */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {ITEMS.map((_, i) => {
            const k = p(t, 19.62 + i * 0.07, 20.25 + i * 0.07, OUT);
            const debt = p(t, T.wearing + i * 0.07, T.wearing + 0.3 + i * 0.07, IN_OUT);
            const a = ANCHORS[i];
            const g = TAGS[i];
            return (
              <g key={i} opacity={p(k, 0.85, 1)}>
                <line x1={a.x} y1={a.y} x2={g.x} y2={g.y} stroke={debt > 0.5 ? C.red : 'rgba(245,247,245,0.75)'} strokeWidth={3} />
                <circle cx={a.x} cy={a.y} r={7} fill={debt > 0.5 ? C.red : C.white} />
              </g>
            );
          })}
        </svg>
        {ITEMS.map((it, i) => {
          const k = p(t, 19.62 + i * 0.07, 20.25 + i * 0.07, OUT);
          const debt = p(t, T.wearing + i * 0.07, T.wearing + 0.3 + i * 0.07, IN_OUT);
          const s = stackPos(i);
          const g = TAGS[i];
          return (
            <div
              key={i}
              style={{
                position: 'absolute', left: mix(s.x, g.x, k), top: mix(s.y, g.y, k), width: 0, height: 0,
                transform: `rotate(${mix(s.rot, g.rot, k)}deg)`,
              }}
            >
              <PriceTag price={`$${it.price}`} label="PRICE" debt={debt} style={{left: -105, top: -56}} />
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Red flash on "That's crazy!" */}
      <AbsoluteFill style={{boxShadow: `inset 0 0 260px 60px rgba(255,87,87,${flash * 0.55})`, background: `rgba(255,87,87,${flash * 0.08})`}} />

      {/* WEARING DEBT label */}
      {t >= T.debt2 && (
        <div
          style={{
            position: 'absolute', left: 0, right: 0, top: 196, display: 'flex', justifyContent: 'center',
            transform: `rotate(-3deg) scale(${mix(1.8, 1, label)})`, opacity: label,
          }}
        >
          <div
            style={{
              background: C.red, color: '#fff', fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 104, letterSpacing: '-0.03em',
              padding: '10px 34px 6px', borderRadius: 18, boxShadow: '0 20px 50px rgba(255,87,87,0.45)',
            }}
          >
            WEARING DEBT
          </div>
        </div>
      )}

      {/* Comedic warning badge */}
      {t >= T.thats + 0.08 && (
        <div
          style={{
            position: 'absolute', left: 60, top: 336, padding: '14px 26px', borderRadius: 16, background: 'rgba(11,13,12,0.85)',
            border: `2px solid ${C.red}`, color: C.red, fontFamily: FONT_BODY, fontWeight: 900, fontSize: 40, letterSpacing: '0.08em',
            transform: `rotate(-4deg) scale(${mix(0.6, 1, p(t, T.thats + 0.08, T.thats + 0.25, OUT))})`,
            opacity: 0.75 + 0.25 * Math.sin((t - T.thats) * 30),
          }}
        >
          ⚠ OVER BUDGET
        </div>
      )}
    </AbsoluteFill>
  );
};
