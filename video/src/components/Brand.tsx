import React from 'react';
import {theme} from '../theme';

export const Brand: React.FC<{text: string; footnote: string}> = ({text, footnote}) => (
	<div style={{position: 'absolute', left: theme.safe.left, right: theme.safe.right - 40, top: 1486}}>
		<div style={{fontSize: 21, fontWeight: 500, color: theme.faint, lineHeight: 1.35}}>{footnote}</div>
		<div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 14}}>
			<svg width={30} height={30} viewBox="0 0 30 30">
				<rect x={1} y={18} width={7} height={11} rx={2} fill={theme.up} />
				<rect x={11} y={11} width={7} height={18} rx={2} fill={theme.up} />
				<rect x={21} y={2} width={7} height={27} rx={2} fill={theme.ink} />
			</svg>
			<div style={{fontSize: 24, fontWeight: 800, letterSpacing: 3, color: theme.charcoal}}>{text}</div>
		</div>
	</div>
);
