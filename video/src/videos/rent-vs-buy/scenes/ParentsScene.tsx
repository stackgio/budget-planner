import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {GradCap, Paycheck, SpeechBubble, Stamp} from '../../../story/components/HomeProps';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {kf, shake, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {Chip, Kicker} from './shared';

const HouseIcon: React.FC<{w: number; color: string; style?: React.CSSProperties}> = ({w, color, style}) => (
	<svg viewBox="0 0 100 90" width={w} height={w * 0.9} style={{position: 'absolute', transform: 'translate(-50%,-50%)', ...style}}>
		<path d="M50,6 L94,44 H82 V86 H18 V44 H6 Z" fill={color} />
		<rect x="42" y="56" width="16" height="30" rx="2" fill="#FFFDF8" />
	</svg>
);

/**
 * L2–L7 — the parent advice. Bright editorial look. Life strip:
 * graduate → first paycheck → BUY A HOUSE; the parents' advice lives in a
 * speech bubble; "Roth IRA" gets one quick ghost beat, credit/money get
 * crossed out, then the bubble comes back louder.
 */
export const ParentsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tGrad = cue('L2', 'graduate');
	const tWork = cue('L2', 'working');
	const tL3 = cue('L3', 'stop');
	const tBuy = cue('L3', 'buy a house');
	const tFirst = cue('L4', 'first');
	const tHey = cue('L5', 'Hey,');
	const tRoth = cue('L5', 'Roth IRA');
	const tInvesting = cue('L5', 'investing."');
	const tL6 = cue('L6');
	const tCredit = cue('L6', 'credit');
	const tManage = cue('L6', 'manage');
	const tGon = cue('L6', "gon'");
	const tL7 = cue('L7');
	const tBuy2 = cue('L7', 'buy that house');

	const n1 = sp(frame, fps, tGrad - 4, 'bouncy');
	const n2 = sp(frame, fps, tWork - 4, 'bouncy');
	const n3 = sp(frame, fps, tBuy - 2, 'bouncy');
	const line12 = kf(frame, [tWork - 6, tWork + 6], [0, 1]);
	const line23 = kf(frame, [tBuy - 8, tBuy + 4], [0, 1]);

	// main bubble: in on L3, steps back during L5/L6, returns big on L7
	const bubIn = sp(frame, fps, tL3 - 8, 'bouncy');
	const back = kf(frame, [tHey - 6, tHey + 8], [0, 1]) * (1 - kf(frame, [tL7 - 8, tL7 + 4], [0, 1]));
	const loud = sp(frame, fps, tBuy2 - 2, 'heavy');
	const bubScale = (0.6 + 0.4 * bubIn) * (1 - back * 0.32) * (frame >= tBuy2 - 2 ? 1 + 0.08 * loud : 1);
	const bubY = 540;
	const showBuy = frame >= tBuy - 2;
	const showStop = frame >= tL3 - 6;
	const l7 = frame >= tL7 - 4;
	const sh = shake(frame, tBuy2, 12, 14);

	// ghost advice they never gave
	const roth = sp(frame, fps, tHey - 2, 'snappy') * (1 - kf(frame, [tL6 + 4, tL6 + 12], [0, 1]));
	const rothMark = kf(frame, [tRoth, tRoth + 8], [0, 1]);
	const credit = sp(frame, fps, tCredit - 3, 'snappy') * (1 - kf(frame, [tL7 - 10, tL7], [0, 1]));
	const manage = sp(frame, fps, tManage - 3, 'snappy') * (1 - kf(frame, [tL7 - 10, tL7], [0, 1]));

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg floorY={story.ground} />
			{/* life strip */}
			<div style={{position: 'absolute', left: 230, top: 330, width: 290, height: 6, background: P.line}}>
				<div style={{width: `${line12 * 100}%`, height: '100%', background: P.ink}} />
			</div>
			<div style={{position: 'absolute', left: 560, top: 330, width: 250, height: 6, background: P.line}}>
				<div style={{width: `${line23 * 100}%`, height: '100%', background: P.accent}} />
			</div>
			<div style={{opacity: n1, transform: `scale(${0.5 + 0.5 * n1})`, transformOrigin: '200px 320px'}}>
				<GradCap w={150} style={{left: 200, top: 315}} />
				<Kicker text="GRADUATE" color={P.muted} size={26} style={{left: 200, top: 390, transform: 'translateX(-50%)'}} />
			</div>
			<div style={{opacity: n2, transform: `scale(${0.5 + 0.5 * n2})`, transformOrigin: '540px 320px'}}>
				<Paycheck w={190} label="PAYCHECK" style={{left: 540, top: 318}} />
				<Kicker text="FIRST JOB" color={P.muted} size={26} style={{left: 540, top: 390, transform: 'translateX(-50%)'}} />
			</div>
			<div style={{opacity: n3, transform: `scale(${0.5 + 0.5 * n3})`, transformOrigin: '840px 320px'}}>
				<HouseIcon w={120} color={P.accent} style={{left: 840, top: 312}} />
				<Kicker text="BUY A HOUSE" color={P.accent} size={26} style={{left: 840, top: 390, transform: 'translateX(-50%)'}} />
			</div>

			{/* the parents' advice */}
			{bubIn > 0.01 && (
				<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
					<Kicker text="MOM & DAD" color={P.muted} size={30} style={{left: 110, top: bubY - 62, opacity: bubIn * (1 - back * 0.6)}} />
					<div style={{position: 'absolute', left: 90, top: bubY, transformOrigin: '0 0', transform: `scale(${bubScale})`, opacity: Math.min(1, bubIn * 1.6) * (1 - back * 0.55)}}>
						<SpeechBubble w={800} tail="bottom-right" palette={P}>
							{!l7 ? (
								<>
									<div style={{fontSize: 84, fontWeight: 900, letterSpacing: -2, color: P.ink, opacity: showStop ? 1 : 0}}>STOP RENTING.</div>
									<div style={{fontSize: 104, fontWeight: 900, letterSpacing: -3, color: P.accent, opacity: showBuy ? 1 : 0, transform: `translateY(${showBuy ? 0 : 20}px)`}}>BUY A HOUSE.</div>
								</>
							) : (
								<>
									<div style={{fontSize: 84, fontWeight: 900, letterSpacing: -2, color: P.ink}}>STOP RENTING.</div>
									<div style={{fontSize: 104, fontWeight: 900, letterSpacing: -3, color: P.accent, opacity: frame >= tBuy2 - 2 ? 1 : 0.25}}>BUY THAT HOUSE.</div>
								</>
							)}
						</SpeechBubble>
					</div>
					{frame < tHey - 4 && <Stamp text="#1 ADVICE" at={tFirst} color={P.danger} rot={-7} fontSize={52} style={{left: 760, top: bubY + 40}} />}
				</div>
			)}

			{/* what they DON'T say */}
			{roth > 0.01 && (
				<div style={{position: 'absolute', left: 110, top: 900, opacity: roth, transform: `scale(${0.85 + 0.15 * roth})`, transformOrigin: '0 50%'}}>
					<SpeechBubble w={620} dashed palette={P} fill="rgba(255,253,248,0.6)">
						<div style={{fontSize: 34, fontWeight: 800, letterSpacing: 3, color: P.muted}}>NEVER HEARD:</div>
						<div style={{fontSize: 72, fontWeight: 900, letterSpacing: -1, color: P.ink, position: 'relative', display: 'inline-block', opacity: kf(frame, [tRoth - 3, tRoth + 1], [0, 1]), transform: `scale(${0.7 + 0.3 * sp(frame, fps, tRoth - 3, 'bouncy')})`, transformOrigin: '0 50%'}}>
							<span style={{position: 'absolute', left: -8, right: -8, top: '16%', bottom: '6%', background: 'rgba(226,167,46,0.45)', transformOrigin: '0 50%', transform: `scaleX(${rothMark})`, borderRadius: 8}} />
							<span style={{position: 'relative'}}>ROTH IRA</span>
						</div>
						<div style={{fontSize: 44, fontWeight: 900, color: P.accent, marginTop: 6, opacity: kf(frame, [tInvesting - 3, tInvesting + 2], [0, 1])}}>+ START INVESTING</div>
					</SpeechBubble>
				</div>
			)}
			{credit > 0.01 && <Chip text="CREDIT" bg={P.paper} color={P.ink} size={56} strike={kf(frame, [tCredit + 8, tCredit + 16], [0, 1])} style={{left: 290, top: 960, opacity: credit, boxShadow: `0 10px 24px ${P.shadow}`}} />}
			{manage > 0.01 && <Chip text="MANAGING MONEY" bg={P.paper} color={P.ink} size={56} strike={kf(frame, [tGon - 6, tGon + 4], [0, 1])} style={{left: 380, top: 1120, opacity: manage, boxShadow: `0 10px 24px ${P.shadow}`}} />}

			<Marcus
				x={870}
				y={story.ground}
				scale={0.95}
				facing={-1}
				seed={3}
				track={[
					{at: 0, pose: 'relaxed', face: 'happy'},
					{at: tGrad - 4, pose: 'celebrate', face: 'joy', spring: 'bouncy'},
					{at: tWork + 6, pose: 'idle', face: 'happy'},
					{at: tL3, pose: 'worried', face: 'worried'},
					{at: tHey, pose: 'think', face: 'curious'},
					{at: tL6, pose: 'shrug', face: 'smug'},
					{at: tL7, pose: 'flinch', face: 'shock', spring: 'bouncy'},
				]}
			/>
			<Sfx at={tGrad - 4} name="pop" volume={0.3} />
			<Sfx at={tL3 - 8} name="whoosh-soft" volume={0.3} />
			<Sfx at={tFirst} name="stamp" volume={0.3} />
			<Sfx at={tCredit + 8} name="tick" volume={0.3} />
			<Sfx at={tBuy2} name="thud" volume={0.35} />
		</AbsoluteFill>
	);
};
