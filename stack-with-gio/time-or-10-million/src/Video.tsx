import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, CX, H, SIZE, SW, W} from './theme';
import {CUE} from './timing';
import {mix, prog, pulse, settle} from './anim';
import {useFontsReady} from './fonts';
import {Line} from './components/Text';
import {blend, Marcus, Pose, POSE} from './components/Marcus';
import {Brain, Calendar, CashPile, Clock, Panel} from './components/Props';
import {MemoryFrame, MemoryKind} from './components/Memory';

// ---------- shared layout ----------
const PANEL = {x: 100, w: 800, h: 300, ay: 380, by: 720};
const GROUND = 1480;
const M_SCALE = 0.88;
const SOFT_GRAY = '#C2C2C2';

const ln = (sw: number, color = C.white) => ({
  stroke: color,
  strokeWidth: sw,
  fill: 'none',
  strokeLinecap: 'round' as const,
  vectorEffect: 'non-scaling-stroke' as const,
});

/** Interpolate a pose through keyed (frame, pose) pairs with short eased blends. */
const poseAt = (f: number, keys: [number, Pose][], dur = 8): Pose => {
  let p = keys[0][1];
  for (let i = 1; i < keys.length; i++) p = blend(p, keys[i][1], prog(f, keys[i][0], dur, 'inOut'));
  return p;
};

const OptionTag: React.FC<{letter: 'A' | 'B'; opacity: number}> = ({letter, opacity}) => (
  <Line runs={[{t: 'OPTION ', c: C.gray}, {t: letter, c: C.green}]} x={CX} y={262} size={SIZE.small} weight={800} tracking={0.12} opacity={opacity} />
);

// ---------- Scene 1–4: Option A thread (clock, Marcus, brain are continuous elements) ----------
const OptionA: React.FC<{f: number}> = ({f}) => {
  if (f >= CUE.optionB) return null;
  const s1Out = 1 - prog(f, CUE.optionA, 6);

  // Clock: panel icon → hero (scene 2) → supporting (scene 3) → gone (scene 4)
  const toHero = prog(f, CUE.optionA, 12, 'inOut');
  const toSupport = prog(f, CUE.withEverything, 10, 'inOut');
  const cx = mix(mix(325, CX, toHero), 230, toSupport);
  const cy = mix(mix(530, 590, toHero), 690, toSupport);
  const cr = mix(mix(82, 215, toHero), 84, toSupport);
  const minute =
    120 -
    360 * prog(f, 2, 24, 'inOut') - // brief reverse in the opening
    720 * prog(f, CUE.goBack, 30, 'inOut') - // hands spin backward on "go back"
    Math.max(0, f - CUE.withEverything) * 2.4; // keeps slowly reversing while knowledge stays
  const clockOpacity = 1 - prog(f, CUE.lesson, 5);

  // Calendar pages drift backward (right → left) behind the clock
  const pages = [0, 1, 2].map((i) => {
    const t = prog(f, CUE.goBack + 2 + i * 7, 14, 'inOut');
    const last = i === 2;
    const x = mix(830, last ? 300 : 170, t);
    const op = f < CUE.goBack + 2 + i * 7 ? 0 : last ? 1 : 1 - prog(f, CUE.goBack + 10 + i * 7, 7);
    return {x, rot: mix(8, last ? -7 : -14, t), op: op * (1 - prog(f, CUE.withEverything, 6))};
  });
  // the final page passes backward while the brain stays still (scene 3)
  const passT = prog(f, CUE.know + 6, 18, 'inOut');
  const passOp = f < CUE.know + 6 ? 0 : (1 - prog(f, CUE.know + 18, 6)) * clockOpacity;

  // Marcus
  const pose = poseAt(f, [
    [0, POSE.ponder],
    [CUE.optionA + 2, {...POSE.ponder, head: -14}],
    [CUE.withEverything + 2, POSE.temple],
    [CUE.lesson, POSE.ponder],
  ]);

  // Brain (scene 3 onward)
  const brainIn = prog(f, CUE.withEverything + 3, 8);
  const lit: [number, number, number] = [prog(f, CUE.everything, 6), prog(f, CUE.everything + 8, 6), prog(f, CUE.know, 6)];

  // Scene 4 memory beats
  const beats: [MemoryKind, number, number][] = [
    ['lesson', CUE.lesson, CUE.mistake],
    ['mistake', CUE.mistake, CUE.opportunity],
    ['missed', CUE.opportunity, CUE.rememberAll],
  ];
  const labels: Record<MemoryKind, string> = {lesson: 'LESSONS', mistake: 'MISTAKES', missed: 'MISSED CHANCES'};
  const rowT = prog(f, CUE.rememberAll, 10, 'inOut');
  const slots = [245, CX, 755];
  const ROW_Y = 735;
  const ROW_W = 235;
  const BIG = {x: CX, y: 560, w: 600};
  const greenFlash = pulse(f, CUE.rememberAll + 14, CUE.rememberAll + 34, 5);
  const outline = (a: number) => (a > 0.5 ? C.green : C.line);
  const doorT = prog(f, CUE.opportunity + 6, 40, 'inOut');
  const lineDraw = prog(f, CUE.rememberAll + 9, 9);
  const s4Text = prog(f, CUE.rememberAll + 5, 8);

  return (
    <g>
      {/* Scene 1 panels */}
      <Line runs="CHOOSE ONE" x={CX} y={292} size={SIZE.large} weight={900} opacity={s1Out} />
      <Panel x={PANEL.x} y={PANEL.ay} w={PANEL.w} h={PANEL.h} opacity={s1Out} />
      <Panel x={PANEL.x} y={PANEL.by} w={PANEL.w} h={PANEL.h} opacity={s1Out} />
      <Line runs="A" x={168} y={530} size={96} weight={900} opacity={s1Out} />
      <Line runs="B" x={168} y={870} size={96} weight={900} opacity={s1Out} />
      <Line runs="10 YEARS" x={455} y={488} size={80} maxWidth={420} align="left" opacity={s1Out} />
      <Line runs="BACK" x={455} y={576} size={80} maxWidth={420} align="left" opacity={s1Out} />
      <Line runs="$10" x={455} y={828} size={80} maxWidth={420} align="left" color={C.green} opacity={s1Out} />
      <Line runs="MILLION" x={455} y={916} size={80} maxWidth={420} align="left" color={C.green} opacity={s1Out} />
      <CashPile x={322} y={872} w={122} sw={SW.mini} t={mix(0.4, 1, prog(f, 0, 10))} opacity={s1Out} />

      <OptionTag letter="A" opacity={prog(f, CUE.optionA + 4, 6)} />

      {/* Calendar pages behind the clock */}
      {pages.map((p, i) => (
        <Calendar key={i} x={p.x - 130} y={590 - 150} w={260} h={300} sw={SW.art} rot={p.rot} opacity={p.op} />
      ))}
      <Calendar x={mix(840, 40, passT) - 75} y={690 - 85} w={150} h={170} sw={SW.mini} rot={mix(8, -14, passT)} opacity={passOp} />

      <Clock x={cx} y={cy} r={cr} minute={minute} sw={mix(SW.mini, SW.hero, toHero * (1 - toSupport))} opacity={clockOpacity} />

      {/* Scene 2 text */}
      <Line
        runs="10 YEARS"
        x={CX}
        y={905}
        size={SIZE.huge}
        weight={900}
        opacity={prog(f, CUE.goBack + 4, 6) * (1 - prog(f, CUE.withEverything, 5))}
        scale={settle(f, CUE.goBack + 4, 1.08)}
      />
      <Line
        runs="BACK"
        x={CX}
        y={1003}
        size={SIZE.large}
        weight={900}
        color={C.green}
        opacity={prog(f, CUE.goBack + 8, 6) * (1 - prog(f, CUE.withEverything, 5))}
        dy={(1 - prog(f, CUE.goBack + 8, 8)) * 16}
      />

      {/* Scene 3 text */}
      <Line runs="KEEP WHAT" x={CX} y={360} size={SIZE.large + 4} weight={900} opacity={prog(f, CUE.withEverything + 3, 7) * (1 - prog(f, CUE.lesson, 4))} />
      <Line
        runs={[{t: 'YOU '}, {t: 'KNOW', c: C.green}]}
        x={CX}
        y={462}
        size={SIZE.large + 4}
        weight={900}
        opacity={prog(f, CUE.withEverything + 6, 7) * (1 - prog(f, CUE.lesson, 4))}
      />

      {/* Scene 4: memory frames */}
      {beats.map(([kind, a, b], i) => {
        if (f < a) return null;
        const enter = prog(f, a, 7);
        const isLast = kind === 'missed';
        // big-frame phase
        let x = BIG.x + (1 - enter) * 70;
        let y = BIG.y;
        let w = BIG.w;
        let op = enter * (isLast ? 1 : 1 - prog(f, b, 4));
        // row phase ("you remember it all")
        if (f >= CUE.rememberAll) {
          if (isLast) {
            x = mix(BIG.x, slots[i], rowT);
            y = mix(BIG.y, ROW_Y, rowT);
            w = mix(BIG.w, ROW_W, rowT);
            op = 1;
          } else {
            const pop = prog(f, CUE.rememberAll + 2 + i * 3, 8);
            x = slots[i];
            y = ROW_Y;
            w = ROW_W * mix(0.8, 1, pop);
            op = pop;
          }
        }
        const k = w / 640;
        return (
          <MemoryFrame
            key={kind}
            kind={kind}
            cx={x}
            cy={y}
            w={w}
            sw={6.5 * Math.sqrt(k / 0.94)}
            t={isLast ? doorT : 0}
            outline={f >= CUE.rememberAll ? outline(greenFlash) : C.line}
            opacity={op}
          />
        );
      })}
      {beats.map(([kind, a, b]) => (
        <Line
          key={kind}
          runs={labels[kind]}
          x={CX}
          y={838}
          size={SIZE.medium}
          weight={800}
          tracking={0.02}
          opacity={prog(f, a + 2, 6) * (1 - prog(f, kind === 'missed' ? CUE.rememberAll : b, 4))}
          dy={(1 - prog(f, a + 2, 7)) * 12}
        />
      ))}
      {/* three short connector lines from the memories to the brain */}
      {f >= CUE.rememberAll + 9
        ? (
            [
              [slots[0], ROW_Y + 86, 440, 932],
              [slots[1], ROW_Y + 86, CX, 918],
              [slots[2], ROW_Y + 86, 560, 932],
            ] as const
          ).map(([x1, y1, x2, y2], i) => (
            <path
              key={i}
              d={`M${x1},${y1} L${mix(x1, x2, lineDraw)},${mix(y1, y2, lineDraw)}`}
              {...ln(SW.panel + 1, greenFlash > 0.5 ? C.green : C.gray)}
            />
          ))
        : null}
      <Line runs="YOU REMEMBER" x={CX} y={395} size={SIZE.large} weight={900} opacity={s4Text} dy={(1 - s4Text) * 14} />
      <Line runs="IT ALL" x={CX} y={495} size={SIZE.large} weight={900} opacity={prog(f, CUE.rememberAll + 8, 8)} dy={(1 - prog(f, CUE.rememberAll + 8, 8)) * 14} />

      {/* Brain stays fixed above Marcus while time reverses */}
      <Brain x={CX} y={990} w={190} sw={SW.art} lit={lit} opacity={brainIn} scale={mix(0.88, 1, brainIn)} />

      <Marcus x={CX} y={GROUND} scale={M_SCALE} pose={pose} sw={SW.hero} />
    </g>
  );
};

// ---------- Scene 5–6: Option B ----------
const OptionB: React.FC<{f: number}> = ({f}) => {
  if (f < CUE.optionB || f >= CUE.cant) return null;
  const toS6 = prog(f, CUE.keepLife, 12, 'inOut');
  const amountOp = (f >= CUE.tenMillion ? 1 : 0) * (1 - prog(f, CUE.keepLife, 6));
  const cashT = prog(f, CUE.cash, 10);
  const pileX = mix(CX, 300, toS6);
  const pileY = mix(885, 1392, toS6);
  const pileW = mix(330, 200, toS6);
  const mIn = prog(f, CUE.tenMillion + 4, 7);
  const mx = mix(430, 705, toS6);
  const facing: 1 | -1 = toS6 > 0.5 ? -1 : 1;
  const pose = poseAt(f, [
    [0, POSE.wow],
    [CUE.keepLife + 4, POSE.present],
  ]);
  const calIn = prog(f, CUE.keepLife + 4, 8);
  const ring = prog(f, CUE.life + 6, 12, 'inOut');
  const ringLen = 2 * Math.PI * Math.sqrt((128 * 128 + 58 * 58) / 2);
  return (
    <g>
      <OptionTag letter="B" opacity={1} />
      <Line runs="$10,000,000" x={CX} y={560} size={140} weight={900} color={C.green} tracking={-0.02} opacity={amountOp} scale={settle(f, CUE.tenMillion, 1.1, 9)} />
      <Line
        runs="CASH RIGHT NOW"
        x={CX}
        y={688}
        size={SIZE.medium}
        weight={800}
        tracking={0.04}
        opacity={prog(f, CUE.cash, 7) * (1 - prog(f, CUE.keepLife, 6))}
        dy={(1 - prog(f, CUE.cash, 8)) * 14}
      />
      {f >= CUE.cash ? <CashPile x={pileX} y={pileY} w={pileW} sw={mix(SW.art, SW.mini, toS6)} t={cashT} /> : null}

      {/* Scene 6 */}
      <Line runs="SAME LIFE." x={CX} y={352} size={SIZE.large} weight={900} opacity={prog(f, CUE.keepLife + 2, 7)} dy={(1 - prog(f, CUE.keepLife + 2, 8)) * 14} />
      <Line
        runs={[{t: '$10 MILLION', c: C.green}, {t: ' NOW.'}]}
        x={CX}
        y={460}
        size={SIZE.large}
        weight={900}
        maxWidth={800}
        opacity={prog(f, CUE.keepLife + 8, 7)}
        dy={(1 - prog(f, CUE.keepLife + 8, 8)) * 14}
      />
      <g opacity={calIn} transform={`translate(0,${(1 - calIn) * 20})`}>
        <Calendar x={135} y={600} w={340} h={390} sw={SW.art} grid={false}>
          <Line runs="TODAY" x={170} y={238} size={62} weight={900} maxWidth={250} />
          <ellipse
            cx={170}
            cy={238}
            rx={128}
            ry={58}
            fill="none"
            stroke={C.green}
            strokeWidth={SW.art}
            strokeLinecap="round"
            strokeDasharray={ringLen}
            strokeDashoffset={ringLen * (1 - ring)}
            transform="rotate(-6,170,238)"
          />
        </Calendar>
      </g>

      <Marcus x={mx} y={GROUND + (1 - mIn) * 24} scale={M_SCALE} pose={pose} facing={facing} sw={SW.hero} opacity={mIn} />
    </g>
  );
};

// ---------- Scene 7–9: the restriction, the comparison, the question ----------
const Choice: React.FC<{f: number}> = ({f}) => {
  if (f < CUE.cant) return null;
  const symIn = prog(f, CUE.both, 8);
  const toPanels = prog(f, CUE.areYou, 12, 'inOut');
  const toEnd = prog(f, CUE.aOrB, 12, 'inOut');
  const s7Out = 1 - prog(f, CUE.areYou, 6);
  const panelsIn = prog(f, CUE.areYou + 2, 8);

  // panel groups: scale 1 → 0.85 for the ending, re-centred
  const aCy = mix(PANEL.ay + PANEL.h / 2, 640, toEnd);
  const bCy = mix(PANEL.by + PANEL.h / 2, 930, toEnd);
  const ps = mix(1, 0.85, toEnd);
  const grp = (cyFrom: number, cyTo: number) => `translate(${CX},${cyTo}) scale(${ps}) translate(${-CX},${-cyFrom})`;

  // emphasis beats
  const cashBoost = pulse(f, CUE.money + 2, CUE.money + 22, 7);
  const clockSpin = prog(f, CUE.clock + 2, 24, 'inOut');
  const clockBoost = pulse(f, CUE.clock + 2, CUE.clock + 26, 7);

  // symbol positions: separated (scene 7) → inside panels (scene 8)
  const clk = {x: mix(mix(340, 300, symIn), 240, toPanels), y: mix(1000, 588, toPanels), r: mix(110, 60, toPanels) * (1 + 0.12 * clockBoost)};
  const csh = {x: mix(mix(660, 700, symIn), 232, toPanels), y: mix(1010, 920, toPanels), w: mix(230, 126, toPanels) * (1 + 0.18 * cashBoost)};
  const minute = 120 - 360 * clockSpin;

  const mIn = prog(f, CUE.areYou + 4, 8) * (1 - prog(f, CUE.aOrB, 5));
  const look: Pose = {...POSE.ponder, lookY: mix(-1, -0.2, cashBoost), lookX: mix(0.2, -0.4, cashBoost)};
  const whyT = prog(f, CUE.why, 8);

  const symbolsInScene7 = f < CUE.areYou;
  return (
    <g>
      {/* Scene 7 */}
      <Line runs="ONE" x={CX} y={520} size={144} weight={900} opacity={s7Out} />
      <Line runs="CHOICE." x={CX} y={680} size={144} weight={900} opacity={s7Out} />
      <path d={`M${CX},880 V1130`} stroke={C.line} strokeWidth={SW.panel} opacity={symIn * s7Out} />

      {/* Scene 8/9 panels */}
      <g transform={grp(PANEL.ay + PANEL.h / 2, aCy)} opacity={panelsIn}>
        <Panel x={PANEL.x} y={PANEL.ay} w={PANEL.w} h={PANEL.h} />
        <Line runs={[{t: 'A — 10 YEARS '}, {t: 'BACK', c: C.green}]} x={150} y={458} size={68} weight={900} maxWidth={700} align="left" />
        <Line runs="With what you know now" x={372} y={590} size={38} weight={600} maxWidth={500} align="left" color={SOFT_GRAY} tracking={0} />
      </g>
      <g transform={grp(PANEL.by + PANEL.h / 2, bCy)} opacity={panelsIn}>
        <Panel x={PANEL.x} y={PANEL.by} w={PANEL.w} h={PANEL.h} />
        <Line runs={[{t: 'B — '}, {t: '$10 MILLION', c: C.green}, {t: ' NOW'}]} x={150} y={798} size={68} weight={900} maxWidth={700} align="left" />
        <Line runs="Stay in the present" x={372} y={930} size={38} weight={600} maxWidth={500} align="left" color={SOFT_GRAY} tracking={0} />
      </g>

      {/* clock & cash: free symbols in scene 7, panel icons afterwards */}
      <g transform={symbolsInScene7 ? '' : grp(PANEL.ay + PANEL.h / 2, aCy)} opacity={symIn}>
        <Clock x={clk.x} y={clk.y} r={clk.r} minute={minute} sw={mix(SW.art, SW.mini, toPanels)} />
      </g>
      <g transform={symbolsInScene7 ? '' : grp(PANEL.by + PANEL.h / 2, bCy)} opacity={symIn}>
        <CashPile x={csh.x} y={csh.y} w={csh.w} sw={mix(SW.art, SW.mini, toPanels)} />
      </g>

      <Marcus x={CX} y={GROUND + (1 - mIn) * 20} scale={M_SCALE} pose={look} sw={SW.hero} opacity={mIn} />

      {/* Scene 9 */}
      <Line runs="A OR B?" x={CX} y={352} size={140} weight={900} opacity={prog(f, CUE.aOrB, 6)} scale={settle(f, CUE.aOrB, 1.06, 8)} />
      <Line runs="WHY?" x={CX} y={1205} size={96} weight={900} color={C.green} opacity={whyT} scale={settle(f, CUE.why, 1.08, 8)} />
    </g>
  );
};

export const Video: React.FC = () => {
  const f = useCurrentFrame();
  const ready = useFontsReady();
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <Audio src={staticFile('narration.mp3')} />
      {ready ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
          <rect width={W} height={H} fill={C.bg} />
          <OptionA f={f} />
          <OptionB f={f} />
          <Choice f={f} />
          <Line runs="STACK WITH GIO" x={CX} y={1550} size={24} weight={800} tracking={0.22} color="#555555" />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
