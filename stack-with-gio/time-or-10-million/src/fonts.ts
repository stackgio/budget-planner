import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT} from './theme';

const faces: [string, number][] = [
  ['fonts/InterDisplay-SemiBold.otf', 600],
  ['fonts/InterDisplay-ExtraBold.otf', 800],
  ['fonts/InterDisplay-Black.otf', 900],
];

let pending: Promise<void> | null = null;
const loadFonts = () => {
  pending =
    pending ??
    Promise.all(
      faces.map(([file, weight]) => {
        const face = new FontFace(FONT, `url(${staticFile(file)})`, {weight: String(weight)});
        return face.load().then((f) => {
          document.fonts.add(f);
        });
      }),
    ).then(() => undefined);
  return pending;
};

/** Holds the render until local fonts are loaded, so text measurement and layout never reflow. */
export const useFontsReady = () => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadFonts()
      .catch((err) => console.error(err))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready;
};
