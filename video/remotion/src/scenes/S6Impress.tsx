import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {C, FONT_BODY, IN_OUT, OUT, img, mix, p, rand} from '../lib';
import {T} from '../timing';
import {Kicker, Photo, RevealLine, useT} from '../ui';
import {Heart, Notice, Post} from '../social';

const FRAME = {x: 90, y: 590, w: 900, h: 700};

const Viewfinder: React.FC<{t: number}> = ({t}) => {
  const blink = Math.floor(t * 2.5) % 2 === 0;
  const c = 'rgba(245,247,245,0.9)';
  const corner = (s: React.CSSProperties) => <div style={{position: 'absolute', width: 70, height: 70, borderColor: c, borderStyle: 'solid', ...s}} />;
  const focus = p(t, 23.3, 23.7, OUT);
  return (
    <div style={{position: 'absolute', inset: 0, fontFamily: FONT_BODY, color: c}}>
      {corner({left: 30, top: 30, borderWidth: '5px 0 0 5px'})}
      {corner({right: 30, top: 30, borderWidth: '5px 5px 0 0'})}
      {corner({left: 30, bottom: 30, borderWidth: '0 0 5px 5px'})}
      {corner({right: 30, bottom: 30, borderWidth: '0 5px 5px 0'})}
      <div style={{position: 'absolute', left: 60, top: 56, fontWeight: 800, fontSize: 30, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{width: 18, height: 18, borderRadius: 9, background: C.red, opacity: blink ? 1 : 0.25}} /> REC
      </div>
      <div style={{position: 'absolute', right: 60, top: 56, fontWeight: 700, fontSize: 28, letterSpacing: '0.1em'}}>4K · 60</div>
      {/* focus square on the subject */}
      <div
        style={{
          position: 'absolute', left: 520, top: 110, width: 220, height: 220, border: `4px solid ${C.green}`,
          transform: `scale(${mix(1.6, 1, focus)})`, opacity: focus,
        }}
      />
    </div>
  );
};

// 0:22.9–0:26.2 — the flex photo, the likes, then the bills.
export const S6Impress: React.FC = () => {
  const t = useT();
  const enter = p(t, 22.92, 23.2, OUT);
  const shot = t >= T.impressing;
  const flash = shot ? 1 - p(t, T.impressing, T.impressing + 0.35) : 0;
  const toPost = p(t, T.impressing + 0.05, T.impressing + 0.45, OUT);
  const pull = p(t, T.people1, T.people1 + 0.6, IN_OUT);
  const likes = Math.round(mix(0, 1284, p(t, T.impressing + 0.3, 25.6, OUT)));
  const exit = p(t, 25.95, 26.25, IN_OUT);

  // Frame morphs from camera viewfinder to a post card, then the camera pulls back.
  const scale = mix(1, 0.62, pull);
  const ty = mix(0, -150, pull);
  const imgH = mix(FRAME.h, 560, toPost);
  const cardW = FRAME.w;

  return (
    <AbsoluteFill
      style={{
        background: C.bg, transform: `translateX(${(1 - enter) * 1100}px)`, filter: enter < 1 ? `blur(${(1 - enter) * 10}px)` : undefined,
        opacity: 1 - exit,
      }}
    >
      <Photo src="man_black_suv.jpg" zoom={1.25} blur={18} dark={mix(0.55, 0.8, pull)} pos="70% 50%" style={{filter: `saturate(${1 - pull * 0.8})`}} />

      <div style={{position: 'absolute', left: 70, top: 228, opacity: 1 - pull}}>
        <Kicker t={t} at={T.number3}>NUMBER THREE</Kicker>
      </div>
      <div style={{position: 'absolute', left: 64, top: 316, opacity: 1 - pull}}>
        <RevealLine t={t} at={T.impressing - 0.05} size={124}>IMPRESSING</RevealLine>
        <RevealLine t={t} at={T.impressing + 0.25} size={124}>PEOPLE</RevealLine>
      </div>

      <div
        style={{
          position: 'absolute', left: FRAME.x, top: FRAME.y, width: cardW,
          transform: `translateY(${ty}px) scale(${scale})`, transformOrigin: '50% 0%',
        }}
      >
        {!shot ? (
          <div style={{position: 'relative', width: FRAME.w, height: FRAME.h, borderRadius: 34, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)'}}>
            <Img src={img('man_black_suv.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '78% 40%', transform: `scale(${mix(1.15, 1.05, p(t, 23.0, 24.7, IN_OUT))})`}} />
            <Viewfinder t={t} />
          </div>
        ) : (
          <div style={{position: 'relative'}}>
            <Post photo="man_black_suv.jpg" pos="78% 40%" width={cardW} imgH={imgH} likes={`${likes.toLocaleString('en-US')} likes`} liked={likes > 40} caption="new whip, who dis 😎🔥" />
            {/* floating hearts */}
            {Array.from({length: 9}).map((_, i) => {
              const s = T.impressing + 0.3 + i * 0.11;
              const k = p(t, s, s + 0.9, OUT);
              if (t < s || k >= 1) return null;
              return (
                <div key={i} style={{position: 'absolute', left: 700 + rand(i) * 140, top: 560 - k * 420, opacity: 1 - k, transform: `scale(${0.7 + rand(i + 9) * 0.6})`}}>
                  <Heart size={70} fill={C.red} stroke={C.red} />
                </div>
              );
            })}
          </div>
        )}
        <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash, borderRadius: 34}} />
      </div>

      {/* Reality: bills arrive as the camera pulls back */}
      {t >= 25.6 && (
        <>
          <Notice title="AUTO LOAN" body="Payment due tomorrow: $940" style={{top: mix(1500, 1035, p(t, 25.62, 25.95, OUT)), opacity: p(t, 25.62, 25.75)}} />
          <Notice title="CREDIT CARD" body="Balance $4,812 · 29.99% APR" style={{top: mix(1500, 1180, p(t, 25.82, 26.15, OUT)), opacity: p(t, 25.82, 25.95)}} />
        </>
      )}
    </AbsoluteFill>
  );
};
