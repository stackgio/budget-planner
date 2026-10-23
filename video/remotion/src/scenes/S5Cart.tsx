import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {BACK, FONT_BODY, IN, IN_OUT, OUT, cut, mix, money, p} from '../lib';
import {T} from '../timing';
import {Photo, PriceTag, useT} from '../ui';

// Phone geometry (cutout pixels) and placement in frame
export const PHONE = {w: 1388, h: 2141, sx: 182, sy: 73, sw: 704, sh: 1340, scale: 0.74, left: -65, top: 226};

type Item = {name: string; sub: string; price: number; at: number; thumb: React.CSSProperties};
const fig = (x: number, y: number, z = 420): React.CSSProperties => ({
  backgroundImage: `url(${cut('man_fullbody')})`, backgroundSize: `${z}%`, backgroundPosition: `${x}% ${y}%`,
  backgroundRepeat: 'no-repeat', backgroundColor: '#ECECEA',
});
const prod = (n: string): React.CSSProperties => ({
  backgroundImage: `url(${cut(n)})`, backgroundSize: 'contain', backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat', backgroundColor: '#F1F1EF',
});

export const ITEMS: Item[] = [
  {name: 'Knit crewneck sweater', sub: 'Black · M', price: 64, at: T.cart, thumb: fig(70, 20)},
  {name: 'Designer leather jacket', sub: 'Black · M', price: 289, at: T.designer, thumb: fig(97, 30, 330)},
  {name: 'Slim black jeans', sub: 'Black · 32', price: 120, at: T.clothes2, thumb: fig(45, 52, 260)},
  {name: 'Hi-top sneakers', sub: 'Size 10', price: 220, at: T.expensive2, thumb: prod('sneakers_hightop')},
  {name: 'Leather sneakers', sub: 'White · Size 10', price: 180, at: T.sneakers, thumb: prod('sneakers_sport')},
];

/** Where each tag sits in the stack (frame px). Shared with the next scene. */
export const stackPos = (i: number) => ({x: 790, y: 300 + i * 104, rot: [-7, 5, -3, 6, -5][i]});

const CartUI: React.FC<{t: number}> = ({t}) => {
  const n = ITEMS.filter((it) => t >= it.at).length;
  const total = ITEMS.reduce((s, it) => s + it.price * p(t, it.at, it.at + 0.35, IN_OUT), 0);
  return (
    <div
      style={{
        position: 'absolute', left: PHONE.sx, top: PHONE.sy, width: PHONE.sw, height: PHONE.sh, borderRadius: 64,
        background: '#FAFAF8', overflow: 'hidden', fontFamily: FONT_BODY, color: '#141614',
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '30px 52px 0', fontWeight: 700, fontSize: 26}}>
        <span>9:41</span>
        <span style={{letterSpacing: 4}}>●●●</span>
      </div>
      <div style={{padding: '34px 40px 18px', display: 'flex', alignItems: 'baseline', gap: 14, borderBottom: '2px solid #ececea'}}>
        <span style={{fontWeight: 900, fontSize: 52, letterSpacing: '-0.02em'}}>My Cart</span>
        <span style={{fontWeight: 700, fontSize: 32, color: '#8a8f8b'}}>({n})</span>
      </div>
      {ITEMS.map((it, i) => {
        const k = p(t, it.at, it.at + 0.35, OUT);
        if (k <= 0) return null;
        return (
          <div
            key={i}
            style={{
              display: 'flex', gap: 24, alignItems: 'center', padding: '0 56px 0 44px', height: 172 * k, overflow: 'hidden',
              opacity: k, borderBottom: '2px solid #f0f0ee', background: `rgba(54,224,121,${0.18 * (1 - p(t, it.at + 0.2, it.at + 0.9))})`,
            }}
          >
            <div style={{width: 128, height: 128, borderRadius: 18, flexShrink: 0, ...it.thumb}} />
            <div style={{flex: 1}}>
              <div style={{fontWeight: 700, fontSize: 30, lineHeight: 1.15}}>{it.name}</div>
              <div style={{fontWeight: 500, fontSize: 24, color: '#8a8f8b', marginTop: 6}}>{it.sub}</div>
              <div style={{fontWeight: 900, fontSize: 36, marginTop: 8}}>${it.price}.00</div>
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '26px 64px 44px 48px', background: '#fff', borderTop: '2px solid #ececea'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <span style={{fontWeight: 700, fontSize: 30, color: '#555'}}>Total</span>
          <span style={{fontWeight: 900, fontSize: 52, fontVariantNumeric: 'tabular-nums'}}>{money(total)}</span>
        </div>
        <div style={{fontWeight: 600, fontSize: 23, color: '#7b807c', marginTop: 6}}>or 4 payments of {money(total / 4)} — pay later</div>
        <div style={{marginTop: 18, height: 92, borderRadius: 46, background: '#141614', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 32}}>
          Checkout ({n})
        </div>
      </div>
    </div>
  );
};

// 0:16.0–0:19.9 — the cart fills up; price tags stack beside the phone.
export const S5Cart: React.FC = () => {
  const t = useT();
  const inK = p(t, 16.0, 16.5, OUT);
  const out = p(t, 19.45, 19.9, IN);
  return (
    <AbsoluteFill style={{opacity: p(t, 16.0, 16.15)}}>
      <Photo src="boutique.jpg" zoom={1.14} blur={14} dark={0.7} pos="40% 50%" />
      <div
        style={{
          position: 'absolute', left: PHONE.left, top: PHONE.top + (1 - inK) * 1300 + out * 1400, width: PHONE.w, height: PHONE.h,
          transform: `scale(${PHONE.scale}) rotate(${(1 - inK) * -6}deg)`, transformOrigin: '0 0',
          filter: out > 0 ? `blur(${out * 8}px)` : undefined,
        }}
      >
        <CartUI t={t} />
        <Img src={cut('phone_hand')} style={{position: 'absolute', left: 0, top: 0, width: PHONE.w, filter: 'drop-shadow(0 40px 50px rgba(0,0,0,0.6))'}} />
      </div>
      {/* Price tags stacking on the right */}
      {t < 19.62 &&
        ITEMS.map((it, i) => {
          const k = p(t, it.at + 0.05, it.at + 0.45, BACK);
          if (k <= 0) return null;
          const s = stackPos(i);
          return (
            <PriceTag
              key={i}
              price={`$${it.price}`}
              label="PRICE"
              style={{
                left: mix(430, s.x, k) - 105, top: mix(560 + i * 150, s.y, k) - 56,
                transform: `rotate(${mix(-20, s.rot, k)}deg) scale(${mix(0.5, 1, k)})`, opacity: Math.min(1, k * 3),
              }}
            />
          );
        })}
    </AbsoluteFill>
  );
};

