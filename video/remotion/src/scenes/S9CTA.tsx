import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_BODY, FONT_HEAD, OUT, p} from '../lib';
import {QUESTION} from '../timing';
import {useT} from '../ui';

// Line breaks for the end-card question (indices into QUESTION).
const LINES = [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]];

// 0:35.3–end — the question, prominent and word-synced with the narration.
export const S9CTA: React.FC = () => {
  const t = useT();
  const enter = p(t, 35.3, 35.55, OUT);
  const breathe = 0.5 + 0.5 * Math.sin(t * 2.2);
  return (
    <AbsoluteFill style={{background: C.bg, opacity: enter}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 45% at 30% 45%, rgba(54,224,121,${0.07 + breathe * 0.04}), rgba(0,0,0,0) 70%)`}} />
      <div style={{position: 'absolute', left: 70, right: 50, top: 330, transform: `scale(${1 + p(t, 35.5, 38.5, (x) => x) * 0.045})`, transformOrigin: '0% 50%'}}>
        {LINES.map((line, li) => (
          <div key={li} style={{display: 'flex', gap: 30, flexWrap: 'nowrap'}}>
            {line.map((i) => {
              const w = QUESTION[i];
              const said = t >= w.s - 0.03;
              const pop = p(t, w.s - 0.03, w.s + 0.1, OUT) - p(t, w.s + 0.1, w.s + 0.26, OUT);
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-block', fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 132, letterSpacing: '-0.045em', lineHeight: 1.0,
                    color: said && w.g ? C.green : C.white, opacity: said ? 1 : 0.18, transform: `scale(${1 + pop * (w.g ? 0.08 : 0.04)})`,
                    transformOrigin: '50% 80%', textTransform: 'uppercase',
                  }}
                >
                  {w.w}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 70, top: 1040, fontFamily: FONT_BODY, fontWeight: 800, fontSize: 48, color: C.white, opacity: p(t, 36.9, 37.15)}}>
        Tell me in the comments <span style={{color: C.green}}>↓</span>
      </div>
      <div style={{position: 'absolute', left: 70, top: 1120, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 32, color: C.gray, opacity: p(t, 37.0, 37.3)}}>
        @stackwithgio
      </div>
    </AbsoluteFill>
  );
};
