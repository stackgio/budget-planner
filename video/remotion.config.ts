import {Config} from '@remotion/cli/config';

// Stack With Gio export defaults: 1080x1920 @ 30fps, H.264 MP4, no audio.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
Config.setColorSpace('bt709');
