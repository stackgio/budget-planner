import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {ScreenshotCrop} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {DASH} from '../assets';

// Dashboard panel (two crops of the real screenshot at one shared scale)
const PANEL_W = 860;
const PANEL_LEFT = 100;
const S = PANEL_W / DASH.natural.w;
const TOP_TOP = 520;
const TOP_H = DASH.top.h * S;
const AREA_TOP = TOP_TOP + TOP_H + 18;
const AREA_H = DASH.cardArea.h * S;
// where the card sits inside the dashboard panel — the swipe card lands exactly here (match cut)
const CARD = {
	x: PANEL_LEFT + (DASH.card.x - DASH.cardArea.x) * S,
	y: AREA_TOP + (DASH.card.y - DASH.cardArea.y) * S,
	w: DASH.card.w * S,
	h: DASH.card.h * S,
};

// Card reader (swipe)
const SWIPE_W = 560;
const SWIPE_H = (DASH.card.h / DASH.card.w) * SWIPE_W;
const SWIPE_TOP = 640;
const LIP_TOP = SWIPE_TOP + SWIPE_H * 0.7;
const SWIPE_END = 14; // frames: the swipe is done inside the first half-second

const CardReader: React.FC<{part: 'back' | 'front'; drop: number; led: number}> = ({part, drop, led}) => {
	const style: React.CSSProperties = {position: 'absolute', left: 110, width: 860, transform: `translateY(${drop * 420}px)`, opacity: 1 - drop};
	if (part === 'back')
		return <div style={{...style, top: LIP_TOP - 26, height: 150, borderRadius: 26, background: 'linear-gradient(180deg,#24272D 0%,#15171B 100%)', boxShadow: '0 30px 60px rgba(0,0,0,0.6)'}} />;
	return (
		<div style={{...style, top: LIP_TOP, height: 124, borderRadius: '10px 10px 24px 24px', background: 'linear-gradient(180deg,#2E3238 0%,#1A1C21 40%,#121417 100%)', borderTop: '2px solid #3A3F46'}}>
			<div style={{position: 'absolute', right: 40, top: 46, width: 18, height: 18, borderRadius: 9, background: led > 0 ? P.accent : '#3A3F46', boxShadow: led > 0 ? `0 0 ${18 * led}px ${P.accent}` : undefined}} />
			<div style={{position: 'absolute', left: 40, top: 52, width: 120, height: 6, borderRadius: 3, background: '#2A2E35'}} />
		</div>
	);
};

/**
 * HOOK — frame 0: locked headline + the real gold card already in a dark reader.
 * The card swipes through (masked by the reader lip) in the first half-second, one soft beep,
 * then lands exactly where it sits on the real dashboard → match cut on "finally got approved".
 * Balance and available credit are never in frame.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tCut = cue('L1', 'finally');
	const tGold = cue('L2', 'gold');
	const tL3 = cue('L3');
	const tBest = cue('L3', 'best');

	// swipe
	const swipe = kf(frame, [0, SWIPE_END], [0, 1], E.inOut);
	const speed = Math.abs(kf(frame, [0, SWIPE_END / 2, SWIPE_END], [0, 1, 0]));
	const led = kf(frame, [SWIPE_END - 1, SWIPE_END + 3], [0, 1]);
	const drop = kf(frame, [SWIPE_END + 6, SWIPE_END + 18], [0, 1], E.in);
	const land = sp(frame, fps, SWIPE_END + 14, 'smooth');
	const sx = mix(330, 750, swipe);
	const cx = mix(sx, CARD.x + CARD.w / 2, land);
	const cy = mix(SWIPE_TOP + SWIPE_H / 2, CARD.y + CARD.h / 2, land);
	const cw = mix(SWIPE_W, CARD.w, land);
	const ch = (DASH.card.h / DASH.card.w) * cw;

	const showDash = frame >= tCut;
	const push = kf(frame, [tL3, tL3 + 4.8 * fps], [0, 1], E.inOut);
	const underline = sp(frame, fps, tGold, 'snappy');
	const shine = kf(frame, [tBest - 4, tBest + 22], [0, 1], E.inOut);
	const label = {x: PANEL_LEFT + DASH.goldLabel.x * S, y: TOP_TOP + DASH.goldLabel.y * S, w: DASH.goldLabel.w * S, h: DASH.goldLabel.h * S};

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={980} light={1.15} />
			<div style={{position: 'absolute', left: story.safe.left - 12, right: story.safe.right - 36, top: story.safe.top + 14}}>
				<KineticText text="THIS CREDIT CARD PAYS ME TO INVEST 💳" at={-14} mode="none" fontSize={92} color={P.ink} colors={{invest: P.accent}} align="center" lineHeight={1.04} />
			</div>

			{!showDash && (
				<>
					{drop < 1 && <CardReader part="back" drop={drop} led={led} />}
					<div
						style={{
							position: 'absolute',
							left: cx - cw / 2,
							top: cy - ch / 2,
							width: cw,
							height: ch,
							borderRadius: DASH.cardRadius * (cw / DASH.card.w),
							boxShadow: land > 0.2 ? `0 40px 90px rgba(0,0,0,${0.7 * land})` : undefined,
							filter: speed > 0.3 ? `blur(${(speed - 0.3) * 3}px)` : undefined,
						}}
					>
						<ScreenshotCrop src={DASH.src} natural={DASH.natural} region={DASH.card} w={cw} radius={DASH.cardRadius * (cw / DASH.card.w)} />
					</div>
					{drop < 1 && <CardReader part="front" drop={drop} led={led} />}
				</>
			)}

			{showDash && (
				<div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 0.035 * push})`, transformOrigin: '540px 900px'}}>
					<div style={{position: 'absolute', left: PANEL_LEFT, top: TOP_TOP}}>
						<ScreenshotCrop src={DASH.src} natural={DASH.natural} region={DASH.top} w={PANEL_W} radius={24} style={{position: 'relative'}} />
					</div>
					<div style={{position: 'absolute', left: label.x + label.w * 0.05, top: label.y + label.h + 8, height: 6, borderRadius: 3, width: label.w * 0.9 * underline, background: P.accent}} />
					<div style={{position: 'absolute', left: PANEL_LEFT, top: AREA_TOP}}>
						<ScreenshotCrop src={DASH.src} natural={DASH.natural} region={DASH.cardArea} w={PANEL_W} radius={24} style={{position: 'relative'}}>
							{shine > 0 && shine < 1 && (
								<div
									style={{
										position: 'absolute',
										left: CARD.x - PANEL_LEFT,
										top: CARD.y - AREA_TOP,
										width: CARD.w,
										height: CARD.h,
										borderRadius: DASH.cardRadius * S,
										background: `linear-gradient(105deg, rgba(255,255,255,0) ${shine * 140 - 40}%, rgba(255,255,255,0.2) ${shine * 140 - 25}%, rgba(255,255,255,0) ${shine * 140 - 10}%)`,
									}}
								/>
							)}
						</ScreenshotCrop>
					</div>
				</div>
			)}
			<Sfx at={SWIPE_END - 1} name="beep" volume={0.3} />
		</AbsoluteFill>
	);
};
