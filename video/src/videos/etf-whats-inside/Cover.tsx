import React from 'react';
import {AbsoluteFill} from 'remotion';
import '../../fonts';
import {BasketCard} from '../../story/components/BasketCard';
import {cinematic as P, story} from '../../story/theme';
import {CARD_W, COL_X} from './layout';

/** Cover: "4 ETFs. What's the difference?" — same cards/baskets as the video. */
export const EtfCover: React.FC = () => (
	<AbsoluteFill style={{background: P.bg, fontFamily: story.font}}>
		<AbsoluteFill style={{background: `radial-gradient(ellipse 80% 45% at 50% 52%, ${P.bg2} 0%, ${P.bg} 70%)`}} />
		<div style={{position: 'absolute', left: 60, width: 900, top: 230, textAlign: 'center', color: P.ink, fontWeight: 900, lineHeight: 0.98}}>
			<div style={{fontSize: 150, letterSpacing: -5}}>4 ETFs.</div>
			<div style={{fontSize: 84, letterSpacing: -2, marginTop: 18}}>WHAT&apos;S THE</div>
			<div style={{fontSize: 104, letterSpacing: -3, color: P.accent}}>DIFFERENCE?</div>
		</div>
		{(['VOO', 'SCHD', 'QQQM', 'VGT'] as const).map((t, i) => (
			<BasketCard key={t} x={COL_X[i % 2]} y={720 + Math.floor(i / 2) * 330} w={CARD_W} h={300} ticker={t} tickerSize={96} basketTop={140} basket={1} active={0} palette={P}>
				<div style={{position: 'absolute', left: 0, width: CARD_W, top: 190, textAlign: 'center', fontSize: 70, fontWeight: 900, color: P.muted}}>?</div>
			</BasketCard>
		))}
	</AbsoluteFill>
);
