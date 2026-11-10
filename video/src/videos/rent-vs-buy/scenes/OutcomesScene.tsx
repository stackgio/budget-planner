import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {kf, shake, sp} from '../../../story/lib/motion';
import {cinematic as C, story} from '../../../story/theme';
import {AMBER, EstimateCard} from './shared';

const Phone: React.FC<{color: string}> = ({color}) => (
	<svg width="76" height="76" viewBox="0 0 24 24">
		<path
			d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
			fill={color}
		/>
	</svg>
);

/**
 * L11–L12 — same broken AC, two outcomes. Renter: CALL LANDLORD (their
 * responsibility). Owner: CALL AC COMPANY, and the illustrated $5,000
 * estimate lands exactly on "YOUR name".
 */
export const OutcomesScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tRent = cue('L11', 'renting');
	const tCall = cue('L11', 'call');
	const tOwn = cue('L12', 'own');
	const tCo = cue('L12', 'AC company,');
	const tYour = cue('L12', 'your');
	const rent = sp(frame, fps, tRent - 6, 'bouncy');
	const landlord = sp(frame, fps, tCall - 4, 'snappy');
	const own = sp(frame, fps, tOwn - 6, 'bouncy');
	const company = sp(frame, fps, tCo - 4, 'snappy');
	const est = sp(frame, fps, tYour - 7, 'heavy');
	const dimPanels = kf(frame, [tYour - 8, tYour], [1, 0.22]);
	const sh = shake(frame, tYour, 12, 12);
	const panel: React.CSSProperties = {position: 'absolute', left: story.safe.left, width: 1080 - story.safe.left - story.safe.right, borderRadius: 32, background: 'rgba(27,30,35,0.86)', border: `2px solid ${C.line}`, padding: '34px 40px'};
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg warm lightX={540} lightY={760} light={1.2} />
			<AbsoluteFill style={{background: 'radial-gradient(1000px 1200px at 540px 800px, rgba(255,160,60,0.22) 0%, rgba(0,0,0,0) 75%)'}} />
			<div style={{opacity: dimPanels}}>
				<div style={{...panel, top: 230, opacity: rent, transform: `translateY(${(1 - rent) * 40}px)`}}>
					<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 5, color: C.muted}}>IF YOU RENT</div>
					<div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 14, opacity: landlord, transform: `translateX(${(1 - landlord) * -30}px)`}}>
						<Phone color={C.accent} />
						<div style={{fontSize: 76, fontWeight: 900, letterSpacing: -1, color: C.ink}}>CALL LANDLORD</div>
					</div>
					<div style={{fontSize: 36, fontWeight: 700, color: C.body, marginTop: 14, opacity: landlord}}>When the repair is their responsibility.</div>
				</div>
				<div style={{...panel, top: 690, opacity: own, transform: `translateY(${(1 - own) * 40}px)`, borderColor: 'rgba(255,181,71,0.45)'}}>
					<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 5, color: AMBER}}>IF YOU OWN</div>
					<div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 14, opacity: company, transform: `translateX(${(1 - company) * -30}px)`}}>
						<Phone color={AMBER} />
						<div style={{fontSize: 64, fontWeight: 900, letterSpacing: -1, color: C.ink}}>CALL AC COMPANY</div>
					</div>
					<div style={{fontSize: 36, fontWeight: 700, color: C.body, marginTop: 14, opacity: company}}>The bill comes to you.</div>
				</div>
			</div>
			{frame >= tYour - 8 && (
				<EstimateCard w={640} owner={kf(frame, [tYour + 2, tYour + 14], [0, 1])} style={{left: 540 + sh.x, top: 840 + sh.y + (1 - est) * 700, transform: `translate(-50%,-50%) rotate(${-3 + (1 - est) * 8}deg)`}} />
			)}
			<Sfx at={tCall - 4} name="click" volume={0.3} />
			<Sfx at={tCo - 4} name="click" volume={0.3} />
			<Sfx at={tYour - 2} name="paper" volume={0.4} />
		</AbsoluteFill>
	);
};
