import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, C, FONT_HEAD, IN, IN_OUT, OUT, mix, p, shake} from '../lib';
import {T} from '../timing';
import {Cutout, Photo, useT} from '../ui';

// 0:00–0:02.4 — three luxury objects, DEBT stamp, stamp crossed out and broken.
export const S1Hook: React.FC = () => {
  const t = useT();
  const exit = p(t, 2.28, 2.6, IN);
  const stampIn = p(t, T.debt1, T.debt1 + 0.12, OUT);
  const strike = p(t, 2.08, 2.2, OUT);
  const brk = p(t, 2.22, 2.5, OUT);
  const sk = shake(t, T.debt1, 18, 0.3);
  const desat = stampIn * (1 - brk);

  const carIn = p(t, 0, 0.4, OUT);
  const sneakIn = p(t, 0.26, 0.6, OUT);
  const bagIn = p(t, 0.42, 0.76, OUT);
  const watchIn = p(t, 0.6, 0.95, BACK);

  return (
    <AbsoluteFill style={{background: C.bg, transform: `translateX(${-exit * 1100}px)`, filter: exit > 0 ? `blur(${exit * 10}px)` : undefined}}>
      <Photo src="stage_floor.jpg" zoom={mix(1.12, 1.04, p(t, 0, 2.4, IN_OUT))} pos="50% 70%" />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 30% at 50% 66%, rgba(54,224,121,0.16), rgba(0,0,0,0) 70%)'}} />

      {/* Title */}
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center'}}>
        <div
          style={{
            fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 218, letterSpacing: '-0.045em', lineHeight: 0.9,
            color: C.white, transform: `scale(${mix(1.16, 1, p(t, 0, 0.3, OUT))})`,
          }}
        >
          <span style={{color: C.green}}>3</span> THINGS
        </div>
        <div style={{overflow: 'hidden', marginTop: 18}}>
          <div
            style={{
              fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 76, letterSpacing: '-0.02em', color: C.white,
              transform: `translateY(${(1 - p(t, T.i, T.i + 0.35)) * 110}%)`,
            }}
          >
            I REFUSE TO <span style={{color: C.red}}>FINANCE</span>
          </div>
        </div>
      </div>

      {/* Objects */}
      <AbsoluteFill style={{transform: `translate(${sk.x}px, ${sk.y}px)`, filter: `saturate(${1 - desat * 0.6}) brightness(${1 - desat * 0.25})`}}>
        <Cutout name="car_sedan_front" x={160} y={620} w={760} scale={mix(1.12, 1, carIn)} />
        <Cutout name="shopping_bag" x={mix(1100, 700, bagIn)} y={860} w={340} rot={mix(10, 4, bagIn)} />
        <Cutout name="sneakers_hightop" x={mix(-600, 0, sneakIn)} y={930} w={560} rot={mix(-14, -5, sneakIn)} />
        <Cutout name="watch" x={360} y={mix(1500, 1180, watchIn)} w={380} rot={-6} opacity={p(t, 0.6, 0.7)} />
      </AbsoluteFill>

      {/* DEBT stamp → crossed out → breaks apart */}
      {t >= T.debt1 && (
        <div
          style={{
            position: 'absolute', left: 540, top: 1000, width: 0, height: 0,
            opacity: stampIn * (1 - p(t, 2.32, 2.52)),
          }}
        >
          {[0, 1].map((half) => (
            <div
              key={half}
              style={{
                position: 'absolute', left: -380, top: -150, width: 760, height: 300,
                clipPath: half === 0 ? 'polygon(0 0,100% 0,100% 38%,0 62%)' : 'polygon(0 62%,100% 38%,100% 100%,0 100%)',
                transform: `translate(${(half ? 1 : -1) * brk * 70}px, ${(half ? 1 : -1) * brk * 90}px) rotate(${-9 + (half ? 1 : -1) * brk * 8}deg) scale(${mix(2.1, 1, stampIn)})`,
              }}
            >
              <div
                style={{
                  position: 'absolute', inset: 0, border: `16px solid ${C.red}`, borderRadius: 26,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 250, letterSpacing: '0.02em', color: C.red,
                  background: 'rgba(255,87,87,0.08)', boxShadow: '0 0 60px rgba(255,87,87,0.35)',
                  WebkitMaskImage: 'radial-gradient(circle at 30% 40%, #000 60%, rgba(0,0,0,0.82) 100%)',
                }}
              >
                DEBT
              </div>
            </div>
          ))}
          {/* Strike-through */}
          <div style={{position: 'absolute', left: -430, top: -12, width: 860, height: 24, transform: 'rotate(-14deg)', opacity: 1 - brk}}>
            <div
              style={{
                width: '100%', height: '100%', borderRadius: 12, background: C.green, boxShadow: `0 0 30px ${C.green}`,
                transformOrigin: 'left center', transform: `scaleX(${strike})`,
              }}
            />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
