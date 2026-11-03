import React, {createContext, useContext} from 'react';
import {useVideoConfig} from 'remotion';
import {cueSec, type Narration} from './narration';

type CueCtx = {narration: Narration; sceneStartFrame: number};
const Ctx = createContext<CueCtx | null>(null);

export const CueProvider: React.FC<{narration: Narration; sceneStartFrame: number; children: React.ReactNode}> = ({
	narration,
	sceneStartFrame,
	children,
}) => <Ctx.Provider value={{narration, sceneStartFrame}}>{children}</Ctx.Provider>;

/**
 * Inside a scene: cue('L3', 'car') → the scene-local frame where "car" is spoken.
 * Animations keyed to cues re-time automatically when real narration is added.
 */
export const useCues = () => {
	const c = useContext(Ctx);
	const {fps} = useVideoConfig();
	if (!c) throw new Error('useCues must be used inside <CueProvider>');
	const cue = (lineId: string, word?: string | number, offsetSec = 0, edge: 'start' | 'end' = 'start') =>
		Math.round((cueSec(c.narration, lineId, word, edge) + offsetSec) * fps) - c.sceneStartFrame;
	return {cue, narration: c.narration, sceneStartFrame: c.sceneStartFrame, fps};
};
