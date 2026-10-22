import {Config} from '@remotion/cli/config';

// Use the preinstalled headless Chromium (override with REMOTION_BROWSER if needed).
Config.setBrowserExecutable(
  process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
);
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setCrf(12);
Config.setConcurrency(4);
