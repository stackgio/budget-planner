import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {E} from '../lib/motion';

/**
 * Story transitions for <TransitionSeries>. Each one carries meaning:
 *  iris       — light switching on from a point (lamp, coin, a zero balance)
 *  panelSweep — a coloured panel wipes across: chapter change / "paid off"
 *  matchCut   — very short dissolve between two shots framed identically,
 *               so a shared object (card, number) appears to continue
 * Built-ins (@remotion/transitions/slide, wipe, fade) cover the rest.
 */

type IrisProps = {x: number; y: number; feather?: number};
const IrisComp: React.FC<TransitionPresentationComponentProps<IrisProps>> = ({children, presentationDirection, presentationProgress, passedProps}) => {
	if (presentationDirection === 'exiting') return <AbsoluteFill>{children}</AbsoluteFill>;
	const p = E.inOut(presentationProgress);
	const r = p * 2300;
	return (
		<AbsoluteFill style={{clipPath: `circle(${r}px at ${passedProps.x}px ${passedProps.y}px)`}}>
			{children}
		</AbsoluteFill>
	);
};
export const iris = (props: IrisProps): TransitionPresentation<IrisProps> => ({component: IrisComp, props});

type SweepProps = {color: string; direction?: 'up' | 'left'};
const SweepComp: React.FC<TransitionPresentationComponentProps<SweepProps>> = ({children, presentationDirection, presentationProgress, passedProps}) => {
	const p = presentationProgress;
	const up = (passedProps.direction ?? 'up') === 'up';
	// panel covers during first half, uncovers the new scene in the second half
	const cover = E.inOut(Math.min(1, p * 2));
	const reveal = E.inOut(Math.max(0, p * 2 - 1));
	if (presentationDirection === 'exiting') {
		return (
			<AbsoluteFill>
				{children}
				<AbsoluteFill
					style={{
						background: passedProps.color,
						transform: up ? `translateY(${(1 - cover) * 100}%)` : `translateX(${(1 - cover) * 100}%)`,
					}}
				/>
			</AbsoluteFill>
		);
	}
	return (
		<AbsoluteFill style={{opacity: p < 0.5 ? 0 : 1}}>
			{children}
			<AbsoluteFill style={{background: passedProps.color, transform: up ? `translateY(${-reveal * 100}%)` : `translateX(${-reveal * 100}%)`}} />
		</AbsoluteFill>
	);
};
export const panelSweep = (props: SweepProps): TransitionPresentation<SweepProps> => ({component: SweepComp, props});

const MatchComp: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({children, presentationDirection, presentationProgress}) => (
	<AbsoluteFill style={{opacity: presentationDirection === 'entering' ? E.inOut(presentationProgress) : 1}}>{children}</AbsoluteFill>
);
export const matchCut = (): TransitionPresentation<Record<string, never>> => ({component: MatchComp, props: {}});
