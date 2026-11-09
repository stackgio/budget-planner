import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {C, FONT, Label} from '../look';

/** Generic policy document — no insurer name, no personal data. */
const InsuranceShot: React.FC<{t: number}> = ({t}) => {
	const drift = t * 0.25;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 60% 35%, #2A2622 0%, #121110 60%, #0A0A0A 100%)'}}>
			<div
				style={{
					position: 'absolute',
					left: 170,
					top: 300 - drift,
					width: 720,
					height: 940,
					background: 'linear-gradient(160deg, #FBFAF7 0%, #EDEAE3 100%)',
					borderRadius: 8,
					transform: 'rotate(-5deg)',
					boxShadow: '0 50px 90px rgba(0,0,0,0.6)',
					padding: 60,
					boxSizing: 'border-box',
					fontFamily: FONT,
				}}
			>
				<div style={{fontWeight: 800, fontSize: 30, letterSpacing: 6, color: '#2B2E33'}}>AUTO POLICY</div>
				<div style={{fontWeight: 600, fontSize: 24, letterSpacing: 3, color: '#8A8D92', marginTop: 10}}>DECLARATIONS PAGE</div>
				<div style={{height: 3, background: '#2B2E33', margin: '34px 0 30px'}} />
				{['LIABILITY', 'COLLISION', 'COMPREHENSIVE', 'UNINSURED MOTORIST'].map((r, i) => (
					<div key={r} style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 30}}>
						<div style={{width: 34, height: 34, border: '3px solid #2B2E33', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<div style={{width: 16, height: 16, background: '#2B2E33', borderRadius: 3, opacity: prog(t, 6 + i * 4, 6)}} />
						</div>
						<div style={{fontWeight: 700, fontSize: 26, letterSpacing: 2, color: '#2B2E33'}}>{r}</div>
					</div>
				))}
				{[520, 600, 440, 560, 380, 500].map((w, i) => (
					<div key={i} style={{width: w, height: 14, borderRadius: 7, background: '#D8D5CE', marginTop: 22}} />
				))}
				<div style={{position: 'absolute', left: 60, bottom: 80, width: 300, height: 3, background: '#9A9DA2'}} />
				<div style={{position: 'absolute', left: 60, bottom: 46, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: '#8A8D92'}}>MONTHLY PREMIUM</div>
			</div>
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'}} />
		</AbsoluteFill>
	);
};

/** Fuel nozzle in the hook car's filler — pump readout counts gallons, never dollars. */
const GasShot: React.FC<{t: number}> = ({t}) => {
	const gallons = 4.2 + t * 0.09;
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #1B1D21 0%, #0C0D0F 100%)'}}>
			{/* canopy light */}
			<div style={{position: 'absolute', left: -100, right: -100, top: 120, height: 40, background: 'rgba(235,242,255,0.75)', filter: 'blur(10px)'}} />
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 40% at 50% 10%, rgba(220,232,255,0.22) 0%, rgba(0,0,0,0) 70%)'}} />
			<div style={{position: 'absolute', inset: 0, transform: `translateX(${-t * 0.6}px)`}}>
				<Car id="gascar" variant="luxury" paint={PAINTS.cold} x={1330} y={1178} w={2600} lights={0.6} reflection={0} sheen={0.2 + t * 0.004} sheenAmt={0.35} />
				<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<circle cx={420} cy={780} r={74} fill="#050506" stroke="#2C3036" strokeWidth={6} />
					<circle cx={420} cy={780} r={30} fill="#1C1E22" />
					{/* hose + nozzle */}
					<path d="M640 120 C700 420 760 620 600 760" stroke="#0B0B0C" strokeWidth={42} fill="none" strokeLinecap="round" />
					<path d="M640 120 C700 420 760 620 600 760" stroke="rgba(255,255,255,0.08)" strokeWidth={6} fill="none" transform="translate(-10,0)" />
					<g transform="translate(600,760) rotate(28)">
						<rect x={-40} y={-60} width={170} height={110} rx={26} fill="#1A1B1E" />
						<rect x={-40} y={-60} width={170} height={20} rx={10} fill="rgba(255,255,255,0.10)" />
						<rect x={-210} y={-14} width={190} height={30} rx={10} fill="#3A3D42" />
						<rect x={-210} y={-14} width={190} height={8} rx={4} fill="rgba(255,255,255,0.25)" />
						<path d="M20 50 Q60 120 120 60" stroke="#26282C" strokeWidth={14} fill="none" />
					</g>
				</svg>
			</div>
			{/* pump readout */}
			<div style={{position: 'absolute', right: 120, top: 260, width: 330, padding: '22px 28px', borderRadius: 20, background: 'rgba(8,10,12,0.85)', border: '2px solid rgba(255,255,255,0.12)', fontFamily: FONT}}>
				<Label size={24} color={C.gray}>Gallons</Label>
				<div style={{fontWeight: 800, fontSize: 76, color: '#E8F1FF', fontVariantNumeric: 'tabular-nums', letterSpacing: 2, marginTop: 6}}>{gallons.toFixed(3)}</div>
			</div>
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)'}} />
		</AbsoluteFill>
	);
};

/** Mechanic's wrench on the hook car's front wheel, under warm shop light. */
const ShopShot: React.FC<{t: number}> = ({t}) => {
	const turn = kf(t, [4, 22], [-30, 40], E.inOut);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 50% at 45% 30%, #3A3026 0%, #17140F 55%, #0A0908 100%)'}}>
			<div style={{position: 'absolute', left: 0, right: 0, top: 150, height: 30, background: 'rgba(255,214,160,0.6)', filter: 'blur(12px)'}} />
			<div style={{position: 'absolute', inset: 0, transform: `scale(${1 + t * 0.002})`, transformOrigin: '560px 860px'}}>
				<Car id="shopcar" variant="luxury" paint={PAINTS.dusk} x={-415} y={1064} w={3000} lights={0} reflection={0} sheen={0.75} sheenAmt={0.3} spin={0} shadow={0} />
				<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<g transform={`translate(560,860) rotate(${turn})`}>
						<g transform="translate(0,-72)">
							<rect x={-24} y={-24} width={48} height={48} rx={8} fill="#2A2D31" />
							<rect x={-22} y={0} width={44} height={560} rx={20} fill="url(#wrench)" />
							<circle cx={0} cy={0} r={40} fill="none" stroke="#8D949C" strokeWidth={22} />
						</g>
					</g>
					<defs>
						<linearGradient id="wrench" x1="0" x2="1">
							<stop offset="0" stopColor="#6F767E" />
							<stop offset="0.5" stopColor="#D5DADF" />
							<stop offset="1" stopColor="#6F767E" />
						</linearGradient>
					</defs>
				</svg>
			</div>
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'}} />
		</AbsoluteFill>
	);
};

const SHOTS = [
	{C: InsuranceShot, label: 'Insurance'},
	{C: GasShot, label: 'Gas'},
	{C: ShopShot, label: 'Maintenance'},
];

export const HiddenScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const starts = [0, cue('L5', 'gas') - 2, cue('L5', 'maintenance') - 2];
	const labelAt = [cue('L5', 'insurance'), cue('L5', 'gas'), cue('L5', 'maintenance')];
	const tAll = cue('L5', 'all') - 2;
	const cur = frame >= starts[2] ? 2 : frame >= starts[1] ? 1 : 0;
	const collapse = sp(frame, fps, tAll, 'smooth');

	// ── full-frame cuts ──
	const shotLocal = frame - starts[cur];
	const punch = 1.07 - 0.07 * prog(shotLocal, 0, 10, E.out);
	const {C: Shot} = SHOTS[cur];

	// ── "all that": three tiles ──
	const tileW = 290;
	const tileH = 516;
	const tileScale = tileW / 1080;
	const tiles = SHOTS.map((s, i) => {
		const x = 90 + i * (tileW + 20);
		const y = 470;
		return {x, y, ...s};
	});

	return (
		<AbsoluteFill style={{background: C.black}}>
			{collapse < 0.999 && (
				<AbsoluteFill
					style={{
						transform: `translate(${mix(0, tiles[2].x, collapse)}px, ${mix(0, tiles[2].y, collapse)}px) scale(${mix(1, tileScale, collapse)})`,
						transformOrigin: '0 0',
						borderRadius: 60 * collapse,
						overflow: 'hidden',
					}}
				>
					<AbsoluteFill style={{transform: `scale(${punch})`}}>
						<Shot t={shotLocal} />
					</AbsoluteFill>
					<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 700, background: 'linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.85) 100%)'}} />
					<div
						style={{
							position: 'absolute',
							left: 90,
							top: 1170,
							fontFamily: FONT,
							fontWeight: 900,
							fontSize: 104,
							letterSpacing: -3,
							color: C.white,
							textTransform: 'uppercase',
							opacity: (frame >= labelAt[cur] - 2 ? prog(frame, labelAt[cur] - 2, 5) : 0) * (1 - Math.min(1, collapse * 3)),
							transform: `translateX(${(1 - prog(frame, labelAt[cur] - 2, 10)) * -30}px)`,
						}}
					>
						{SHOTS[cur].label}
					</div>
					<div style={{position: 'absolute', left: 94, top: 1130, fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: C.red, opacity: (frame >= labelAt[cur] - 2 ? 1 : 0) * (1 - Math.min(1, collapse * 3))}}>
						+ ON TOP OF THE $750
					</div>
				</AbsoluteFill>
			)}
			{collapse > 0.001 &&
				tiles.map((tile, i) => {
					const isLast = i === 2;
					const o = isLast ? (collapse >= 0.999 ? 1 : 0) : prog(frame, tAll + 2 + i * 3, 10);
					const s = isLast ? 1 : 0.9 + 0.1 * sp(frame, fps, tAll + 2 + i * 3, 'snappy');
					return (
						<div key={i} style={{position: 'absolute', left: tile.x, top: tile.y, width: tileW, opacity: o, transform: `scale(${s})`}}>
							<div style={{width: tileW, height: tileH, borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)'}}>
								<div style={{width: 1080, height: 1920, transform: `scale(${tileScale})`, transformOrigin: '0 0', position: 'absolute'}}>
									<tile.C t={i === 2 ? frame - starts[2] : 40} />
								</div>
							</div>
							<div style={{marginTop: 24, textAlign: 'center'}}>
								<Label size={28} color={C.white}>{tile.label}</Label>
							</div>
						</div>
					);
				})}
			{collapse > 0.001 && (
				<div style={{position: 'absolute', left: 0, right: 0, top: 1110, textAlign: 'center', opacity: prog(frame, tAll + 10, 8)}}>
					<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 84, letterSpacing: -2, color: C.white}}>
						<span style={{color: C.red}}>+</span> ALL OF THAT
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};
