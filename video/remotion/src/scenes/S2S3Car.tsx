import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {C, FONT_BODY, FONT_HEAD, IN, IN_OUT, OUT, cut, img, mix, money, p} from '../lib';
import {T} from '../timing';
import {Kicker, Photo, RevealLine, useT} from '../ui';

const CAR_W = 1000;
const CAR_H = (CAR_W * 366) / 1115;
const CAR_Y = 700;

/** Car x-position over time: enters from the right, parks, later leaves to the left. */
const carX = (t: number) => {
  const enter = p(t, 2.3, 3.0, OUT);
  const leave = p(t, 9.85, 10.4, IN);
  return mix(1100, 40, enter) + leave * -1350;
};

const Car: React.FC<{t: number}> = ({t}) => {
  const x = carX(t);
  const v = (carX(t) - carX(t - 1 / 30)) * 30; // px/s
  const ghosts = Math.min(6, Math.floor(Math.abs(v) / 500));
  const reflect = (
    <Img
      src={cut('car_highway')}
      style={{
        position: 'absolute', left: 0, top: CAR_H - 6, width: CAR_W, transform: 'scaleY(-1)', opacity: 0.22,
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0) 45%)',
        filter: 'blur(2px)',
      }}
    />
  );
  return (
    <div style={{position: 'absolute', left: x, top: CAR_Y, width: CAR_W, height: CAR_H}}>
      {/* contact shadow */}
      <div
        style={{
          position: 'absolute', left: 40, right: 30, top: CAR_H - 38, height: 60, borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85), rgba(0,0,0,0) 70%)',
        }}
      />
      {reflect}
      {Array.from({length: ghosts}).map((_, i) => (
        <Img
          key={i}
          src={cut('car_highway')}
          style={{
            position: 'absolute', left: -Math.sign(v) * (i + 1) * Math.min(60, Math.abs(v) / 90), top: 0, width: CAR_W,
            opacity: 0.22 * (1 - i / ghosts), filter: 'blur(3px)',
          }}
        />
      ))}
      <Img src={cut('car_highway')} style={{position: 'absolute', left: 0, top: 0, width: CAR_W, filter: ghosts ? 'blur(1px)' : undefined}} />
    </div>
  );
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];

/** Monthly payments leaving the wallet and landing on the payment card. */
const Payments: React.FC<{t: number}> = ({t}) => {
  const wIn = p(t, 7.9, 8.2, OUT);
  const wOut = p(t, 9.45, 9.75, IN_OUT);
  return (
    <>
      <Img
        src={cut('wallet')}
        style={{
          position: 'absolute', left: 50, top: mix(1560, 1350, wIn) + wOut * 160, width: 470, opacity: wIn * (1 - wOut),
          filter: 'drop-shadow(0 20px 26px rgba(0,0,0,0.6))',
        }}
      />
      {MONTHS.map((m, i) => {
        const s = 8.12 + i * 0.19;
        const k = p(t, s, s + 0.55, IN_OUT);
        if (t < s || k >= 1) return null;
        const x = mix(230, 700, k);
        const y = mix(1400, 1170, k) - Math.sin(k * Math.PI) * 170;
        return (
          <div
            key={m}
            style={{
              position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${mix(0.8, 1, p(t, s, s + 0.15))})`,
              opacity: Math.min(1, k * 6) * (1 - p(k, 0.85, 1, OUT)),
              padding: '10px 18px', borderRadius: 14, background: C.red, color: '#fff', whiteSpace: 'nowrap',
              fontFamily: FONT_BODY, fontWeight: 800, fontSize: 30, boxShadow: '0 10px 22px rgba(0,0,0,0.45)',
            }}
          >
            {m} <span style={{fontFamily: FONT_HEAD, fontWeight: 900}}>−$850</span>
          </div>
        );
      })}
    </>
  );
};

/** Payment card: lives under the car, then morphs into a green header for the alternatives. */
const PaymentCard: React.FC<{t: number}> = ({t}) => {
  const inK = p(t, T.car1, T.car1 + 0.45, OUT);
  const morph = p(t, 9.95, 10.55, IN_OUT);
  const top = mix(1075, 228, morph) + (1 - inK) * 160;
  const h = mix(250, 132, morph);
  const pulse = 1 + 0.045 * Math.sin(p(t, T.seven, T.seven + 0.3, OUT) * Math.PI);
  const count = p(t, T.to, T.dollars, IN_OUT);
  const hi = Math.round(mix(700, 1000, count) / 10) * 10;
  const showHi = t >= T.to;
  const accent = morph > 0.5 ? C.green : C.red;
  const amountSize = mix(104, 60, morph);
  return (
    <div
      style={{
        position: 'absolute', left: 70, width: 940, top, height: h, opacity: inK, borderRadius: 30,
        background: C.panel, border: `1.5px solid ${C.line}`, overflow: 'hidden',
        boxShadow: `0 30px 60px rgba(0,0,0,0.55), 0 0 ${40 * count * (1 - morph)}px rgba(255,87,87,0.25)`,
      }}
    >
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: accent}} />
      <div style={{position: 'absolute', left: 44, top: mix(30, 18, morph), right: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: mix(28, 24, morph), letterSpacing: '0.2em', color: C.gray}}>
          {morph > 0.5 ? 'THAT SAME MONEY COULD GO TO' : 'CAR PAYMENT'}
        </div>
        <div
          style={{
            fontFamily: FONT_BODY, fontWeight: 800, fontSize: 22, letterSpacing: '0.16em', color: accent,
            border: `1.5px solid ${accent}66`, padding: '6px 14px', borderRadius: 999, opacity: 1 - morph,
          }}
        >
          EVERY MONTH
        </div>
      </div>
      <div
        style={{
          position: 'absolute', left: 44, top: mix(78, 50, morph), whiteSpace: 'nowrap', fontFamily: FONT_HEAD, fontWeight: 900,
          fontSize: amountSize, letterSpacing: '-0.035em', color: accent, fontVariantNumeric: 'tabular-nums',
          transform: `scale(${pulse})`, transformOrigin: 'left center',
        }}
      >
        $700
        {showHi && (
          <span style={{opacity: p(t, T.to, T.to + 0.12)}}>
            –{money(hi)}
          </span>
        )}
        <span style={{fontFamily: FONT_BODY, fontWeight: 700, fontSize: amountSize * 0.4, color: C.gray, letterSpacing: '0.02em'}}> / MONTH</span>
      </div>
    </div>
  );
};

const Panel: React.FC<{t: number; at: number; top: number; children: React.ReactNode; bg?: React.ReactNode}> = ({
  t, at, top, children, bg,
}) => {
  const k = p(t, at, at + 0.5, OUT);
  return (
    <div
      style={{
        position: 'absolute', left: 60, width: 960, top, height: 290, borderRadius: 30, overflow: 'hidden',
        clipPath: `inset(0 ${(1 - k) * 100}% 0 0 round 30px)`, border: `1.5px solid ${C.line}`,
        boxShadow: '0 24px 50px rgba(0,0,0,0.5)', background: '#111513',
      }}
    >
      <div style={{position: 'absolute', inset: 0, transform: `scale(${mix(1.18, 1.02, p(t, at, at + 2.2, OUT))})`}}>{bg}</div>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(11,13,12,0.92) 0%, rgba(11,13,12,0.7) 45%, rgba(11,13,12,0.05) 85%)'}} />
      <div style={{position: 'absolute', left: 48, top: 44, transform: `translateX(${(1 - k) * -40}px)`, opacity: k}}>{children}</div>
    </div>
  );
};

const PanelTitle: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 92, letterSpacing: '-0.035em', color: C.white, lineHeight: 1}}>{children}</div>
);
const PanelSub: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 28, color: C.gray, marginTop: 14}}>{children}</div>
);

const Alternatives: React.FC<{t: number}> = ({t}) => {
  const drift = p(t, 10.6, 13.5, IN_OUT) * -24;
  const saved = mix(0, 10200, p(t, T.saving + 0.2, T.saving + 1.6, IN_OUT));
  const goal = p(t, T.building + 0.25, T.building + 1.3, IN_OUT);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${drift}px)`}}>
      <Panel t={t} at={T.saving} top={400} bg={<Img src={img('jar.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '80% 60%'}} />}>
        <PanelTitle>SAVE</PanelTitle>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 64, color: C.green, marginTop: 16, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>
          {money(saved)}
        </div>
        <PanelSub>12 months × $850 set aside</PanelSub>
      </Panel>
      <Panel t={t} at={T.traveling} top={715} bg={<Img src={img('beach.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 62%'}} />}>
        <PanelTitle>TRAVEL</PanelTitle>
        <PanelSub>A real trip, paid in cash</PanelSub>
      </Panel>
      <Panel t={t} at={T.building} top={1030}>
        <PanelTitle>BUILD WEALTH</PanelTitle>
        <div style={{marginTop: 28, width: 820}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT_BODY, fontWeight: 800, fontSize: 24, letterSpacing: '0.14em', color: C.gray}}>
            <span>FIRST-HOME SAVINGS GOAL</span>
            <span style={{color: C.green, fontVariantNumeric: 'tabular-nums'}}>{Math.round(goal * 68)}%</span>
          </div>
          <div style={{marginTop: 12, height: 22, borderRadius: 11, background: 'rgba(245,247,245,0.1)', overflow: 'hidden'}}>
            <div style={{width: `${goal * 68}%`, height: '100%', borderRadius: 11, background: `linear-gradient(90deg, #1f9e55, ${C.green})`, boxShadow: `0 0 18px ${C.green}88`}} />
          </div>
          <div style={{fontFamily: FONT_BODY, fontWeight: 500, fontSize: 20, color: C.gray, marginTop: 12, opacity: 0.8}}>
            Illustrative · contributions only, no returns assumed
          </div>
        </div>
      </Panel>
    </div>
  );
};

// 0:02.3–0:13.7 — expensive car, payment card, payments leaving, three alternatives.
export const S2S3Car: React.FC = () => {
  const t = useT();
  const enter = p(t, 2.3, 2.62, OUT);
  const push = 1 + 0.05 * (p(t, T.imagine1, 9.3, IN_OUT) - p(t, 9.9, 10.55, IN_OUT));
  const stageOut = p(t, 9.9, 10.4, IN_OUT);
  const exit = p(t, 13.3, 13.75, IN);
  const headOut = 9.8;
  return (
    <AbsoluteFill style={{background: C.bg, transform: `translateX(${(1 - enter) * 1100}px) scale(${1 - exit * 0.06})`}}>
      <Photo src="stage_floor.jpg" zoom={mix(1.04, 1.12, p(t, 2.3, 13.7, IN_OUT))} pos="50% 70%" dark={stageOut * 0.35} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 55% 40% at 50% 8%, rgba(245,247,245,0.10), rgba(0,0,0,0) 70%)'}} />

      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '540px 1000px'}}>
        <div style={{position: 'absolute', left: 70, top: 228, opacity: 1 - p(t, headOut, headOut + 0.2)}}>
          <Kicker t={t} at={T.number1}>NUMBER ONE</Kicker>
        </div>
        <div style={{position: 'absolute', left: 64, top: 320}}>
          <RevealLine t={t} at={T.an} size={150} out={headOut}>EXPENSIVE</RevealLine>
          <RevealLine t={t} at={T.expensive + 0.18} size={150} out={headOut + 0.04}>CAR<span style={{color: C.red}}>.</span></RevealLine>
        </div>
        {t < 10.6 && <Car t={t} />}
        <PaymentCard t={t} />
        <Payments t={t} />
      </AbsoluteFill>

      {t >= T.saving - 0.05 && <Alternatives t={t} />}
      {/* fade to darker during bag transition */}
      <AbsoluteFill style={{background: `rgba(11,13,12,${exit * 0.6})`}} />
    </AbsoluteFill>
  );
};

