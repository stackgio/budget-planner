import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, staticFile} from 'remotion';
import {cinematic, story} from '../theme';
import type {Narration, Word} from '../lib/narration';
import {Captions} from './Captions';

/**
 * One trimmed creator clip (third-party footage) inside a montage <Sequence>.
 * Pixels are untouched (fit to 1080×1920, no crop of 9:16 sources). Captions
 * show the words actually spoken (clip-local seconds), placed at `captionTop`
 * to clear the creator's own burned-in text. A small credit chip repeats the
 * creator's handle next to the platform watermark.
 */
export const CreatorClip: React.FC<{
	src: string;
	/** source frames (30 fps) */
	trimBefore: number;
	trimAfter: number;
	/** spoken words, seconds relative to `trimBefore` */
	words: Word[];
	captionTop: number;
	captionSize?: number;
	handle: string;
	creditTop?: number;
	volume?: number;
	/** frames of audio fade at the out point (avoid clicks on a tight cut) */
	fadeOut?: number;
}> = ({src, trimBefore, trimAfter, words, captionTop, captionSize = 54, handle, creditTop = 1060, volume = 1, fadeOut = 2}) => {
	const len = trimAfter - trimBefore;
	const narration: Narration = React.useMemo(
		() => ({source: 'aligned', durationSec: len / story.fps, lines: [{id: 'clip', text: words.map((w) => w.text).join(' '), start: words[0].start, end: words[words.length - 1].end, words}]}),
		[words, len],
	);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<OffthreadVideo
				src={staticFile(src)}
				trimBefore={trimBefore}
				trimAfter={trimAfter}
				style={{width: '100%', height: '100%', objectFit: 'cover'}}
				volume={(f) => volume * interpolate(f, [len - fadeOut - 1, len - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
			/>
			<Captions narration={narration} paletteAt={() => cinematic} top={captionTop} fontSize={captionSize} backdrop />
			<div
				style={{
					position: 'absolute',
					left: story.safe.left - 40,
					top: creditTop,
					padding: '6px 14px',
					borderRadius: 10,
					background: 'rgba(11,12,14,0.62)',
					color: '#F5F2EA',
					fontFamily: story.font,
					fontWeight: 800,
					fontSize: 26,
					letterSpacing: 0.5,
				}}
			>
				{handle}
			</div>
		</AbsoluteFill>
	);
};
