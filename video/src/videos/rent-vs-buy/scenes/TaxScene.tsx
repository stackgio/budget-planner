import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {Stamp} from '../../../story/components/HomeProps';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';

const STEPS = [
	{x: 220, l1: 'UNPAID', l2: 'TAXES'},
	{x: 540, l1: 'TAX', l2: 'CERTIFICATE'},
	{x: 850, l1: 'TAX DEED', l2: 'SALE'},
];

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
	const steps = [tUnpaid - 2, tLong - 2, tAuction - 4].map((t) => sp(frame, fps, t, 'snappy'));
	const line = kf(frame, [tUnpaid, tAuction], [0, 1]);
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
				<div style={{position: 'absolute', left: 540, top: 0, transform: `translate(${(1 - bill) * 700}px, ${700 - up * 300}px) scale(${1 - up * 0.22}) rotate(${3 - up * 3}deg)`, transformOrigin: '0 0'}}>
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
			{/* Florida: the process */}
			{frame >= tFl && (
				<>
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 760, opacity: note, transform: `translateY(${(1 - note) * 24}px)`}}>
						<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 5, color: P.muted}}>FLORIDA</div>
						<div style={{fontSize: 52, fontWeight: 900, letterSpacing: -1, lineHeight: 1.12, color: P.ink, marginTop: 8}}>Unpaid property taxes can lead to a tax deed sale.</div>
					</div>
					<div style={{position: 'absolute', left: STEPS[0].x, top: 1076, width: (STEPS[2].x - STEPS[0].x) * line, height: 6, background: P.ink, borderRadius: 3}} />
					{STEPS.map((s, i) => (
						<div key={s.l2} style={{position: 'absolute', left: s.x, top: 1079, transform: 'translate(-50%,-50%)', opacity: steps[i]}}>
							<div style={{width: 40, height: 40, borderRadius: 20, background: i === 2 ? P.danger : P.ink, margin: '0 auto', transform: `scale(${steps[i]})`}} />
							<div style={{position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap', fontSize: 30, fontWeight: 900, letterSpacing: 2, lineHeight: 1.15, color: i === 2 ? P.danger : P.ink}}>
								{s.l1}
								<br />
								{s.l2}
							</div>
						</div>
					))}
					<div style={{position: 'absolute', left: 0, right: 0, top: 1250, textAlign: 'center', fontSize: 28, fontWeight: 700, color: P.muted, opacity: steps[1]}}>A delinquency process that takes time, usually years</div>
				</>
			)}
			<Sfx at={tMort - 2} name="stamp" volume={0.4} />
			<Sfx at={tTax - 4} name="paper" volume={0.35} />
		</AbsoluteFill>
	);
};
