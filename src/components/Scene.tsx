import React from 'react';
import {Sequence} from 'remotion';

type Props = {
	name: string;
	from: number;
	to: number;
	children: React.ReactNode;
};

/**
 * A timeline block that is only mounted between `from` and `to`, while its
 * children keep reading absolute frames. Cues from narration.json can then be
 * used as-is inside any scene, with no offset math.
 */
export const Scene: React.FC<Props> = ({name, from, to, children}) => (
	<Sequence name={name} from={from} durationInFrames={Math.max(1, to - from)}>
		<Sequence from={-from} layout="none" name={`${name} (absolute frames)`}>
			{children}
		</Sequence>
	</Sequence>
);
