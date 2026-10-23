import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, C, FONT_BODY, FONT_HEAD, IN_OUT, OUT, p, rand} from '../lib';
import {T} from '../timing';
import {Kicker, Photo, RevealLine, useT} from '../ui';
import {Heart} from '../social';
import {POSES, Stickman, lerpPose} from '../stick';

const HIP = {x: 330, y: 1020};
const S = 1.12;

// 0:22.9–0:26.2 — the flexer buys on credit, suits up, and poses for approval.
export const S6Impress: React.FC = () => {
  const t = useT();
  const enter = p(t, 22.92, 23.2, OUT);
  const exit = p(t, 25.95, 26.25, IN_OUT);
  const approved = t >= 23.55;
  const toBags = p(t, 23.95, 24.3, IN_OUT);
  const toPose = p(t, T.impressing - 0.1, T.impressing + 0.15, BACK);
  const pose = toPose > 0 ? lerpPose(POSES.bags, POSES.flex, toPose) : lerpPose(POSES.tap, POSES.bags, toBags);
  const glasses = p(t, 24.3, 24.6, OUT);
  const flash = t >= T.impressing ? 1 - p(t, T.impressing, T.impressing + 0.4) : 0;
  const fans = p(t, T.people1 - 0.1, T.people1 + 0.25, BACK);

  return (
    <AbsoluteFill style={{background: C.bg, opacity: 1 - exit, transform: `translateX(${(1 - enter) * 1100}px)`}}>
      <Photo src="stage_floor.jpg" zoom={1.08} pos="50% 72%" dark={0.25} />
      <div style={{position: 'absolute', left: 70, top: 226}}>
        <Kicker t={t} at={T.number3 - 0.1}>NUMBER THREE</Kicker>
      </div>
      <div style={{position: 'absolute', left: 64, top: 316}}>
        <RevealLine t={t} at={T.impressing - 0.08} size={124}>IMPRESSING</RevealLine>
        <RevealLine t={t} at={T.impressing + 0.12} size={124} color={C.green}>PEOPLE</RevealLine>
      </div>

      {/* card terminal: the purchase goes on credit */}
      <div
        style={{
          position: 'absolute', left: 560, top: 860, width: 190, height: 240, borderRadius: 24, background: '#1b201d', border: `3px solid ${C.line}`,
          opacity: 1 - toBags, transform: `translateY(${toBags * 40}px)`, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            margin: 16, height: 110, borderRadius: 12, background: approved ? 'rgba(54,224,121,0.18)' : '#0d100f', border: `2px solid ${approved ? C.green : C.line}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY, color: approved ? C.green : C.gray,
          }}
        >
          <div style={{fontWeight: 900, fontSize: 22, letterSpacing: '0.12em'}}>{approved ? 'APPROVED ✓' : 'TAP CARD'}</div>
          {approved && <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 40, color: C.white}}>$2,480</div>}
        </div>
        <div style={{textAlign: 'center', fontFamily: FONT_BODY, fontWeight: 800, fontSize: 20, letterSpacing: '0.16em', color: C.red}}>ON CREDIT</div>
      </div>

      {/* camera frame + flash when he poses */}
      {t >= T.impressing - 0.05 && (
        <div
          style={{
            position: 'absolute', left: HIP.x - 250, top: 640, width: 500, height: 640, borderRadius: 30, border: '4px solid rgba(245,247,245,0.85)',
            opacity: p(t, T.impressing - 0.05, T.impressing + 0.1) * (1 - p(t, 25.2, 25.5)),
          }}
        >
          <div style={{position: 'absolute', left: 18, top: 14, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY, fontWeight: 800, fontSize: 24, color: C.white}}>
            <span style={{width: 14, height: 14, borderRadius: 7, background: C.red}} /> POSTING…
          </div>
        </div>
      )}
      <AbsoluteFill style={{background: `radial-gradient(circle at ${HIP.x}px 820px, rgba(255,255,255,${flash * 0.85}), rgba(255,255,255,0) ${200 + flash * 500}px)`}} />

      <Stickman
        x={HIP.x} y={HIP.y} scale={S} pose={pose} face={toPose > 0.5 ? 'grin' : 'smile'} glasses={glasses}
        bags={toBags} card={toBags < 0.5 ? 'right' : undefined}
      />

      {/* the people he's impressing */}
      {[0, 1].map((i) => (
        <div key={i} style={{opacity: Math.min(1, fans * 2), transform: `translateY(${(1 - fans) * 60}px)`}}>
          <Stickman x={720 + i * 190} y={1060} scale={0.82} pose={POSES.phone} color={C.gray} face="smile" phone="right" />
          {Array.from({length: 3}).map((_, j) => {
            const s = T.people1 + 0.05 + j * 0.15 + i * 0.07;
            const k = p(t, s, s + 0.8, OUT);
            if (t < s || k >= 1) return null;
            return (
              <div key={j} style={{position: 'absolute', left: 700 + i * 190 + rand(i * 3 + j) * 40, top: 780 - k * 200, opacity: 1 - k}}>
                <Heart size={54} fill={C.red} stroke={C.red} />
              </div>
            );
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

