import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {BACK, C, IN, IN_OUT, OUT, cut, mix, p} from '../lib';
import {T} from '../timing';
import {Cutout, Kicker, Photo, RevealLine, useT} from '../ui';

const BAG_W = 987;
const BAG_H = 1292;

// 0:13.3–0:16.4 — dive through a shopping bag into the boutique; "clothes & shoes".
export const S4Clothes: React.FC = () => {
  const t = useT();
  // bag flies in over the previous scene, then becomes the mask that reveals this one
  const bagIn = p(t, 13.3, 13.58, OUT);
  const grow = p(t, 13.55, 14.0, IN);
  const bagW = mix(380, 9000, grow);
  const bagH = (bagW * BAG_H) / BAG_W;
  const cx = 540;
  const cy = mix(1500, 860, bagIn) + grow * 300; // aim slightly into the bag body as it grows
  const masked = t < 14.0;
  const exit = p(t, 16.05, 16.4, IN_OUT);

  const content = (
    <AbsoluteFill style={{background: C.bg}}>
      <Photo
        src="boutique.jpg"
        zoom={mix(1.25, 1.12, p(t, 13.5, 16.4, IN_OUT))}
        blur={mix(10, 2.5, p(t, T.clothes, T.clothes + 0.5))}
        dark={mix(0.6, 0.38, p(t, T.clothes, T.clothes + 0.5)) + exit * 0.3}
        pos="40% 50%"
      />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,13,12,0.85) 0%, rgba(11,13,12,0) 38%, rgba(11,13,12,0) 55%, rgba(11,13,12,0.9) 100%)'}} />
      <div style={{position: 'absolute', left: 70, top: 228}}>
        <Kicker t={t} at={13.75}>NUMBER TWO</Kicker>
      </div>
      <div style={{position: 'absolute', left: 64, top: 320}}>
        <RevealLine t={t} at={T.clothes} size={160}>CLOTHES</RevealLine>
        <RevealLine t={t} at={T.shoes - 0.05} size={160}>
          <span style={{color: C.green}}>&amp;</span> SHOES
        </RevealLine>
      </div>
      <Cutout
        name="sneakers_sport" x={-30} y={mix(1500, 960, p(t, T.shoes, T.shoes + 0.45, BACK))} w={620} rot={-6}
        opacity={p(t, T.shoes, T.shoes + 0.1)}
      />
      <Cutout
        name="sneakers_hightop" x={520} y={mix(1500, 860, p(t, T.shoes + 0.14, T.shoes + 0.6, BACK))} w={560} rot={4}
        opacity={p(t, T.shoes + 0.14, T.shoes + 0.24)}
      />
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill>
      {masked ? (
        <AbsoluteFill
          style={{
            WebkitMaskImage: `url(${cut('shopping_bag')})`, WebkitMaskRepeat: 'no-repeat',
            WebkitMaskSize: `${bagW}px ${bagH}px`, WebkitMaskPosition: `${cx - bagW / 2}px ${cy - bagH / 2}px`,
            opacity: grow > 0 ? 1 : 0,
          }}
        >
          {content}
        </AbsoluteFill>
      ) : (
        content
      )}
      {masked && (
        <Img
          src={cut('shopping_bag')}
          style={{
            position: 'absolute', left: cx - bagW / 2, top: cy - bagH / 2, width: bagW, height: bagH,
            opacity: bagIn * (1 - p(t, 13.6, 13.85)), transform: `rotate(${(1 - bagIn) * 12}deg)`,
            filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.6))',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
