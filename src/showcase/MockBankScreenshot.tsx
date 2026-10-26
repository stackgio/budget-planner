import React from 'react';
import {AbsoluteFill} from 'remotion';
import {fonts} from '../brand/theme';

// Generates public/samples/mock-bank-screenshot.png (a fake app screen, watermarked
// SAMPLE) for testing ScreenshotReveal. Real stories use real, consented screenshots.
//   npx remotion still MockBankScreenshot public/samples/mock-bank-screenshot.png
export const MockBankScreenshot: React.FC = () => {
	const row = (name: string, sub: string, amt: string, green = false) => (
		<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '34px 0', borderBottom: '2px solid #ECECEC'}}>
			<div>
				<div style={{fontSize: 40, fontWeight: 700}}>{name}</div>
				<div style={{fontSize: 30, color: '#8A8A8A', marginTop: 6}}>{sub}</div>
			</div>
			<div style={{fontSize: 42, fontWeight: 800, color: green ? '#0E9F55' : '#111'}}>{amt}</div>
		</div>
	);
	return (
		<AbsoluteFill style={{background: '#FFFFFF', fontFamily: fonts.body, color: '#111', padding: '120px 70px'}}>
			<div style={{fontSize: 34, color: '#8A8A8A'}}>Good morning,</div>
			<div style={{fontSize: 58, fontWeight: 800, marginTop: 6}}>Jordan Avery</div>
			<div style={{fontSize: 30, color: '#8A8A8A', marginTop: 10}}>jordan.avery@example.com</div>
			<div style={{marginTop: 70, padding: 50, borderRadius: 40, background: '#F3F6F4'}}>
				<div style={{fontSize: 32, color: '#6B6B6B'}}>Brokerage account ••••7310</div>
				<div style={{fontSize: 30, color: '#6B6B6B', marginTop: 40}}>Dividends this quarter</div>
				<div style={{fontSize: 110, fontWeight: 900, letterSpacing: '-0.03em', color: '#0E9F55'}}>$15.52</div>
			</div>
			<div style={{fontSize: 36, fontWeight: 800, marginTop: 70}}>Recent activity</div>
			{row('Dividend', 'Oct 26 · Cash dividend', '+$15.52', true)}
			{row('Buy order', 'Oct 18 · Index fund', '−$100.00')}
			{row('Deposit', 'Oct 15 · From checking', '+$100.00', true)}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 160,
					textAlign: 'center',
					fontSize: 150,
					fontWeight: 900,
					color: 'rgba(0,0,0,0.05)',
					rotate: '-18deg',
				}}
			>
				SAMPLE
			</div>
		</AbsoluteFill>
	);
};
