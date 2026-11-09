import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp, wobble} from '../../../story/lib/motion';
import {C, FONT} from '../look';
import {SunBg} from './HalfScene';

const BANDS = [
	{top: 236, h: 360},
	{top: 620, h: 360},
	{top: 1004, h: 380},
];

/** Illustrative only: a realistic-looking but unlabelled path (no values, no returns claimed). */
const SERIES = Array.from({length: 48}, (_, i) => 0.18 + i * 0.012 + 0.05 * Math.sin(i * 0.9) + 0.035 * Math.sin(i * 2.3 + 1) - (i > 20 && i < 27 ? 0.06 : 0));

const SaveArt: React.FC<{p: number; frame: number}> = ({p, frame}) => {
	const fill = kf(p, [0, 1], [0.08, 0.64], E.out);
	return (
		<AbsoluteFill style={{background: '#FFFFFF'}}>
			<div style={{position: 'absolute', left: 60, right: 60, top: 220, height: 56, borderRadius: 28, background: '#EFEDE7', overflow: 'hidden'}}>
				<div style={{width: `${fill * 100}%`, height: '100%', borderRadius: 28, background: `linear-gradient(90deg, ${C.greenDeep}, ${C.green})`}} />
			</div>
			{[0.25, 0.5, 0.75].map((m) => (
				<div key={m} style={{position: 'absolute', left: 60 + (900 - 120) * m, top: 206, width: 3, height: 84, background: fill > m ? 'rgba(255,255,255,0.8)' : '#D9D6CE'}} />
			))}
			<div style={{position: 'absolute', left: 60, top: 300, fontFamily: FONT, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: '#8A857B'}}>EMERGENCY FUND</div>
			<div style={{position: 'absolute', right: 60, top: 300, fontFamily: FONT, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: C.greenDeep, opacity: 0.6 + 0.4 * Math.sin(frame * 0.2)}}>GROWING</div>
		</AbsoluteFill>
	);
};

const InvestArt: React.FC<{p: number}> = ({p}) => {
	const w = 780;
	const h = 150;
	const n = Math.max(2, Math.round(SERIES.length * kf(p, [0, 1], [0.05, 1], E.out)));
	const pts = SERIES.slice(0, n).map((v, i) => [60 + (i / (SERIES.length - 1)) * w, 60 + h - v * h * 1.1] as const);
	const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
	const area = `${d} L${pts[pts.length - 1][0]} ${60 + h} L60 ${60 + h} Z`;
	return (
		<AbsoluteFill style={{background: '#121315'}}>
			<svg width={900} height={380} style={{position: 'absolute', left: 0, top: 110}}>
				<defs>
					<linearGradient id="inv-fill" x1="0" x2="0" y1="0" y2="1">
						<stop offset="0" stopColor={C.green} stopOpacity={0.25} />
						<stop offset="1" stopColor={C.green} stopOpacity={0} />
					</linearGradient>
				</defs>
				{[0, 1, 2, 3].map((i) => (
					<line key={i} x1={60} x2={840} y1={60 + (i * h) / 3} y2={60 + (i * h) / 3} stroke="rgba(255,255,255,0.07)" strokeWidth={2} />
				))}
				<path d={area} fill="url(#inv-fill)" />
				<path d={d} stroke={C.green} strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
				<circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={9} fill={C.green} />
			</svg>
			<div style={{position: 'absolute', right: 56, top: 64, fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: C.gray, textAlign: 'right', lineHeight: 1.4}}>ILLUSTRATIVE<br />NO RETURNS SHOWN</div>
		</AbsoluteFill>
	);
};

/** Airplane window at golden hour. Drawn on a full 1080×1920 canvas so it can expand to full frame. */
const TravelArt: React.FC<{frame: number}> = ({frame}) => {
	const drift = frame * 0.9;
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #EEE9E1 0%, #DCD5CA 100%)'}}>
			<div style={{position: 'absolute', left: 540 - 330, top: 960 - 460, width: 660, height: 920, borderRadius: 330, background: '#CFC7BA', boxShadow: 'inset 0 20px 50px rgba(0,0,0,0.18)'}} />
			<div style={{position: 'absolute', left: 540 - 270, top: 960 - 400, width: 540, height: 800, borderRadius: 270, overflow: 'hidden', boxShadow: 'inset 0 0 0 10px #B9B0A2, 0 0 0 4px #E9E3D9'}}>
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #3E6FB0 0%, #8FB5DC 38%, #F7C99A 66%, #F59E6B 78%, #6F7FA3 100%)'}} />
				<div style={{position: 'absolute', left: -200, right: -200, top: 520, height: 60, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,236,200,0.95) 0%, rgba(255,236,200,0) 70%)'}} />
				{/* clouds */}
				{Array.from({length: 9}).map((_, i) => {
					const x = ((i * 173 - drift * (0.6 + (i % 3) * 0.25)) % 900 + 900) % 900 - 180;
					const y = 560 + (i % 4) * 46;
					return <div key={i} style={{position: 'absolute', left: x, top: y, width: 300 + (i % 3) * 80, height: 70 + (i % 2) * 30, borderRadius: 60, background: 'rgba(255,248,240,0.85)', filter: 'blur(14px)'}} />;
				})}
				<div style={{position: 'absolute', left: 0, right: 0, top: 640, bottom: 0, background: 'linear-gradient(180deg, rgba(255,240,225,0.7) 0%, rgba(160,175,205,0.9) 100%)', filter: 'blur(6px)'}} />
				{/* wing */}
				<div style={{position: 'absolute', left: 120, top: 600, width: 600, height: 70, background: 'linear-gradient(180deg, #D7DCE3 0%, #8E96A2 100%)', transform: `rotate(-9deg) translateY(${wobble(frame, 3, 0.5, 3)}px)`, transformOrigin: '0 0', borderRadius: '0 30px 8px 0'}} />
				{/* glass reflection */}
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 35%)'}} />
			</div>
		</AbsoluteFill>
	);
};

export const MontageScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tSave = cue('L10', 'saving');
	const tInvest = cue('L10', 'investing');
	const tTravel = cue('L10', 'traveling');
	const tEnjoy = cue('L10', 'enjoying');
	const ats = [tSave, tInvest, tTravel];
	const expand = sp(frame, fps, tEnjoy - 6, 'smooth');

	const band = (i: number) => {
		const s = sp(frame, fps, ats[i] - 4, 'snappy');
		const o = frame < ats[i] - 4 ? 0 : prog(frame, ats[i] - 4, 5);
		return {s, o};
	};
	const labels = ['SAVE', 'INVEST', 'TRAVEL'];
	const labelColor = [C.ink, C.white, C.white];

	// travel band → full frame
	const b = BANDS[2];
	const clipTop = mix(b.top, 0, expand);
	const clipH = mix(b.h, 1920, expand);
	const clipL = mix(90, 0, expand);
	const clipW = mix(900, 1080, expand);
	const artScale = mix(0.4, 1.05, expand);
	const artCy = mix(b.top + b.h / 2, 900, expand);

	return (
		<AbsoluteFill>
			<SunBg sun={1} />
			{[0, 1].map((i) => {
				const {s, o} = band(i);
				const B = BANDS[i];
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: 90,
							top: B.top,
							width: 900,
							height: B.h,
							borderRadius: 34,
							overflow: 'hidden',
							opacity: o * (1 - expand),
							transform: `translateX(${(1 - s) * 140}px)`,
							boxShadow: '0 30px 60px rgba(90,60,20,0.16)',
						}}
					>
						{i === 0 ? <SaveArt p={prog(frame, tSave, 40)} frame={frame} /> : <InvestArt p={prog(frame, tInvest, 36)} />}
						<div style={{position: 'absolute', left: 60, top: 46, fontFamily: FONT, fontWeight: 900, fontSize: 110, letterSpacing: -3, color: labelColor[i], lineHeight: 1}}>{labels[i]}</div>
					</div>
				);
			})}
			{(() => {
				const {s, o} = band(2);
				return (
					<div
						style={{
							position: 'absolute',
							left: clipL,
							top: clipTop,
							width: clipW,
							height: clipH,
							borderRadius: 34 * (1 - expand),
							overflow: 'hidden',
							opacity: o,
							transform: `translateX(${(1 - s) * 140}px)`,
							boxShadow: '0 30px 60px rgba(90,60,20,0.16)',
							background: 'linear-gradient(180deg, #EEE9E1 0%, #DCD5CA 100%)',
						}}
					>
						<div style={{position: 'absolute', left: -clipL, top: -clipTop, width: 1080, height: 1920}}>
							<div style={{position: 'absolute', inset: 0, transform: `translateY(${artCy - 960}px) scale(${artScale})`, transformOrigin: '540px 960px'}}>
								<TravelArt frame={frame} />
							</div>
						</div>
						<div style={{position: 'absolute', left: 60 * (1 - expand) + 90 * expand, top: 46 + expand * 230, fontFamily: FONT, fontWeight: 900, fontSize: 110, letterSpacing: -3, color: C.ink, lineHeight: 1, }}>
							TRAVEL
						</div>
					</div>
				);
			})()}
		</AbsoluteFill>
	);
};
