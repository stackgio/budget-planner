import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {C, FONT_BODY, FONT_HEAD, IN, IN_OUT, OUT, cut, mix, p} from '../lib';
import {T} from '../timing';
import {Glass, Photo, RevealLine, useT} from '../ui';

const Check: React.FC<{t: number; at: number}> = ({t, at}) => {
  const ring = p(t, at, at + 0.4, OUT);
  const tick = p(t, at + 0.2, at + 0.5, OUT);
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" style={{filter: `drop-shadow(0 0 ${18 * ring}px ${C.green})`}}>
      <circle cx={60} cy={60} r={52} fill="rgba(54,224,121,0.12)" stroke={C.green} strokeWidth={7} strokeDasharray={327} strokeDashoffset={327 * (1 - ring)} transform="rotate(-90 60 60)" />
      <path d="M36 62 L53 78 L86 44" fill="none" stroke={C.green} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={80} strokeDashoffset={80 * (1 - tick)} />
    </svg>
  );
};

// 0:30.95–0:35.7 — "Nah." Walk away from the setup; my money, my priorities.
export const S8Rule: React.FC = () => {
  const t = useT();
  const nahK = p(t, T.nah, T.nah + 0.18, OUT);
  const toPhoto = p(t, 31.5, 31.8, IN_OUT);
  const cardIn = p(t, 31.75, 32.15, OUT);
  const swipe = p(t, 33.08, 33.45, IN);
  const exit = p(t, 35.38, 35.7, IN_OUT);

  return (
    <AbsoluteFill style={{background: '#050606', opacity: 1 - exit}}>
      {/* NAH. */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: 1 - toPhoto}}>
        <div
          style={{
            fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 330, letterSpacing: '-0.05em', color: C.white,
            transform: `scale(${mix(1.25, 1, nahK)}) translateY(${-toPhoto * 120}px)`, marginTop: -160,
          }}
        >
          NAH<span style={{color: C.green}}>.</span>
        </div>
      </AbsoluteFill>

      {t >= 31.45 && (
        <AbsoluteFill style={{opacity: toPhoto}}>
          <Photo
            src="man_walking_away.jpg" zoom={mix(1.0, 1.1, p(t, 31.5, 35.7, IN_OUT))} dark={0.35} pos="50% 60%"
            style={{filter: 'saturate(0.85) contrast(1.05)'}}
          />
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,13,12,0.9) 0%, rgba(11,13,12,0.25) 42%, rgba(11,13,12,0.2) 62%, rgba(11,13,12,0.85) 100%)'}} />

          {/* The purchase he skips */}
          {swipe < 1 && (
            <Glass
              style={{
                left: 90, top: 300, width: 900, height: 230, opacity: cardIn * (1 - p(swipe, 0.6, 1)), overflow: 'hidden',
                transform: `translate(${(1 - cardIn) * 0 - swipe * 1150}px, ${(1 - cardIn) * 60}px) rotate(${-swipe * 14}deg)`,
              }}
            >
              <Img src={cut('car_highway')} style={{position: 'absolute', right: -40, top: 50, width: 470, opacity: 0.95}} />
              <div style={{position: 'absolute', left: 36, top: 32, fontFamily: FONT_BODY}}>
                <div style={{fontWeight: 800, fontSize: 24, letterSpacing: '0.2em', color: C.gray}}>FINANCE OFFER</div>
                <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 56, color: C.white, marginTop: 6}}>$940/mo</div>
                <div style={{fontWeight: 600, fontSize: 26, color: C.gray, marginTop: 2}}>72 months · to look the part</div>
              </div>
            </Glass>
          )}
          {t >= T.impress - 0.1 && swipe < 1 && (
            <div
              style={{
                position: 'absolute', left: 90 - swipe * 1150, top: 552, padding: '14px 28px', borderRadius: 999,
                background: 'rgba(11,13,12,0.85)', border: `2px solid ${C.green}`, color: C.green,
                fontFamily: FONT_BODY, fontWeight: 900, fontSize: 32, letterSpacing: '0.12em',
                opacity: p(t, T.impress - 0.1, T.impress + 0.05) * (1 - swipe),
              }}
            >
              ✕ NOT FOR ME
            </div>
          )}

          {/* My money. My priorities. */}
          <div style={{position: 'absolute', left: 64, top: 300}}>
            <div style={{opacity: p(t, T.already - 0.05, T.already + 0.1), marginBottom: 10}}>
              <Check t={t} at={T.already - 0.05} />
            </div>
            <RevealLine t={t} at={T.ive} size={140}>MY MONEY.</RevealLine>
            <RevealLine t={t} at={T.already + 0.05} size={118} color={C.green}>MY PRIORITIES.</RevealLine>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
