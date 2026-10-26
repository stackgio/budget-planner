import React from 'react';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts, SAFE} from '../brand/theme';
import {Background} from '../components/Background';
import {Camera} from '../components/Camera';
import {Stickman} from '../components/character/Stickman';
import {GrowthChart} from '../components/data/GrowthChart';
import {ProgressBar} from '../components/data/ProgressBar';
import {Timeline} from '../components/data/Timeline';
import {CreditCard, TapToPay} from '../components/finance/CreditCard';
import {MoneyCounter} from '../components/finance/MoneyCounter';
import {Receipt} from '../components/finance/Receipt';
import {EndCard, HookTitle} from '../components/HookEnd';
import {KineticText} from '../components/KineticText';
import {SafeZoneOverlay} from '../components/SafeZoneOverlay';
import {ScreenshotReveal} from '../components/ScreenshotReveal';
import {KineticStory} from '../components/KineticStory';
import {SplitScreen} from '../components/SplitScreen';
import type {Narration} from '../lib/timing';
import sampleNarration from '../videos/dividend-1552/narration.json';
import {Audio} from '@remotion/media';
import {clamp, ease} from '../lib/motion';

// One composition per component, for previewing and regression checks.
// These are demos: values are illustrative and labeled as such.

type ShowcaseProps = {showSafeZones: boolean};

const Label: React.FC<{children: React.ReactNode}> = ({children}) => (
	<div
		style={{
			position: 'absolute',
			top: SAFE.top - 90,
			left: 0,
			right: 0,
			textAlign: 'center',
			fontFamily: fonts.body,
			fontSize: 26,
			fontWeight: 700,
			letterSpacing: '0.16em',
			color: colors.dim,
		}}
	>
		{children}
	</div>
);

const Frame: React.FC<{label: string; showSafeZones: boolean; children: React.ReactNode}> = ({label, showSafeZones, children}) => (
	<AbsoluteFill>
		<Background />
		{children}
		<Label>{label}</Label>
		{showSafeZones ? <SafeZoneOverlay /> : null}
	</AbsoluteFill>
);

// $10,000 compounding yearly at a constant 7% vs. held as cash at 0%.
// Pure math, not market data: label it as a hypothetical in any video.
const years = Array.from({length: 31}, (_, i) => i);
const compounding = years.map((t) => ({x: 2025 + t, y: 10000 * Math.pow(1.07, t)}));
const cash = years.map((t) => ({x: 2025 + t, y: 10000}));

export const ShowcaseGrowthChart: React.FC<ShowcaseProps> = ({showSafeZones}) => (
	<Frame label="GROWTH CHART · HYPOTHETICAL" showSafeZones={showSafeZones}>
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<KineticText
				fontSize={72}
				words={[
					{text: '$10K', at: 5, color: colors.green},
					{text: 'at', at: 9},
					{text: '7%', at: 13, color: colors.green},
					{text: 'a', at: 16},
					{text: 'year', at: 19},
				]}
			/>
			<div style={{height: 40}} />
			<GrowthChart
				series={[
					{label: '7% / yr', points: compounding},
					{label: 'Cash', color: colors.muted, points: cash, valueLabel: 'end'},
				]}
				startFrame={25}
				endFrame={145}
				xTicks={[2025, 2040, 2055]}
				annotations={[{x: 2035, label: 'Doubled'}]}
				source="Hypothetical: $10,000 compounded yearly at 7%. Not a forecast."
			/>
		</AbsoluteFill>
	</Frame>
);

export const ShowcaseTimeline: React.FC<ShowcaseProps> = ({showSafeZones}) => (
	<Frame label="TIMELINE" showSafeZones={showSafeZones}>
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<Timeline
				events={[
					{date: '1957', label: 'S&P 500 launches', detail: '500 large US companies', at: 10},
					{date: '1976', label: 'First index fund', detail: 'Vanguard, for everyday investors', at: 45},
					{date: '1993', label: 'First US ETF', detail: 'SPY starts trading', at: 80},
					{date: 'Today', label: 'You can buy the index', detail: 'in a few taps', at: 115, highlight: true},
				]}
			/>
		</AbsoluteFill>
	</Frame>
);

export const ShowcaseSplitScreen: React.FC<ShowcaseProps> = ({showSafeZones}) => (
	<AbsoluteFill>
		<SplitScreen
			startFrame={5}
			winner={{side: 'b', at: 80}}
			a={{
				label: 'Spend it',
				children: (
					<Stickman x={540} y={860} height={420} keys={[{frame: 0, pose: 'idle', expression: 'happy'}, {frame: 80, pose: 'shrug', expression: 'worried'}]} />
				),
			}}
			b={{
				label: 'Invest it',
				children: (
					<Stickman x={540} y={420} height={420} keys={[{frame: 0, pose: 'idle', expression: 'neutral'}, {frame: 80, pose: 'celebrate', expression: 'happy', feel: 'bouncy'}]} sunglasses={1} />
				),
			}}
		/>
		{showSafeZones ? <SafeZoneOverlay /> : null}
	</AbsoluteFill>
);

export const ShowcaseProgressAndDebt: React.FC<ShowcaseProps> = ({showSafeZones}) => (
	<Frame label="DEBT COUNTER + PROGRESS · DEMO VALUES" showSafeZones={showSafeZones}>
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 70}}>
			<div style={{fontFamily: fonts.body, fontWeight: 700, fontSize: 38, letterSpacing: '0.14em', color: colors.muted}}>DEBT REMAINING</div>
			{/* Same frames + same easing: the counter and the bar always agree. */}
			<MoneyCounter from={8400} to={0} startFrame={15} endFrame={110} fontSize={150} color={colors.red} decimals={0} easing={ease.inOut} />
			<ProgressBar label="Paid off" to={1} startFrame={15} endFrame={110} milestones={[0.25, 0.5, 0.75]} easing={ease.inOut} />
		</AbsoluteFill>
	</Frame>
);

export const ShowcaseCards: React.FC<ShowcaseProps> = ({showSafeZones}) => (
	<Frame label="CARD + TAP TO PAY · DEMO VALUES" showSafeZones={showSafeZones}>
		<TapToPay startFrame={5} tapFrame={45} amount={6.75} />
		<div style={{position: 'absolute', left: 0, right: 0, top: SAFE.top + 30, display: 'flex', justifyContent: 'center'}}>
			<KineticText fontSize={84} words={[{text: 'Coffee', at: 2}, {text: 'again?', at: 8, color: colors.green}]} />
		</div>
	</Frame>
);

export const ShowcaseCardFlip: React.FC<ShowcaseProps> = ({showSafeZones}) => {
	const {fps} = useVideoConfig();
	return (
		<Frame label="CARD" showSafeZones={showSafeZones}>
			<Camera keys={[{frame: 0, zoom: 1.12}, {frame: 3 * fps, zoom: 1}]}>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 60}}>
					<SpinningCard variant="matte" delay={0} />
					<SpinningCard variant="green" delay={8} />
				</AbsoluteFill>
			</Camera>
		</Frame>
	);
};

const SpinningCard: React.FC<{variant: 'matte' | 'green'; delay: number}> = ({variant, delay}) => {
	const frame = useCurrentFrame();
	const t = interpolate(frame, [delay, delay + 30], [0, 1], {...clamp, easing: ease.out});
	return <CreditCard variant={variant} tiltY={interpolate(t, [0, 1], [80, -8]) + Math.sin(frame / 20) * 4} style={{opacity: t}} />;
};

export const ShowcaseReceipt: React.FC<ShowcaseProps> = ({showSafeZones}) => (
	<Frame label="RECEIPT · DEMO VALUES" showSafeZones={showSafeZones}>
		<AbsoluteFill style={{alignItems: 'center', paddingTop: SAFE.top + 40}}>
			<Receipt
				store="CORNER CAFE"
				date="10/26 · 8:14 AM"
				startFrame={10}
				printFrames={50}
				circleTotalAt={70}
				items={[
					{label: 'Oat latte', amount: 6.75},
					{label: 'Croissant', amount: 4.5},
					{label: 'Extra shot', amount: 1.25},
				]}
			/>
		</AbsoluteFill>
	</Frame>
);

export const ShowcaseScreenshot: React.FC<ShowcaseProps> = ({showSafeZones}) => (
	<Frame label="SCREENSHOT + PRIVACY BLUR" showSafeZones={showSafeZones}>
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<ScreenshotReveal
				src={staticFile('samples/mock-bank-screenshot.png')}
				imageWidth={1080}
				imageHeight={1920}
				width={600}
				enterFrame={5}
				privacy={[
					{x: 60, y: 160, w: 560, h: 90},
					{x: 60, y: 250, w: 620, h: 60},
					{x: 110, y: 400, w: 560, h: 60},
				]}
				highlight={{x: 100, y: 560, w: 470, h: 150, at: 40}}
				focus={{at: 60, zoom: 1.45}}
			/>
		</AbsoluteFill>
	</Frame>
);

export const ShowcaseHookAndEnd: React.FC<ShowcaseProps> = ({showSafeZones}) => (
	<Frame label="" showSafeZones={showSafeZones}>
		<HookTitle
			tag="POV"
			exitAt={70}
			words={[
				{text: 'Your', at: 6},
				{text: 'first', at: 10},
				{text: 'dividend', at: 14, color: colors.green, br: true},
				{text: 'just', at: 22},
				{text: 'hit', at: 26},
			]}
		/>
		<Stickman x={540} y={1380} height={520} keys={[{frame: 0, pose: 'think', expression: 'neutral'}, {frame: 26, pose: 'jump', expression: 'shocked', feel: 'pop'}, {frame: 38, pose: 'celebrate', expression: 'happy', feel: 'bouncy', duration: 14}]} holding="phone" />
		<EndCard startFrame={80} />
	</Frame>
);

// Video type 3 with zero scene work: the sample narration as kinetic typography.
export const ShowcaseKineticStory: React.FC<ShowcaseProps> = ({showSafeZones}) => {
	const {durationInFrames} = useVideoConfig();
	const narration = sampleNarration as Narration;
	return (
		<AbsoluteFill>
			<KineticStory narration={narration} endFrame={durationInFrames} emphasize={['boom', 'dividend', 'nothing', 'retiring']} />
			<Audio src={staticFile(narration.audio)} />
			{showSafeZones ? <SafeZoneOverlay /> : null}
		</AbsoluteFill>
	);
};
