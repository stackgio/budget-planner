import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS, SRC} from '../facts';
import {Chip} from '../art';
import {C, Kicker, NewsBg, Pct, ScaleBar, SourceTag} from '../ui';

/**
 * NVIDIA — "Those fears added even more pressure to tech stocks, with Nvidia falling over nine percent."
 * Irises out of the CHIPS node into one big chip. The −9.3% bar sits on the SAME scale as the
 * Nasdaq and S&P (ghost markers), so the extra pressure on chip stocks is visible, not just said.
 * "NVIDIA" is plain type (no logo).
 */
export const NvidiaScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tTech = cue('L8', 'tech');
	const tNv = cue('L8', 'Nvidia');
	const tNine = cue('L8', 'nine');
	const tEnd = cue('L8', undefined, 0, 'end');
	const nv = Math.abs(FACTS.nvdaPct.value);
	const glow = kf(frame, [tTech - 4, tTech + 10], [0, 1], E.out);
	const name = sp(frame, fps, tNv - 3, 'snappy');
	const v = kf(frame, [tNv + 6, tEnd], [0, nv], E.out);
	const ghosts = kf(frame, [tNine, tNine + 10], [0, 1]);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<NewsBg tint="red" lightY={540} light={0.5 + glow * 0.7} />
			<Camera keys={[{at: 0, zoom: 1.08, y: 560}, {at: tNv, zoom: 1.0, y: 900, ease: E.inOut}]}>
				<Kicker style={{left: story.safe.left, top: 250}}>TECH STOCKS · NOV 5, 2026</Kicker>
				<div style={{position: 'absolute', left: (story.width - 380) / 2, top: 330}}>
					<Chip size={380} glow={glow} />
				</div>
			</Camera>
			<div style={{position: 'absolute', left: story.safe.left, top: 780, opacity: name, transform: `translateY(${(1 - name) * 30}px)`, display: 'flex', alignItems: 'baseline', gap: 22}}>
				<span style={{fontSize: 104, fontWeight: 900, letterSpacing: 2, color: C.ink}}>NVIDIA</span>
				<span style={{fontSize: 40, fontWeight: 800, letterSpacing: 4, color: C.muted}}>NVDA</span>
			</div>
			<div style={{position: 'absolute', left: story.safe.left - 8, top: 910, opacity: name}}>
				<Pct v={v} size={200} color={C.red} />
			</div>
			<ScaleBar
				value={v}
				w={story.width - story.safe.left * 2}
				ghosts={[
					{v: Math.abs(FACTS.spxPct.value), label: 'S&P'},
					{v: Math.abs(FACTS.nasdaqPct.value), label: 'NASDAQ'},
				]}
				ghostOpacity={ghosts}
				style={{left: story.safe.left, top: 1196, opacity: name}}
			/>
			<SourceTag text={SRC.nvda} at={tNv} />
			<Sfx at={tTech - 4} name="whoosh-soft" volume={0.2} />
			<Sfx at={tEnd} name="thud" volume={0.24} />
		</AbsoluteFill>
	);
};
