import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {C, FONT_BODY, FONT_HEAD, IN, IN_OUT, OUT, img, mix, p} from '../lib';
import {T} from '../timing';
import {useT} from '../ui';

/** Full-bleed cut revealed by a vertical wipe. */
const Cut: React.FC<{t: number; at: number; children: React.ReactNode}> = ({t, at, children}) => {
  const k = p(t, at - 0.06, at + 0.22, IN_OUT);
  if (t < at - 0.06) return null;
  return <AbsoluteFill style={{clipPath: `inset(${(1 - k) * 100}% 0 0 0)`}}>{children}</AbsoluteFill>;
};

const Label: React.FC<{t: number; at: number; title: string; sub: string; extra?: React.ReactNode}> = ({t, at, title, sub, extra}) => {
  const k = p(t, at + 0.05, at + 0.4, OUT);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 640, transform: `translateY(${(1 - k) * 40}px)`, opacity: k}}>
      <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 210, letterSpacing: '-0.05em', color: C.white, lineHeight: 0.9, textShadow: '0 10px 40px rgba(0,0,0,0.6)'}}>{title}</div>
      {extra}
      <div style={{fontFamily: FONT_BODY, fontWeight: 700, fontSize: 36, color: '#dfe5e1', marginTop: 18, textShadow: '0 2px 12px rgba(0,0,0,0.8)'}}>{sub}</div>
    </div>
  );
};

const shade = 'linear-gradient(180deg, rgba(11,13,12,0.55) 0%, rgba(11,13,12,0.25) 30%, rgba(11,13,12,0.65) 75%, rgba(11,13,12,0.85) 100%)';

// 0:10.5–0:13.7 — three distinct full-screen alternatives, cut on the spoken words.
export const S3Alts: React.FC = () => {
  const t = useT();
  const exit = p(t, 13.3, 13.75, IN);
  const goal = p(t, T.building + 0.2, T.building + 1.1, IN_OUT);
  return (
    <AbsoluteFill style={{transform: `scale(${1 - exit * 0.05})`}}>
      <Cut t={t} at={T.saving}>
        <Img src={img('jar.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '82% 50%', transform: `scale(${mix(1.15, 1.05, p(t, T.saving, T.traveling + 0.3))})`}} />
        <AbsoluteFill style={{background: shade}} />
        <Label
          t={t} at={T.saving} title="SAVE" sub="A real emergency fund"
          extra={
            <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 92, color: C.green, letterSpacing: '-0.03em', marginTop: 14}}>
              $10,200<span style={{fontSize: 44, color: '#dfe5e1'}}> /year*</span>
            </div>
          }
        />
      </Cut>
      <Cut t={t} at={T.traveling}>
        <Img src={img('beach.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 60%', transform: `scale(${mix(1.12, 1.02, p(t, T.traveling, T.building + 0.3))})`}} />
        <AbsoluteFill style={{background: shade}} />
        <Label t={t} at={T.traveling} title="TRAVEL" sub="Trips paid for in cash" />
      </Cut>
      <Cut t={t} at={T.building}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 45%, #12301e, ${C.bg} 75%)`}} />
        <Label
          t={t} at={T.building} title="BUILD" sub=""
          extra={
            <>
              <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 210, letterSpacing: '-0.05em', color: C.green, lineHeight: 0.9}}>WEALTH</div>
              <div style={{marginTop: 46, width: 940}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT_BODY, fontWeight: 800, fontSize: 30, letterSpacing: '0.14em', color: '#dfe5e1'}}>
                  <span>FIRST-HOME FUND</span>
                  <span style={{color: C.green, fontVariantNumeric: 'tabular-nums'}}>{Math.round(goal * 68)}%</span>
                </div>
                <div style={{marginTop: 14, height: 30, borderRadius: 15, background: 'rgba(245,247,245,0.12)', overflow: 'hidden'}}>
                  <div style={{width: `${goal * 68}%`, height: '100%', borderRadius: 15, background: `linear-gradient(90deg, #1f9e55, ${C.green})`, boxShadow: `0 0 20px ${C.green}88`}} />
                </div>
              </div>
            </>
          }
        />
      </Cut>
      {/* persistent disclaimer */}
      <div style={{position: 'absolute', left: 70, right: 70, top: 1196, textAlign: 'center', fontFamily: FONT_BODY, fontWeight: 600, fontSize: 24, color: '#c4cbc6', opacity: p(t, T.saving, T.saving + 0.3), textShadow: '0 2px 8px rgba(0,0,0,0.8)'}}>
        *Hypothetical: $850/mo saved for 12 months. No returns assumed.
      </div>
    </AbsoluteFill>
  );
};

