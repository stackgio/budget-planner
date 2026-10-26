import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Bundled Inter (OFL, see public/fonts/LICENSE-Inter.txt) so renders look the
// same on every machine. loadFont() blocks rendering until each face is ready.
const faces: [family: string, file: string, weight: string][] = [
	['Inter', 'Inter-Regular.otf', '400'],
	['Inter', 'Inter-Medium.otf', '500'],
	['Inter', 'Inter-SemiBold.otf', '600'],
	['Inter', 'Inter-Bold.otf', '700'],
	['Inter', 'Inter-ExtraBold.otf', '800'],
	['Inter', 'Inter-Black.otf', '900'],
	['Inter Display', 'InterDisplay-Bold.otf', '700'],
	['Inter Display', 'InterDisplay-ExtraBold.otf', '800'],
	['Inter Display', 'InterDisplay-Black.otf', '900'],
];

export const fontsLoaded = Promise.all(
	faces.map(([family, file, weight]) => loadFont({family, url: staticFile(`fonts/${file}`), weight, format: 'opentype'})),
);
