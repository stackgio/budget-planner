import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, prog, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {white as P} from './shared';

const BAR = {x: 100, w: 840, y: 640, h: 150};
/** Qualitative early-payment split (no loan inputs in the script → no percentages shown). */
const INTEREST_SHARE = 0.7;

/**
 * L14–L17 — equity, defined. Clean bright reset. The quote, a check on
 * "they're right", the equation built term by term, then an early fixed-rate
 * payment bar: principal chips the balance, interest flows to BORROWING COST.
 */
export const EquityScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tEq = cue('L14', 'equity."');
	const tRight = cue('L15', 'right.');
	const tL16 = cue('L16');
	const tWorth = cue('L16', 'worth');
	const tMinus = cue('L16', 'minus');
	const tOwe = cue('L16', 'owe.');
	const tL17 = cue('L17');
	const tPay = cue('L17', 'mortgage payment');
	const tInt = cue('L17', 'interest.');

	const quote = sp(frame, fps, 2, 'snappy') * (1 - kf(frame, [tL16 - 8, tL16], [0, 1]));
	const mark = kf(frame, [tEq, tEq + 10], [0, 1]);
	const ok = sp(frame, fps, tRight - 3, 'bouncy');
	const eqOut = kf(frame, [tL17 - 6, tL17 + 2], [0, 1]);
	const t1 = sp(frame, fps, tWorth - 4, 'snappy');
	const t2 = sp(frame, fps, tMinus - 3, 'snappy');
	const t3 = sp(frame, fps, tOwe - 2, 'bouncy');

	const bar = sp(frame, fps, tL17 + 2, 'snappy');
	const split = prog(frame, tPay - 2, 12, E.out);
	const intHi = kf(frame, [tInt - 2, tInt + 6], [0, 1]);
	const drop = prog(frame, tPay + 10, 18, E.inOut);
	const flow = prog(frame, tInt + 2, 14, E.inOut);
	const intW = BAR.w * INTEREST_SHARE;
	const prW = BAR.w - intW;
	const [px, py] = arc(drop, [BAR.x + intW + prW / 2, BAR.y + BAR.h / 2], [880, 1010], 60);
	const balance = 1 - 0.06 * drop;
	const [ix, iy] = arc(flow, [BAR.x + intW / 2, BAR.y + BAR.h / 2], [BAR.x + 32, 1162], 40);

	return (
		<AbsoluteFill style={{fontFamily: story.font, background: P.bg}}>
			{/* quote */}
			{quote > 0.01 && (
				<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 520, opacity: quote, transform: `translateY(${(1 - quote) * 30}px)`}}>
					<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 5, color: P.muted}}>SOMEBODY:</div>
					<div style={{fontSize: 92, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, color: P.ink, marginTop: 10}}>
						“BUT YOU'RE BUILDING{' '}
						<span style={{position: 'relative', display: 'inline-block'}}>
							<span style={{position: 'absolute', left: -8, right: -8, top: '18%', bottom: '4%', background: P.accentSoft, transform: `scaleX(${mark})`, transformOrigin: '0 50%', borderRadius: 8}} />
							<span style={{position: 'relative', color: P.accent}}>EQUITY.”</span>
						</span>
					</div>
					<div style={{display: 'inline-flex', alignItems: 'center', gap: 14, marginTop: 40, opacity: ok, transform: `scale(${0.6 + 0.4 * ok})`, transformOrigin: '0 50%', background: P.accent, color: '#fff', borderRadius: 18, padding: '12px 26px', fontSize: 48, fontWeight: 900, letterSpacing: 3}}>
						✓ TRUE
					</div>
				</div>
			)}
			{/* equation */}
			{frame >= tWorth - 6 && eqOut < 1 && (
				<div style={{position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', opacity: 1 - eqOut, transform: `translateY(${-eqOut * 60}px)`}}>
					<div style={{fontSize: 104, fontWeight: 900, letterSpacing: -2, color: P.ink, opacity: t1, transform: `translateY(${(1 - t1) * 30}px)`}}>HOME VALUE</div>
					<div style={{fontSize: 110, fontWeight: 900, color: P.danger, lineHeight: 1, opacity: t2}}>−</div>
					<div style={{fontSize: 80, fontWeight: 900, letterSpacing: -1, color: P.ink, opacity: t2, transform: `translateY(${(1 - t2) * 30}px)`}}>MORTGAGE BALANCE</div>
					<div style={{height: 8, background: P.ink, width: 760, margin: '34px auto 22px', transform: `scaleX(${t3})`, borderRadius: 4}} />
					<div style={{fontSize: 140, fontWeight: 900, letterSpacing: -3, color: P.accent, opacity: t3, transform: `scale(${0.7 + 0.3 * t3})`}}>= EQUITY</div>
				</div>
			)}
			{/* early payment bar */}
			{frame >= tL17 && (
				<>
					<div style={{position: 'absolute', left: BAR.x, top: BAR.y - 150, opacity: bar}}>
						<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 5, color: P.muted}}>EARLY MORTGAGE PAYMENT</div>
						<div style={{fontSize: 64, fontWeight: 900, letterSpacing: -1, color: P.ink}}>PRINCIPAL + INTEREST</div>
					</div>
					<div style={{position: 'absolute', left: BAR.x, top: BAR.y, width: BAR.w * bar, height: BAR.h, borderRadius: 22, background: P.line, overflow: 'hidden'}}>
						<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: intW * split, background: P.danger}} />
						<div style={{position: 'absolute', left: 24, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: 50, fontWeight: 900, color: '#fff', letterSpacing: 2, opacity: split, transform: `scale(${1 + intHi * 0.08})`, transformOrigin: '0 50%'}}>INTEREST</div>
						<div style={{position: 'absolute', left: intW, top: 0, bottom: 0, width: prW, background: P.accent, opacity: split}} />
						<div style={{position: 'absolute', left: intW, width: prW, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: 2, opacity: split}}>PRINCIPAL</div>
					</div>
					<div style={{position: 'absolute', left: BAR.x, top: BAR.y + BAR.h + 14, fontSize: 26, fontWeight: 700, color: P.muted, opacity: bar}}>Illustrative split · fixed-rate loan, early years</div>
					{/* loan balance, chipped by principal */}
					<div style={{position: 'absolute', left: BAR.x, top: 930, opacity: kf(frame, [tPay + 4, tPay + 12], [0, 1])}}>
						<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 5, color: P.muted, marginBottom: 12}}>LOAN BALANCE</div>
						<div style={{width: BAR.w, height: 70, borderRadius: 16, background: P.line}}>
							<div style={{width: BAR.w * balance, height: '100%', borderRadius: 16, background: '#9AA0A6'}} />
						</div>
					</div>
					{drop > 0 && drop < 1 && <div style={{position: 'absolute', left: px - 40, top: py - 30, width: 80, height: 60, borderRadius: 12, background: P.accent, boxShadow: '0 8px 16px rgba(0,0,0,0.2)'}} />}
					{flow > 0 && flow < 1 && <div style={{position: 'absolute', left: ix - 50, top: iy - 30, width: 100, height: 60, borderRadius: 12, background: P.danger, boxShadow: '0 8px 16px rgba(0,0,0,0.2)'}} />}
					{/* interest → borrowing cost */}
					<div style={{position: 'absolute', left: BAR.x, top: 1130, display: 'flex', alignItems: 'center', gap: 20, opacity: kf(frame, [tInt - 4, tInt + 6], [0, 1])}}>
						<div style={{width: 64, height: 64, borderRadius: 14, background: P.danger, transform: `scale(${0.6 + 0.4 * flow})`}} />
						<div style={{fontSize: 56, fontWeight: 900, letterSpacing: 1, color: P.danger}}>BORROWING COST</div>
					</div>
				</>
			)}
			<Sfx at={tRight - 3} name="pop" volume={0.3} />
			<Sfx at={tOwe - 2} name="chime" volume={0.25} />
			<Sfx at={tPay + 10} name="tick" volume={0.3} />
		</AbsoluteFill>
	);
};
