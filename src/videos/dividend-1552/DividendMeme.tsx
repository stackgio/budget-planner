import React, {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, type CalculateMetadataFunction, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {colors, fonts} from '../../brand/theme';
import {Background} from '../../components/Background';
import {Camera} from '../../components/Camera';
import {Captions} from '../../components/Captions';
import {Stickman} from '../../components/character/Stickman';
import {DollarBills} from '../../components/finance/DollarBills';
import {MoneyCounter} from '../../components/finance/MoneyCounter';
import {LockScreen, Notification, Phone} from '../../components/finance/Phone';
import {EndCard} from '../../components/HookEnd';
import {SafeZoneOverlay} from '../../components/SafeZoneOverlay';
import {Scene} from '../../components/Scene';
import {clamp, ease, progress, shake, springAt, springs} from '../../lib/motion';
import {makeCues, type Narration} from '../../lib/timing';
import narrationJson from './narration.json';

const narration = narrationJson as Narration;

export const dividendSchema = z.object({
	/** Must match what the narration says. */
	amount: z.number(),
	app: z.string(),
	showCaptions: z.boolean(),
	showSafeZones: z.boolean(),
});
type Props = z.infer<typeof dividendSchema>;

const END_CARD_FRAMES = 54;
const PHONE_W = 600;
const NOTIF_Y = 878; // where the notification sits on screen, for the camera dive
const CAPTION_Y = 1350;

// Every beat of the video, derived from the voiceover. Re-record the narration,
// re-run align-narration, and the whole edit follows.
const useBeats = () => {
	const {fps} = useVideoConfig();
	return useMemo(() => {
		const c = makeCues(narration, fps);
		return {
			l1: c.line('L1'),
			l2: c.line('L2'),
			l3: c.line('L3'),
			l4: c.line('L4'),
			l5: c.line('L5'),
			boom: c.word('boom').from,
			dividend: c.word('dividend').from,
			cents: c.word('cents').to,
			naturally: c.word('naturally').from,
			im: c.word("I'm").from,
			retiring: c.word('retiring').from,
			quarter: c.word('quarter').from,
			maybe: c.word('maybe').from,
			endCard: c.line('L5').to + 8,
		};
	}, [fps]);
};
type Beats = ReturnType<typeof useBeats>;

export const calculateDividendMetadata: CalculateMetadataFunction<Props> = () => {
	const fps = 30;
	return {fps, durationInFrames: makeCues(narration, fps).line('L5').to + 8 + END_CARD_FRAMES};
};

export const DividendMeme: React.FC<Props> = ({amount, app, showCaptions, showSafeZones}) => {
	const b = useBeats();
	const {durationInFrames} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: colors.black}}>
			<Scene name="Phone + notification" from={0} to={b.l2.from + 12}>
				<PhoneScene b={b} amount={amount} app={app} />
			</Scene>
			<Scene name="Counter + Gio" from={b.l2.from - 2} to={durationInFrames}>
				<MainScene b={b} amount={amount} />
			</Scene>
			{showCaptions ? <Captions words={narration.words} y={CAPTION_Y} emphasize={['boom', 'dividend', 'nothing', 'retiring']} pageMs={900} /> : null}
			<Scene name="End card" from={b.endCard} to={durationInFrames}>
				<EndCard startFrame={b.endCard} />
			</Scene>

			<Audio name="Narration" src={staticFile(narration.audio)} />
			<Sequence name="SFX notification" from={b.boom - 1} layout="none">
				<Audio src={staticFile('sfx/notification.wav')} volume={0.55} />
			</Sequence>
			<Sequence name="SFX whoosh" from={b.l2.from - 8} layout="none">
				<Audio src={staticFile('sfx/whoosh.wav')} volume={0.25} />
			</Sequence>
			<Sequence name="SFX pop (sunglasses)" from={b.retiring + 9} layout="none">
				<Audio src={staticFile('sfx/pop.wav')} volume={0.45} />
			</Sequence>

			{showSafeZones ? <SafeZoneOverlay /> : null}
		</AbsoluteFill>
	);
};

const PhoneScene: React.FC<{b: Beats; amount: number; app: string}> = ({b, amount, app}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const rise = springAt(frame, fps, 0, springs.heavy);
	const buzz = shake(frame, b.boom, 10, 7);
	const exit = progress(frame, b.l2.from + 1, b.l2.from + 10, ease.inOut);
	return (
		<AbsoluteFill style={{opacity: 1 - exit, filter: `blur(${exit * 28}px)`}}>
			<Background glow={{x: 50, y: 42, opacity: 0.14}} />
			<Camera
				keys={[
					{frame: 0, zoom: 1, y: 960},
					{frame: b.l1.to, zoom: 1.07, y: 920},
					{frame: b.l1.to + 2, zoom: 1.08, y: 910},
					{frame: b.l2.from + 8, zoom: 3.6, y: NOTIF_Y, ease: ease.in},
				]}
			>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					<div style={{translate: `${buzz.x}px ${(1 - rise) * 1000 + buzz.y}px`, rotate: `${(1 - rise) * -6}deg`}}>
						<Phone width={PHONE_W}>
							<LockScreen phoneWidth={PHONE_W}>
								<Notification
									enterFrame={b.boom - 1}
									highlightFrame={b.dividend}
									app={app}
									title="Dividend received"
									body={
										<>
											You received <span style={{color: colors.green, fontWeight: 800}}>${amount.toFixed(2)}</span>
										</>
									}
									phoneWidth={PHONE_W}
								/>
							</LockScreen>
						</Phone>
					</div>
				</AbsoluteFill>
			</Camera>
		</AbsoluteFill>
	);
};

const MainScene: React.FC<{b: Beats; amount: number}> = ({b, amount}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enter = progress(frame, b.l2.from + 6, b.l2.from + 16, ease.out);
	const closeUp = progress(frame, b.quarter, b.quarter + 14, ease.inOut);
	const up = progress(frame, b.l3.from - 2, b.l3.from + 16, ease.inOut);
	const gioIn = springAt(frame, fps, b.l3.from, springs.heavy);
	const shades = springAt(frame, fps, b.retiring + 4, springs.pop) + progress(frame, b.maybe + 2, b.maybe + 12, ease.out) * 0.5;
	const glow = interpolate(frame, [b.retiring, b.retiring + 10, b.l5.from, b.l5.from + 4], [0.14, 0.32, 0.32, 0.05], clamp);

	return (
		<AbsoluteFill style={{opacity: enter}}>
			<Background glow={{x: 50, y: 38, opacity: glow, size: 60}} />
			<Camera
				drift={2}
				keys={[
					{frame: 0, zoom: 1},
					{frame: b.quarter, zoom: 1},
					{frame: b.quarter + 20, zoom: 1.5, y: 780},
				]}
			>
				<AbsoluteFill style={{scale: interpolate(enter, [0, 1], [1.35, 1])}}>
					{/* Counter: big and centered, then moves up to make room for Gio */}
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: interpolate(up, [0, 1], [700, 300]),
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							scale: interpolate(up, [0, 1], [1, 0.62]),
							transformOrigin: '50% 0%',
							opacity: 1 - closeUp,
						}}
					>
						<div style={{fontFamily: fonts.body, fontWeight: 700, fontSize: 38, letterSpacing: '0.14em', color: colors.muted, marginBottom: 6}}>
							DIVIDEND RECEIVED
						</div>
						<MoneyCounter from={0} to={amount} startFrame={b.l2.from + 6} endFrame={b.cents} fontSize={186} color={colors.green} sign="+" />
					</div>

					<DollarBills startFrame={b.retiring} freezeAt={b.l5.from} />

					<Stickman
						x={540}
						y={1240 + (1 - gioIn) * 900}
						style={{display: frame < b.l3.from ? 'none' : undefined}}
						height={560}
						keys={[
							{frame: 0, pose: 'lounge', expression: 'smug'},
							{frame: b.naturally, pose: 'idle', duration: 12},
							{frame: b.im - 2, pose: 'crouch', expression: 'happy', duration: 6},
							{frame: b.retiring, pose: 'jump', feel: 'pop', duration: 8},
							{frame: b.retiring + 12, pose: 'celebrate', feel: 'bouncy', duration: 14},
							{frame: b.l5.from, pose: 'deadpan', expression: 'deadpan', duration: 10},
							{frame: b.maybe, pose: 'shrug', duration: 10},
						]}
						sunglasses={frame >= b.retiring + 4 ? shades : 0}
						sweat={progress(frame, b.maybe + 4, b.maybe + 14, ease.out)}
					/>
				</AbsoluteFill>
			</Camera>
		</AbsoluteFill>
	);
};
