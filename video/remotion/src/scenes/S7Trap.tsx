import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_BODY, FONT_HEAD, IN, IN_OUT, OUT, mix, money, p} from '../lib';
import {T} from '../timing';
import {Glass, Photo, RevealLine, useT} from '../ui';
import {Heart, Post} from '../social';

const DEBITS = [
  {label: 'Auto loan', amt: 940, at: 26.4},
  {label: 'Pay-later haul', amt: 273, at: 26.9},
  {label: 'Credit card', amt: 610, at: 27.4},
  {label: 'Rent', amt: 1050, at: 27.9},
];
const START = 2430;

const balanceAt = (t: number) => DEBITS.reduce((b, d) => b - d.amt * p(t, d.at, d.at + 0.3, OUT), START);

const BalanceCard: React.FC<{t: number}> = ({t}) => {
  const bal = balanceAt(t);
  const neg = bal < 0;
  // sparkline of the balance over the scene
  const pts = Array.from({length: 40}, (_, i) => {
    const tt = mix(26.0, Math.max(26.01, Math.min(t, 28.4)), i / 39);
    return [20 + i * 10.5, 150 - ((balanceAt(tt) + 600) / (START + 600)) * 130];
  });
  return (
    <Glass style={{left: 550, top: 470, width: 490, height: 820, padding: 34, boxSizing: 'border-box'}}>
      <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 24, letterSpacing: '0.2em', color: C.gray}}>CHECKING · ILLUSTRATIVE</div>
      <div
        style={{
          fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 92, letterSpacing: '-0.04em', marginTop: 10,
          color: neg ? C.red : C.white, fontVariantNumeric: 'tabular-nums',
        }}
      >
        {money(bal)}
      </div>
      <svg width={430} height={170} style={{marginTop: 4}}>
        <polyline points={pts.map((q) => q.join(',')).join(' ')} fill="none" stroke={neg ? C.red : C.gray} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
        <line x1={20} x2={430} y1={150 - (600 / (START + 600)) * 130} y2={150 - (600 / (START + 600)) * 130} stroke="rgba(245,247,245,0.18)" strokeDasharray="6 8" strokeWidth={2} />
      </svg>
      <div style={{marginTop: 14}}>
        {DEBITS.map((d, i) => {
          const k = p(t, d.at, d.at + 0.3, OUT);
          return (
            <div
              key={i}
              style={{
                display: 'flex', justifyContent: 'space-between', padding: '18px 0', borderTop: `1.5px solid ${C.line}`,
                fontFamily: FONT_BODY, fontSize: 32, opacity: k, transform: `translateX(${(1 - k) * 40}px)`,
              }}
            >
              <span style={{color: C.white, fontWeight: 600}}>{d.label}</span>
              <span style={{color: C.red, fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>−${d.amt.toLocaleString('en-US')}</span>
            </div>
          );
        })}
      </div>
      {t >= 28.05 && (
        <div
          style={{
            position: 'absolute', left: 34, bottom: 34, padding: '10px 18px', borderRadius: 12, background: C.red, color: '#fff',
            fontFamily: FONT_BODY, fontWeight: 900, fontSize: 28, letterSpacing: '0.14em', transform: `scale(${mix(1.4, 1, p(t, 28.05, 28.2, OUT))})`,
          }}
        >
          OVERDRAWN
        </div>
      )}
    </Glass>
  );
};

// 0:26.0–0:31.0 — split screen: the post vs. the balance; then nobody cares.
export const S7Trap: React.FC = () => {
  const t = useT();
  const enter = p(t, 25.95, 26.3, OUT);
  const toCrowd = p(t, 28.75, 29.1, IN_OUT);
  const likes = Math.round(mix(1284, 2431, p(t, 26.1, T.approval + 0.3, OUT)));
  const fadeIcons = 1 - p(t, T.people2, T.people2 + 0.6, IN_OUT);
  const approvalPulse = 1 + 0.06 * Math.sin(p(t, T.approval, T.approval + 0.35) * Math.PI);
  const exit = p(t, 30.8, 31.0, IN);

  // feed scroll in the crowd shot: the post flicks past twice
  const scroll1 = p(t, 29.15, 29.6, IN_OUT);
  const scroll2 = p(t, 29.75, 30.2, IN_OUT);

  return (
    <AbsoluteFill style={{background: C.bg, opacity: enter * (1 - exit)}}>
      {/* split layout */}
      <AbsoluteFill style={{opacity: 1 - toCrowd, transform: `translateX(${-toCrowd * 300}px)`}}>
        <Photo src="man_bags_car.jpg" blur={22} dark={0.78} />
        <div style={{position: 'absolute', left: 64, top: 214}}>
          <RevealLine t={t} at={26.05} size={96}>LOOKING RICH</RevealLine>
          <RevealLine t={t} at={T.look} size={96} color={C.green}>≠ BEING RICH</RevealLine>
        </div>
        <div style={{position: 'absolute', left: 40, top: 470, transform: `translateY(${(1 - enter) * 80}px) scale(${approvalPulse})`, transformOrigin: '50% 60%'}}>
          <Post photo="man_bags_car.jpg" pos="50% 35%" width={490} imgH={560} likes={`${likes.toLocaleString('en-US')} likes`} liked caption="just a regular tuesday 💅" />
        </div>
        <BalanceCard t={t} />
      </AbsoluteFill>

      {/* the people he's trying to impress */}
      {toCrowd > 0 && (
        <AbsoluteFill style={{opacity: toCrowd, transform: `translateX(${(1 - toCrowd) * 300}px)`}}>
          <Photo src="people_phones.jpg" zoom={mix(1.05, 1.12, p(t, 28.8, 31, IN_OUT))} dark={0.4} pos="40% 50%" />
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,13,12,0.75), rgba(11,13,12,0.1) 35%, rgba(11,13,12,0.1) 60%, rgba(11,13,12,0.85))'}} />
          {[scroll1, scroll2].map((s, i) =>
            s > 0 && s < 1 ? (
              <div key={i} style={{position: 'absolute', left: 290, top: mix(1500, -900, s), filter: `blur(${Math.sin(s * Math.PI) * 6}px)`}}>
                <Post photo="man_bags_car.jpg" pos="50% 35%" width={500} imgH={560} likes="" iconOpacity={fadeIcons} />
              </div>
            ) : null,
          )}
          <div
            style={{
              position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', opacity: p(t, 30.15, 30.35),
            }}
          >
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '18px 30px', borderRadius: 999, background: 'rgba(11,13,12,0.82)',
                border: `1.5px solid ${C.line}`, fontFamily: FONT_BODY, fontWeight: 800, fontSize: 38, color: C.gray,
              }}
            >
              <Heart size={44} stroke={C.gray} /> 0 new likes · scrolled past
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
