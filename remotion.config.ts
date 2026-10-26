/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// Stack With Gio defaults: H.264 MP4 + AAC, 30 fps set per composition.
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709"); // TV-range BT.709: what TikTok/Reels/Shorts expect
Config.setCrf(16);
Config.setAudioCodec("aac");
Config.setAudioBitrate("320k");
Config.setJpegQuality(95);

// Optional: use an existing Chrome Headless Shell instead of downloading one
// (e.g. offline machines or locked-down CI).
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
