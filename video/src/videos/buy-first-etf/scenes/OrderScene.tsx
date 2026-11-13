import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {DemoScrims, PhoneDemo} from '../../../story/components/PhoneDemo';
import {camAt, retime} from '../../../story/components/ScreenRecording';
import {useCues} from '../../../story/lib/cues';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {centre, Chip, on, R, REC, REDACT, StepHeader, tapP} from '../ui';

/**
 * One continuous take of Gio's real order: Search → VOO → Trade → Buy →
 * fraction → $10.01 estimated → review → swipe → Order queued.
 * Source time is retimed so each tap lands on the word that names it.
 */
export const OrderScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {cue} = useCues();
	const tS = cue('L17', 'search');
	const tV = cue('L17', 'VOO');
	const tO = cue('L17', 'open');
	const tT = cue('L17', 'trade');
	const tB = cue('L17', 'buy');
	const t18 = cue('L18');
	const tFrac = cue('L18', 'fraction');
	const tFracEnd = cue('L18', undefined, 0, 'end');
	const t19 = cue('L19');
	const tEst = cue('L19', 'estimated');
	const t20end = cue('L20', undefined, 0, 'end');
	const t21 = cue('L21');
	const tAmt = cue('L21', 'amount');
	const tAcct = cue('L21', 'account');
	const tSw = cue('L21', 'swiped');
	const tSubEnd = cue('L21', 'submit', 0, 'end');
	const tQOrder = cue('L22', 'order');
	const tQ = cue('L22', 'queued');
	const t23 = cue('L23');
	const tWait = cue('L23', 'waiting');
	const t24 = cue('L24');
	const tFills = cue('L24', 'fills');
	const t24end = cue('L24', undefined, 0, 'end');

	// tap moments (scene frames) — the source is retimed so the real tap happens here
	const tapBar = tS;
	const tapRow = tO + 10;
	const tapTrade = tT + 2;
	const tapBuy = tB + 2;
	const tapReview = t21 + 4;
	const tapSwipe = tSw + 2;

	const src = retime(frame, [
		[0, 1.75],
		[tapBar - 10, 1.8],
		[tapBar, 2.05],
		[tV - 8, 2.5],
		[tV + 14, 3.95],
		[tO, 4.4],
		[tapRow, 4.88],
		[tapRow + 8, 5.25],
		[tapTrade - 10, 5.6],
		[tapTrade, 6.08],
		[tapTrade + 8, 6.45],
		[tapBuy - 8, 7.2],
		[tapBuy, 7.45],
		[tapBuy + 18, 8.15],
		[t18, 8.3],
		[tFracEnd, 10.3],
		[t20end, 10.45],
		[tapReview - 8, 10.6],
		[tapReview, 10.92],
		[tapReview + 18, 11.62],
		[tapSwipe - 8, 12.15],
		[tapSwipe + 6, 12.5],
		[tapSwipe + 12, 12.85],
		[tSubEnd, 13.25],
		[tQOrder - 10, 13.45],
		[tQ - 4, 14.5],
		[tQ + 10, 15.0],
		[t24end, 15.6],
	]);

	// v05: tighter, readable framing on every button, amount and confirmation
	const cam = camAt(frame, [
		{at: 0, cx: 603, cy: 700, zoom: 1.32},
		{at: tapRow + 6, cx: 603, cy: 700, zoom: 1.32},
		{at: tapRow + 16, cx: 603, cy: 900, zoom: 1.12},
		{at: tapTrade - 16, cx: 603, cy: 2150, zoom: 1.34},
		{at: tapBuy + 12, cx: 603, cy: 2150, zoom: 1.34},
		{at: tapBuy + 26, cx: 700, cy: 560, zoom: 1.45},
		{at: tFrac - 4, cx: 700, cy: 560, zoom: 1.45},
		{at: tFrac + 10, cx: 603, cy: 700, zoom: 1.45},
		{at: tEst - 6, cx: 603, cy: 760, zoom: 1.45},
		{at: tEst + 10, cx: 603, cy: 950, zoom: 1.45},
		{at: t20end, cx: 603, cy: 960, zoom: 1.48},
		{at: tapReview - 12, cx: 603, cy: 1560, zoom: 1.3},
		{at: tapReview + 18, cx: 603, cy: 1080, zoom: 1.42},
		{at: tAcct + 10, cx: 603, cy: 1130, zoom: 1.45},
		{at: tapSwipe - 12, cx: 603, cy: 2350, zoom: 1.25},
		{at: tapSwipe + 8, cx: 603, cy: 2350, zoom: 1.25},
		{at: tapSwipe + 22, cx: 603, cy: 1290, zoom: 1.0},
		{at: tQ - 10, cx: 603, cy: 1290, zoom: 1.0},
		{at: tQ + 4, cx: 603, cy: 900, zoom: 1.38},
		{at: tWait, cx: 603, cy: 900, zoom: 1.4},
		{at: tFills, cx: 603, cy: 920, zoom: 1.42},
		{at: t24end, cx: 603, cy: 920, zoom: 1.45},
	]);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={600} />
			<PhoneDemo
				{...REC}
				srcSec={src}
				camera={cam}
				redact={REDACT}
				marks={[
					{...R.searchBar, p: on(frame, tapBar - 6, tV + 22)},
					{...R.vooRow, p: on(frame, tO - 2, tapRow + 6)},
					{...R.trade, p: on(frame, tapTrade - 10, tapTrade + 8)},
					{...R.buy, p: on(frame, tapBuy - 8, tapBuy + 8)},
					{...R.sharesToggle, p: on(frame, t18 - 2, tFrac - 4)},
					{...R.sharesRow, p: on(frame, tFrac - 2, t19)},
					{...R.estRow, p: on(frame, tEst - 2, t20end + 4)},
					{...R.review, p: on(frame, tapReview - 10, tapReview + 6)},
					{...R.reviewEst, p: on(frame, tAmt - 2, tAcct - 2)},
					{...R.reviewAcct, p: on(frame, tAcct - 2, tapSwipe - 10)},
					{...R.swipe, p: on(frame, tapSwipe - 8, tapSwipe + 12)},
					{...R.queuedTitle, p: on(frame, tQ - 2, tWait - 4)},
					{...R.queuedSub, p: on(frame, tWait - 4, tFills - 4)},
					{...R.queuedShares, p: on(frame, tFills - 4)},
				]}
				taps={[
					{...centre(R.searchBar), p: tapP(frame, tapBar)},
					{x: 360, y: centre(R.vooRow).y, p: tapP(frame, tapRow)},
					{...centre(R.trade), p: tapP(frame, tapTrade)},
					{...centre(R.buy), p: tapP(frame, tapBuy)},
					{...centre(R.review), p: tapP(frame, tapReview)},
					{x: 603, y: 2490 - 300 * Math.min(1, Math.max(0, (frame - (tapSwipe - 4)) / 14)), p: tapP(frame, tapSwipe)},
				]}
				palette={P}
			/>
			<DemoScrims />
			<StepHeader
				palette={P}
				steps={[
					{at: -30, n: '06', label: 'SEARCH VOO'},
					{at: tO - 2, n: '06', label: 'OPEN VANGUARD S&P 500 ETF'},
					{at: tapTrade - 6, n: '06', label: 'TAP TRADE'},
					{at: tapBuy - 6, n: '06', label: 'TAP BUY'},
					{at: t18, n: '07', label: 'ORDER IN SHARES'},
					{at: tFrac - 4, n: '07', label: 'ENTER A FRACTION OF A SHARE'},
					{at: t19, n: '07', label: 'CHECK THE ESTIMATED COST'},
					{at: t21, n: '08', label: 'REVIEW AMOUNT + ACCOUNT'},
					{at: tapSwipe - 8, n: '08', label: 'SWIPE UP TO CONFIRM'},
					{at: tapSwipe + 14, n: '08', label: 'SENDING ORDER'},
					{at: tQOrder - 4, n: '09', label: 'ORDER QUEUED'},
				]}
			/>
			<Chip text="BUY IN: SHARES" at={t18} out={tFrac - 4} x={540} y={1250} palette={P} size={46} tone="dark" />
			<Chip text={`${FACTS.shares.value} SHARES`} at={tFrac} out={t19} x={540} y={1250} palette={P} size={46} tone="dark" />
			<Chip text={`${usd(FACTS.estCost.value)} ESTIMATED`} at={tEst} out={tapReview - 10} x={540} y={1236} palette={P} size={56} />
			<Chip text={`${usd(FACTS.estCost.value)} ESTIMATED`} at={tAmt - 2} out={tAcct - 2} x={540} y={1250} palette={P} size={46} />
			<Chip text="ACCOUNT: INDIVIDUAL INVESTING" at={tAcct - 2} out={tapSwipe - 18} x={540} y={1250} palette={P} size={42} tone="dark" />
			<Chip text="QUEUED · WAITING TO FILL" at={tQ} x={540} y={372} palette={P} size={50} tone="dark" />
			<Chip text={`${FACTS.sharesPurchased.value} SHARES PURCHASED (YET)`} at={tFills - 2} x={540} y={470} palette={P} size={42} />
			<Sfx at={tapBar} name="click" volume={0.3} />
			<Sfx at={tapRow} name="click" volume={0.3} />
			<Sfx at={tapTrade} name="click" volume={0.3} />
			<Sfx at={tapBuy} name="click" volume={0.3} />
			<Sfx at={tapReview} name="click" volume={0.3} />
			<Sfx at={tapSwipe} name="whoosh-soft" volume={0.35} />
			<Sfx at={tQ} name="chime" volume={0.3} />
		</AbsoluteFill>
	);
};
