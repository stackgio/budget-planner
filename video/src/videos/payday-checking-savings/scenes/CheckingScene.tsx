import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {story} from '../../../story/theme';
import {Board} from '../Board';
import {MatteBg} from '../look';

/** Gio answers: the CHECKING column fills — label on "spend", header on "checking", each expense on its word. */
export const CheckingScene: React.FC = () => {
	const {cue} = useCues();
	const tSpend = cue('G1', 'spend', -0.05);
	const tChecking = cue('G1', 'checking.', -0.08);
	const tRent = cue('G1', 'rent,', -0.05);
	const tGroc = cue('G1', 'groceries,', -0.05);
	const tGas = cue('G1', 'gas.', -0.05);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<MatteBg y={760} />
			<Camera keys={[{at: 0, zoom: 1.0}, {at: tRent - 4, zoom: 1.0}, {at: tGas + 10, zoom: 1.04, x: 300, y: 900}]}>
				<Board titleAt={4} left={{on: 2, header: tChecking, purpose: tSpend, items: [tRent, tGroc, tGas]}} right={{on: 1e6, header: 1e6, purpose: 1e6, items: []}} />
			</Camera>
			<Sfx at={tSpend} name="whoosh-soft" volume={0.3} />
			<Sfx at={tChecking} name="stamp" volume={0.35} />
			<Sfx at={tRent} name="pop" volume={0.3} />
			<Sfx at={tGroc} name="pop" volume={0.3} />
			<Sfx at={tGas} name="pop" volume={0.3} />
		</AbsoluteFill>
	);
};
