import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {BACK, C, FONT_BODY, FONT_HEAD, IN, OUT, cut, mix, p} from '../lib';
import {T} from '../timing';
import {Kicker, Photo, RevealLine, useT} from '../ui';

const CAR_W = 1000;
const CAR_H = (CAR_W * 366) / 1115;

// 0:02.3–0:05.5 — the car and its monthly price, shown together immediately.
export const S2Car: React.FC = () => {
  const t = useT();
  const enter = p(t, 2.3, 2.62, OUT);
  const exit = p(t, 5.3, 5.55, IN);
  const carX = mix(420, 40, enter);
  const cardK = p(t, 2.55, 2.95, BACK);
  const pulse = 1 + 0.04 * Math.sin(p(t, T.car1, T.car1 + 0.3) * Math.PI);
  return (
    <AbsoluteFill style={{background: C.bg, transform: `translateX(${(1 - enter) * 1100 - exit * 1100}px)`}}>
      <Photo src="stage_floor.jpg" zoom={mix(1.04, 1.1, p(t, 2.3, 5.5))} pos="50% 70%" />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 55% 40% at 50% 8%, rgba(245,247,245,0.10), rgba(0,0,0,0) 70%)'}} />
      <div style={{position: 'absolute', left: 70, top: 226}}>
        <Kicker t={t} at={2.45}>NUMBER ONE</Kicker>
      </div>
      <div style={{position: 'absolute', left: 64, top: 316}}>
        <RevealLine t={t} at={2.5} size={150}>EXPENSIVE</RevealLine>
        <RevealLine t={t} at={2.62} size={150}>CAR<span style={{color: C.red}}>.</span></RevealLine>
      </div>

      {/* car */}
      <div style={{position: 'absolute', left: carX, top: 650, width: CAR_W, height: CAR_H}}>
        <div style={{position: 'absolute', left: 40, right: 30, top: CAR_H - 38, height: 60, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85), rgba(0,0,0,0) 70%)'}} />
        <Img
          src={cut('car_highway')}
          style={{position: 'absolute', left: 0, top: CAR_H - 6, width: CAR_W, transform: 'scaleY(-1)', opacity: 0.2, WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0) 45%)', filter: 'blur(2px)'}}
        />
        <Img src={cut('car_highway')} style={{position: 'absolute', left: 0, top: 0, width: CAR_W, filter: enter < 1 ? `blur(${(1 - enter) * 4}px)` : undefined}} />
      </div>

      {/* monthly price, visible right away */}
      <div
        style={{
          position: 'absolute', left: 70, width: 940, top: 1010, height: 230, borderRadius: 30, overflow: 'hidden',
          background: C.panel, border: `1.5px solid ${C.line}`, boxShadow: '0 30px 60px rgba(0,0,0,0.55), 0 0 40px rgba(255,87,87,0.18)',
          opacity: Math.min(1, cardK * 2), transform: `translateY(${(1 - cardK) * 80}px)`,
        }}
      >
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: C.red}} />
        <div style={{position: 'absolute', left: 44, top: 28, right: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <span style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 28, letterSpacing: '0.2em', color: C.gray}}>CAR PAYMENT</span>
          <span style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 22, letterSpacing: '0.16em', color: C.red, border: `1.5px solid ${C.red}66`, padding: '6px 14px', borderRadius: 999}}>
            EVERY MONTH
          </span>
        </div>
        <div
          style={{
            position: 'absolute', left: 44, top: 74, whiteSpace: 'nowrap', fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 110,
            letterSpacing: '-0.04em', color: C.red, transform: `scale(${pulse})`, transformOrigin: 'left center',
          }}
        >
          $700–$1,000
          <span style={{fontFamily: FONT_BODY, fontWeight: 700, fontSize: 44, color: C.gray, letterSpacing: '0.02em'}}>/MONTH</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
