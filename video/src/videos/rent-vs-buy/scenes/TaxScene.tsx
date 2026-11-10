import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {Stamp} from '../../../story/components/HomeProps';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';

/** Simplified Florida delinquency path: §197.432 certificate sale, §197.502 deed application (2+ yrs), §197.522 notice. */
const STEPS = [{text: 'UNPAID TAXES'}, {text: 'TAX CERTIFICATE SOLD'}, {text: 'DEED APPLICATION (2+ YRS)'}, {text: 'NOTICE TO OWNER'}, {text: 'TAX DEED SALE (AUCTION)'}];

/**
 * L20–L21 — MORTGAGE PAID OFF stamp, then the PROPERTY TAX bill still slides
 * in. On "Florida": unpaid taxes can lead to a tax deed sale, shown as the
 * delinquency process it is (not overnight). Brief and matter-of-fact.
 */
export const TaxScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tMort = cue('L20', 'mortgage,');
	const tTax = cue('L20', 'property tax bill');
	const tFl = cue('L21', 'Florida,');
	const tUnpaid = cue('L21', 'unpaid');
	const tLong = cue('L21', 'long enough,');
	const tAuction = cue('L21', 'auctioned');
	const doc = sp(frame, fps, 0, 'bouncy');
	const docAway = kf(frame, [tTax - 6, tTax + 8], [0, 1]);
	const bill = sp(frame, fps, tTax - 4, 'heavy');
	const up = prog(frame, tFl - 4, 16, E.inOut);
	const note = sp(frame, fps, tFl + 2, 'snappy');
	const tEnough = cue('L21', 'enough,');
	const tActually = cue('L21', 'actually');
	const steps = [tUnpaid - 3, tLong - 2, tEnough - 2, tActually - 3, tAuction - 3].map((t) => sp(frame, fps, t, 'snappy'));
	const line = kf(frame, [tUnpaid, tAuction - 2], [0, 1]);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			{/* paid-off mortgage */}
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: (1 - docAway * 0.8) * (1 - up) * Math.min(1, doc * 2), transform: `translate(${-docAway * 160}px, ${(1 - doc) * 80 - docAway * 60}px) scale(${1 - docAway * 0.2})`, transformOrigin: '540px 700px'}}>
				<div style={{position: 'absolute', left: 280, top: 400, width: 520, height: 600, background: '#fff', borderRadius: 22, boxShadow: `0 24px 40px ${P.shadow}`, padding: 46, transform: 'rotate(-2deg)'}}>
					<div style={{fontSize: 38, fontWeight: 900, letterSpacing: 4, color: P.ink}}>MORTGAGE</div>
					{[0.9, 0.7, 0.82, 0.6, 0.76, 0.5].map((f, i) => (
						<div key={i} style={{height: 14, width: `${f * 100}%`, background: P.line, borderRadius: 7, marginTop: 34}} />
					))}
				</div>
				<Stamp text="MORTGAGE PAID OFF" at={tMort - 2} color={P.accent} rot={-9} fontSize={58} style={{left: 540, top: 720}} />
			</div>
			{/* property tax bill */}
			{frame >= tTax - 6 && (
				<div style={{position: 'absolute', left: 540, top: 0, transform: `translate(${(1 - bill) * 700}px, ${700 - up * 330}px) scale(${1 - up * 0.28}) rotate(${3 - up * 3}deg)`, transformOrigin: '0 0'}}>
					<div style={{position: 'absolute', left: -310, top: -240, width: 620, background: '#fff', borderRadius: 24, boxShadow: `0 28px 50px ${P.shadow}`, overflow: 'hidden'}}>
						<div style={{background: P.danger, color: '#fff', padding: '22px 36px', fontSize: 46, fontWeight: 900, letterSpacing: 4}}>PROPERTY TAX</div>
						<div style={{padding: '28px 36px 34px'}}>
							<div style={{fontSize: 36, fontWeight: 800, color: P.ink}}>Due every year</div>
							{[0.85, 0.6].map((f, i) => (
								<div key={i} style={{height: 14, width: `${f * 100}%`, background: P.line, borderRadius: 7, marginTop: 26}} />
							))}
							<div style={{marginTop: 26, fontSize: 30, fontWeight: 800, letterSpacing: 3, color: P.muted}}>MORTGAGE OR NOT</div>
						</div>
					</div>
				</div>
			)}
			{/* Florida: not overnight — steps and notice first (Fla. Stat. ch. 197) */}
			{frame >= tFl && (
				<>
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 640, opacity: note, transform: `translateY(${(1 - note) * 24}px)`}}>
						<div style={{fontSize: 36, fontWeight: 900, letterSpacing: 5, color: P.accentDeep}}>FLORIDA</div>
						<div style={{fontSize: 56, fontWeight: 900, letterSpacing: -1, lineHeight: 1.1, color: P.ink, marginTop: 6}}>Unpaid property taxes can lead to a tax deed sale</div>
						<div style={{fontSize: 38, fontWeight: 800, color: '#4A4F57', marginTop: 10}}>after additional steps and notice.</div>
					</div>
					<div style={{position: 'absolute', left: story.safe.left + 27, top: 940, width: 6, height: 74 * 4 * line, background: P.ink, borderRadius: 3}} />
					{STEPS.map((st, i) => (
						<div key={st.text} style={{position: 'absolute', left: story.safe.left, top: 912 + i * 74, display: 'flex', alignItems: 'center', gap: 22, opacity: steps[i], transform: `translateX(${(1 - steps[i]) * -40}px)`}}>
							<div style={{width: 60, height: 60, borderRadius: 30, background: i === STEPS.length - 1 ? P.danger : P.ink, color: '#fff', fontSize: 32, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
							<div style={{fontSize: 42, fontWeight: 900, letterSpacing: 0.5, color: i === STEPS.length - 1 ? P.danger : P.ink, whiteSpace: 'nowrap'}}>{st.text}</div>
						</div>
					))}
				</>
			)}
			<Sfx at={tMort - 2} name="stamp" volume={0.4} />
			<Sfx at={tTax - 4} name="paper" volume={0.35} />
		</AbsoluteFill>
	);
};
