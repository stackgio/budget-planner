import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Screenshot, type Region} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {C, GREEN, Kicker, NewsBg} from '../ui';

/** The creator's genuine order confirmation — pixels untouched (sha256 b0e8bcb1…). */
export const SOFI_IMG = {src: 'motion/market-crash-nov5/assets/sofi-order.png', natural: {w: 1206, h: 2622}};
/** Rows "Shares purchased 6 of 6" → "Total cost $97.18" (natural pixels). */
const ROWS: Region = {x: 60, y: 1036, w: 1086, h: 500};
// No account numbers, names or emails appear in the screenshot → nothing needs blurring.
const REDACT: Region[] = [];

const PHONE_W = 430;
const PHONE_TOP = 372;
const PAD = 18;
const s = PHONE_W / SOFI_IMG.natural.w;
const rowsCenterY = PHONE_TOP + PAD + (ROWS.y + ROWS.h / 2) * s;

/**
 * SOFI — "I actually bought more SoFi stock because I believe in its long-term potential. /
 * Now, I'm only twenty-two, and I'm still learning about investing."
 * Proof first (phone rises, camera pushes into the real rows, green highlight),
 * then the phone steps aside — still on screen — for the personal context.
 */
export const SofiScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBought = cue('L11', 'bought');
	const tSofi = cue('L11', 'SoFi');
	const tNow = cue('L12');
	const t22 = cue('L12', 'twenty-two,');
	const tLearn = cue('L12', 'learning');

	const rise = sp(frame, fps, 0, 'smooth');
	const hl = kf(frame, [tSofi + 8, tSofi + 22], [0, 1], E.out);
	const aside = sp(frame, fps, tNow - 4, 'smooth');
	const phoneX = mix((story.width - PHONE_W - PAD * 2) / 2, story.safe.left - 6, aside);
	const phoneScale = mix(1, 0.88, aside);
	const ageIn = sp(frame, fps, t22 - 4, 'bouncy');
	const learnIn = sp(frame, fps, tLearn - 4, 'snappy');
	const camX = mix(story.width / 2, story.width / 2, aside);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<NewsBg tint="green" lightY={820} light={0.9} />
			<div style={{position: 'absolute', inset: 0, WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 1340px, transparent 1396px)', maskImage: 'linear-gradient(180deg, #000 0%, #000 1340px, transparent 1396px)'}}>
				<Camera
					keys={[
						{at: 0, zoom: 1, y: 960},
						{at: tSofi - 2, zoom: 1, y: 960},
						{at: tSofi + 26, zoom: 1.32, x: camX, y: rowsCenterY, ease: E.inOut},
						{at: tNow - 6, zoom: 1.32, x: camX, y: rowsCenterY},
						{at: tNow + 18, zoom: 1, x: story.width / 2, y: 960, ease: E.inOut},
					]}
				>
					<div style={{position: 'absolute', left: phoneX, top: PHONE_TOP + (1 - rise) * 900, transformOrigin: '0 0', transform: `scale(${phoneScale})`}}>
						<Screenshot
							src={SOFI_IMG.src}
							natural={SOFI_IMG.natural}
							w={PHONE_W}
							frame="phone"
							redact={REDACT}
							mark={ROWS}
							highlight={hl}
							palette={GREEN}
						/>
					</div>
				</Camera>
			</div>

			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 214}}>
				<KineticText text="I BOUGHT MORE SOFI" at={tBought - 4} fontSize={84} color={C.ink} colors={{SOFI: C.green}} />
			</div>
			<Kicker size={24} color={C.body} style={{left: story.safe.left, top: 312, opacity: kf(frame, [tSofi, tSofi + 10], [0, 1])}}>
				MY ACTUAL ORDER · UNEDITED SCREENSHOT
			</Kicker>

			{/* personal context, phone stays visible as proof */}
			<div style={{position: 'absolute', left: 560, width: 400, top: 560, opacity: ageIn, transform: `translateX(${(1 - ageIn) * 60}px)`}}>
				<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 4, color: C.muted}}>I&apos;M ONLY</div>
				<div style={{fontSize: 230, fontWeight: 900, letterSpacing: -6, color: C.ink, lineHeight: 1}}>22</div>
			</div>
			<div style={{position: 'absolute', left: 560, width: 400, top: 900, opacity: learnIn, transform: `translateY(${(1 - learnIn) * 24}px)`}}>
				<div style={{fontSize: 60, fontWeight: 900, color: C.green, lineHeight: 1.02}}>STILL</div>
				<div style={{fontSize: 60, fontWeight: 900, color: C.green, lineHeight: 1.02}}>LEARNING</div>
				<div style={{marginTop: 26, fontSize: 24, fontWeight: 700, letterSpacing: 2, color: C.body, lineHeight: 1.4}}>
					PERSONAL DECISION
					<br />
					NOT A RECOMMENDATION
				</div>
			</div>
			<Sfx at={2} name="whoosh-soft" volume={0.22} />
			<Sfx at={tSofi + 8} name="click" volume={0.3} />
		</AbsoluteFill>
	);
};
