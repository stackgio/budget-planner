import React from 'react';
import {Img, staticFile} from 'remotion';
import {Screenshot, type Region} from '../../../story/components/Screenshot';
import {editorial} from '../../../story/theme';
import {CFPB_LOGO} from '../assets';

/**
 * A readable regulator card: the CFPB's own logo crop on top, then the release's own
 * headline + date crop (both untouched pixels), with green marks on the finding being discussed.
 */
export const SourceCard: React.FC<{
	src: string;
	natural: {w: number; h: number};
	w: number;
	marks: {r: Region; t: number}[];
	style?: React.CSSProperties;
}> = ({src, natural, w, marks, style}) => {
	const imgH = (natural.h / natural.w) * w;
	return (
		<div style={{position: 'absolute', width: w + 48, padding: '24px 24px 20px', boxSizing: 'border-box', background: '#FFFFFF', borderRadius: 30, boxShadow: '0 30px 60px rgba(30,25,15,0.22)', ...style}}>
			<Img src={staticFile(CFPB_LOGO.src)} style={{height: 58, width: (CFPB_LOGO.natural.w / CFPB_LOGO.natural.h) * 58, display: 'block'}} />
			<div style={{height: 3, background: '#E6E6E6', margin: '16px 0 18px'}} />
			<div style={{position: 'relative', width: w, height: imgH}}>
				<Screenshot src={src} natural={natural} w={w} frame="none" palette={editorial} marks={marks} />
			</div>
		</div>
	);
};
