import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, IN_OUT, OUT, mix, p} from '../lib';
import {T} from '../timing';
import {RevealLine, useT} from '../ui';
import {POSES, Stickman, lerpPose} from '../stick';

const HIP = {x: 540, y: 1060};

// 0:30.9–0:35.7 — "Nah." The payoff: debt to impress = already lost. He snaps the card.
export const S8Rule: React.FC = () => {
  const t = useT();
  const exit = p(t, 35.38, 35.7, IN_OUT);
  const nahK = p(t, T.nah, T.nah + 0.16, OUT);
  const nahOut = p(t, 31.55, 31.85, IN_OUT);
  const wave = Math.sin((t - T.nah) * 16) * 0.5 + 0.5;
  const toHold = p(t, 31.6, 31.9, IN_OUT);
  const toSnap = p(t, T.lost - 0.08, T.lost + 0.1, OUT);
  const toProud = p(t, T.lost + 0.25, T.lost + 0.55, IN_OUT);
  let pose = lerpPose(POSES.nahL, POSES.nahR, t < 31.6 ? wave : 0.5);
  if (toHold > 0) pose = lerpPose(pose, POSES.holdUp, toHold);
  if (toSnap > 0) pose = lerpPose(POSES.holdUp, POSES.snap, toSnap);
  if (toProud > 0) pose = lerpPose(POSES.snap, POSES.proud, toProud);
  const glow = p(t, T.debt3, T.debt3 + 0.25) * (1 - toSnap);
  const crowd = p(t, T.impress, T.impress + 0.3, OUT) * (1 - p(t, T.lost, T.lost + 0.3));
  const win = p(t, T.lost, T.lost + 0.5, OUT);

  return (
    <AbsoluteFill style={{background: '#070908', opacity: 1 - exit}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 45% at 50% 62%, rgba(54,224,121,${0.04 + win * 0.18}), rgba(0,0,0,0) 70%)`}} />

      {/* NAH. */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: 360, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 300,
          letterSpacing: '-0.05em', color: C.white, transform: `scale(${mix(1.25, 1, nahK)}) translateY(${-nahOut * 80}px)`, opacity: nahK * (1 - nahOut),
        }}
      >
        NAH<span style={{color: C.green}}>.</span>
      </div>

      {/* the payoff line */}
      <div style={{position: 'absolute', left: 64, top: 230}}>
        <RevealLine t={t} at={T.impress - 0.05} size={104}>DEBT TO IMPRESS</RevealLine>
        <RevealLine t={t} at={T.already - 0.05} size={104} color={C.red}>= ALREADY LOST.</RevealLine>
      </div>

      {/* faded audience appears on "impress somebody" */}
      {[170, 910].map((x, i) => (
        <Stickman key={i} x={x} y={1090} scale={0.72} pose={POSES.phone} color={C.gray} face="flat" phone="right" opacity={crowd * 0.45} flip={i === 1} />
      ))}

      <Stickman
        x={HIP.x} y={HIP.y} scale={1.08} pose={pose} color={C.green}
        face={toProud > 0.5 ? 'smile' : t < 31.6 ? 'smirk' : 'flat'}
        card={toHold > 0.3 ? 'right' : undefined} cardGlow={glow} cardBroken={toSnap > 0 ? p(t, T.lost - 0.02, T.lost + 0.45, OUT) : 0}
      />
    </AbsoluteFill>
  );
};
