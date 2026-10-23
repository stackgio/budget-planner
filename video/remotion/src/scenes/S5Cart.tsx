import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {C, FONT_BODY, IN, IN_OUT, OUT, cut, money, p} from '../lib';
import {T} from '../timing';
import {Photo, useT} from '../ui';

// Phone geometry (cutout pixels) and placement in frame: screen lands at x 265–814, y 200–1245.
export const PHONE = {w: 1388, h: 2141, sx: 182, sy: 73, sw: 704, sh: 1340, scale: 0.78, left: 123, top: 143};

type Item = {name: string; sub: string; price: number; at: number; img: string};
export const ITEMS: Item[] = [
  {name: 'Cable-knit cardigan', sub: 'Cream · M', price: 64, at: T.cart, img: 'sweater'},
  {name: 'Designer leather jacket', sub: 'Black · M', price: 289, at: T.designer, img: 'jacket'},
  {name: 'Dark-wash jeans', sub: 'Indigo · 32', price: 120, at: T.clothes2, img: 'jeans'},
  {name: 'Hi-top sneakers', sub: 'Size 10', price: 220, at: T.expensive2, img: 'sneakers_hightop'},
  {name: 'Leather sneakers', sub: 'White · Size 10', price: 180, at: T.sneakers, img: 'sneakers_sport'},
];
export const CART_TOTAL = ITEMS.reduce((s, it) => s + it.price, 0); // 873
const PAY_LATER = 19.15;

const CartUI: React.FC<{t: number}> = ({t}) => {
  const n = ITEMS.filter((it) => t >= it.at).length;
  const total = ITEMS.reduce((s, it) => s + it.price * p(t, it.at, it.at + 0.3, IN_OUT), 0);
  const paid = p(t, PAY_LATER, PAY_LATER + 0.15);
  return (
    <div
      style={{
        position: 'absolute', left: PHONE.sx, top: PHONE.sy, width: PHONE.sw, height: PHONE.sh, borderRadius: 64,
        background: '#FAFAF8', overflow: 'hidden', fontFamily: FONT_BODY, color: '#141614',
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '30px 60px 0', fontWeight: 700, fontSize: 26}}>
        <span>9:41</span>
        <span style={{letterSpacing: 4}}>●●●</span>
      </div>
      <div style={{padding: '30px 48px 16px', display: 'flex', alignItems: 'baseline', gap: 14, borderBottom: '2px solid #ececea'}}>
        <span style={{fontWeight: 900, fontSize: 54, letterSpacing: '-0.02em'}}>My Cart</span>
        <span style={{fontWeight: 700, fontSize: 34, color: '#8a8f8b'}}>({n})</span>
      </div>
      {ITEMS.map((it, i) => {
        const k = p(t, it.at, it.at + 0.3, OUT);
        if (k <= 0) return null;
        return (
          <div
            key={i}
            style={{
              display: 'flex', gap: 24, alignItems: 'center', padding: '0 60px 0 44px', height: 176 * k, overflow: 'hidden',
              opacity: k, borderBottom: '2px solid #f0f0ee', background: `rgba(54,224,121,${0.2 * (1 - p(t, it.at + 0.25, it.at + 0.9))})`,
            }}
          >
            <div style={{width: 150, height: 150, borderRadius: 20, flexShrink: 0, background: '#efefec', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
              <Img src={cut(it.img)} style={{maxWidth: 136, maxHeight: 136, objectFit: 'contain'}} />
            </div>
            <div style={{flex: 1}}>
              <div style={{fontWeight: 800, fontSize: 32, lineHeight: 1.12}}>{it.name}</div>
              <div style={{fontWeight: 500, fontSize: 25, color: '#8a8f8b', marginTop: 4}}>{it.sub}</div>
              <div style={{fontWeight: 900, fontSize: 40, marginTop: 6}}>${it.price}</div>
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '24px 64px 44px 48px', background: '#fff', borderTop: '2px solid #ececea'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <span style={{fontWeight: 700, fontSize: 32, color: '#555'}}>Total</span>
          <span style={{fontWeight: 900, fontSize: 56, fontVariantNumeric: 'tabular-nums'}}>{money(total)}</span>
        </div>
        <div
          style={{
            marginTop: 16, height: 96, borderRadius: 48, background: paid > 0.5 ? C.red : '#141614', color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 34, transform: `scale(${1 - 0.05 * Math.sin(paid * Math.PI)})`,
          }}
        >
          {paid > 0.5 ? 'Paid later ✓ Now you owe it' : `Checkout · pay later (${n})`}
        </div>
      </div>
    </div>
  );
};

// 0:16.0–0:19.9 — the cart fills with recognizable items on each spoken item.
export const S5Cart: React.FC = () => {
  const t = useT();
  const inK = p(t, 16.0, 16.4, OUT);
  const out = p(t, 19.45, 19.85, IN);
  return (
    <AbsoluteFill style={{opacity: p(t, 16.0, 16.12)}}>
      <Photo src="boutique.jpg" zoom={1.14} blur={14} dark={0.72} pos="40% 50%" />
      <div
        style={{
          position: 'absolute', left: PHONE.left, top: PHONE.top + (1 - inK) * 1200 + out * 1300, width: PHONE.w, height: PHONE.h,
          transform: `scale(${PHONE.scale}) rotate(${(1 - inK) * -5}deg)`, transformOrigin: '0 0',
        }}
      >
        <CartUI t={t} />
        <Img src={cut('phone_hand')} style={{position: 'absolute', left: 0, top: 0, width: PHONE.w, filter: 'drop-shadow(0 40px 50px rgba(0,0,0,0.6))'}} />
      </div>
    </AbsoluteFill>
  );
};
