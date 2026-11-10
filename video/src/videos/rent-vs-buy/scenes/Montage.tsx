import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {CreatorClip} from '../../../story/components/CreatorClip';
import {story} from '../../../story/theme';
import {CLIPS} from '../montage';

/**
 * COLD OPEN — three creator clips, hard cuts, one complete thought each.
 * Frame 0 is the first clip's first audible word. `reviewCut` stamps a small
 * label while usage clearance is pending.
 */
export const makeMontage = (reviewCut: boolean): React.FC => {
	const M: React.FC = () => {
		let from = 0;
		return (
			<AbsoluteFill style={{background: '#000'}}>
				{CLIPS.map((c) => {
					const len = c.outFrame - c.inFrame;
					const el = (
						<Sequence key={c.id} from={from} durationInFrames={len} name={`clip:${c.id}`}>
							<CreatorClip
								src={c.src}
								trimBefore={c.inFrame}
								trimAfter={c.outFrame}
								words={c.words.map((w) => ({text: w.text, start: w.start - c.inFrame / 30, end: w.end - c.inFrame / 30}))}
								captionTop={c.captionTop}
								captionSize={c.captionSize}
								handle={c.handle}
							/>
						</Sequence>
					);
					from += len;
					return el;
				})}
				{reviewCut && (
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							bottom: 40,
							textAlign: 'center',
							fontFamily: story.font,
							fontWeight: 800,
							fontSize: 24,
							letterSpacing: 3,
							color: 'rgba(255,255,255,0.85)',
						}}
					>
						<span style={{background: 'rgba(200,40,30,0.85)', padding: '6px 14px', borderRadius: 8}}>REVIEW CUT · CLIP CLEARANCE PENDING</span>
					</div>
				)}
			</AbsoluteFill>
		);
	};
	return M;
};
