import React from 'react';
import {Composition, Folder, Still} from 'remotion';
import './brand/fonts';
import {CharacterSheet} from './showcase/CharacterSheet';
import {MockBankScreenshot} from './showcase/MockBankScreenshot';
import {
	ShowcaseCardFlip,
	ShowcaseCards,
	ShowcaseGrowthChart,
	ShowcaseHookAndEnd,
	ShowcaseKineticStory,
	ShowcaseProgressAndDebt,
	ShowcaseReceipt,
	ShowcaseScreenshot,
	ShowcaseSplitScreen,
	ShowcaseTimeline,
} from './showcase/Showcases';
import {calculateDividendMetadata, DividendMeme, dividendSchema} from './videos/dividend-1552/DividendMeme';

// All videos are 1080x1920 @ 30 fps. Add new videos under "Videos".
export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Folder name="Videos">
				<Composition
					id="DividendMeme"
					component={DividendMeme}
					schema={dividendSchema}
					calculateMetadata={calculateDividendMetadata}
					durationInFrames={420}
					fps={30}
					width={1080}
					height={1920}
					defaultProps={{amount: 15.52, app: 'BROKERAGE', showCaptions: true, showSafeZones: false}}
				/>
			</Folder>
			<Folder name="Components">
				<Composition id="GrowthChart" component={ShowcaseGrowthChart} durationInFrames={180} fps={30} width={1080} height={1920} defaultProps={{showSafeZones: false}} />
				<Composition id="Timeline" component={ShowcaseTimeline} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{showSafeZones: false}} />
				<Composition id="SplitScreen" component={ShowcaseSplitScreen} durationInFrames={120} fps={30} width={1080} height={1920} defaultProps={{showSafeZones: false}} />
				<Composition id="DebtAndProgress" component={ShowcaseProgressAndDebt} durationInFrames={140} fps={30} width={1080} height={1920} defaultProps={{showSafeZones: false}} />
				<Composition id="TapToPay" component={ShowcaseCards} durationInFrames={110} fps={30} width={1080} height={1920} defaultProps={{showSafeZones: false}} />
				<Composition id="CardFlip" component={ShowcaseCardFlip} durationInFrames={100} fps={30} width={1080} height={1920} defaultProps={{showSafeZones: false}} />
				<Composition id="Receipt" component={ShowcaseReceipt} durationInFrames={100} fps={30} width={1080} height={1920} defaultProps={{showSafeZones: false}} />
				<Composition id="ScreenshotReveal" component={ShowcaseScreenshot} durationInFrames={110} fps={30} width={1080} height={1920} defaultProps={{showSafeZones: false}} />
				<Composition id="KineticStory" component={ShowcaseKineticStory} durationInFrames={372} fps={30} width={1080} height={1920} defaultProps={{showSafeZones: false}} />
				<Composition id="HookAndEnd" component={ShowcaseHookAndEnd} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{showSafeZones: false}} />
			</Folder>
			<Folder name="Reference">
				<Still id="CharacterSheet" component={CharacterSheet} width={1080} height={1920} />
				<Still id="MockBankScreenshot" component={MockBankScreenshot} width={1080} height={1920} />
			</Folder>
		</>
	);
};
