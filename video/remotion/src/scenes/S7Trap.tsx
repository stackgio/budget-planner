import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, C, FONT_BODY, FONT_HEAD, IN, IN_OUT, OUT, mix, money, p} from '../lib';
import {T} from '../timing';
import {RevealLine, useT} from '../ui';
import {Heart} from '../social';
import {POSES, Stickman} from '../stick';

const BILLS = [
  {label: 'CAR LOAN', amt: 940, at: 26.4},
  {label: 'PAY LATER', amt: 273, at: 26.9},
  {label: 'CREDIT CARD', amt: 610, at: 27.4},
  {label: 'RENT', amt: 1050, at: 27.9},
];
const START = 2430; // illustrative checking balance

const Panel: React.FC<{x: number; label: string; color: string; children: React.ReactNode}> = ({x, label, color, children}) => (
  <div style={{position: 'absolute', left: x, top: 470, width: 490, height: 780, borderRadius: 30, background: 'rgba(245,247,245,0.035)', border: `1.5px solid ${C.line}`, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 26, top: 22, fontFamily: FONT_BODY, fontWeight: 900, fontSize: 26, letterSpacing: '0.2em', color}}>{label}</div>
    {children}
  </div>
);

// 0:26.0–0:31.0 — public image vs. private reality; then the audience doesn't care.
export const S7Trap: React.FC = () => {
  const t = useT();
  const enter = p(t, 25.95, 26.25, OUT);
  const toCrowd = p(t, 28.7, 29.0, IN_OUT);
  const exit = p(t, 30.8, 31.0, IN);
  const bal = BILLS.reduce((b, d) => b - d.amt * p(t, d.at, d.at + 0.3, OUT), START);
  const likes = Math.round(mix(1284, 2431, p(t, 26.1, T.approval + 0.3, OUT)));
  const pulse = 1 + 0.12 * Math.sin(p(t, T.approval, T.approval + 0.35) * Math.PI);
  const careless = p(t, T.dont - 0.1, T.dont + 0.3, IN_OUT);

  return (
    <AbsoluteFill style={{background: C.bg, opacity: enter * (1 - exit)}}>
      <div style={{position: 'absolute', left: 64, top: 206}}>
        <RevealLine t={t} at={26.02} size={100}>LOOKING RICH</RevealLine>
        <RevealLine t={t} at={T.look - 0.05} size={100} color={C.green}>≠ BEING RICH</RevealLine>
      </div>

      {/* split: public vs private */}
      <AbsoluteFill style={{opacity: 1 - toCrowd, transform: `translateY(${toCrowd * -60}px)`}}>
        <Panel x={40} label="IN PUBLIC" color={C.green}>
          <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 55%, rgba(54,224,121,0.14), rgba(0,0,0,0) 65%)'}} />
          <Stickman x={245} y={560} scale={0.82} pose={POSES.flex} face="grin" glasses={1} bags={1} />
          <div
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', justifyContent: 'center',
              transform: `scale(${pulse})`,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderRadius: 999, background: 'rgba(11,13,12,0.85)', fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 44, color: C.white}}>
              <Heart size={48} fill={C.red} stroke={C.red} /> {likes.toLocaleString('en-US')}
            </div>
          </div>
        </Panel>
        <Panel x={550} label="IN PRIVATE" color={C.red}>
          <div style={{position: 'absolute', left: 26, top: 70, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 24, color: C.gray}}>Checking (illustrative)</div>
          <div style={{position: 'absolute', left: 24, top: 100, fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 104, letterSpacing: '-0.045em', color: bal < 0 ? C.red : C.white, fontVariantNumeric: 'tabular-nums'}}>
            {money(bal)}
          </div>
          {/* bills piling up */}
          {BILLS.map((b, i) => {
            const k = p(t, b.at, b.at + 0.3, BACK);
            if (t < b.at) return null;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute', left: 30 + (i % 2) * 14, top: mix(120, 260 + i * 70, k), width: 300, padding: '12px 18px', borderRadius: 10,
                  background: '#F1EEE6', color: '#141614', transform: `rotate(${[-4, 3, -2, 4][i]}deg)`, opacity: Math.min(1, k * 2),
                  boxShadow: '0 10px 20px rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontFamily: FONT_BODY, fontWeight: 900, fontSize: 28,
                }}
              >
                <span>{b.label}</span>
                <span style={{color: C.red, fontSize: 22, letterSpacing: '0.1em'}}>DUE</span>
              </div>
            );
          })}
          <Stickman x={250} y={650} scale={0.62} pose={POSES.slump} face="frown" sweat={p(t, 27.4, 27.7)} />
        </Panel>
      </AbsoluteFill>

      {/* the audience: scrolling, not caring */}
      {toCrowd > 0 && (
        <AbsoluteFill style={{opacity: toCrowd}}>
          <div
            style={{
              position: 'absolute', left: 290, top: mix(560, 470, toCrowd) - p(t, 30.1, 30.6, IN) * 160, width: 500, padding: 22, borderRadius: 28,
              background: '#151917', border: `1.5px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 20, opacity: 1 - p(t, 30.25, 30.6),
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{width: 120, height: 120, borderRadius: 20, background: 'rgba(54,224,121,0.12)', position: 'relative', overflow: 'hidden'}}>
              <Stickman x={60} y={150} scale={0.32} pose={POSES.flex} face="grin" glasses={1} bags={1} />
            </div>
            <div style={{fontFamily: FONT_BODY, color: C.white}}>
              <div style={{fontWeight: 800, fontSize: 30}}>totally.rich</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 40, opacity: 1 - careless * 0.7}}>
                <Heart size={40} fill={careless > 0.5 ? 'none' : C.red} stroke={careless > 0.5 ? C.gray : C.red} />
                {careless > 0.5 ? <span style={{color: C.gray}}>seen · 0 new</span> : likes.toLocaleString('en-US')}
              </div>
            </div>
          </div>
          {[0, 1, 2, 3].map((i) => {
            const turned = i === 1 ? careless : 0;
            const yawn = i === 2 && t > T.dont + 0.1 && t < T.care + 0.4;
            return (
              <Stickman
                key={i} x={190 + i * 233} y={1090} scale={0.78} pose={POSES.phone} color={C.gray} phone="right"
                face={yawn ? 'open' : 'flat'} flip={turned > 0.5}
              />
            );
          })}
          <div style={{position: 'absolute', left: 0, right: 0, top: 680, textAlign: 'center', fontFamily: FONT_BODY, fontWeight: 800, fontSize: 34, letterSpacing: '0.12em', color: C.gray, opacity: p(t, T.probably, T.probably + 0.3)}}>
            *SCROLLS PAST*
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
