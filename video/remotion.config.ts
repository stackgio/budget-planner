import {Config} from '@remotion/cli/config';

// Stack With Gio export defaults: native 1080x1920 @ 30fps, H.264 MP4 (scale locked to 1).
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
Config.setColorSpace('bt709');
Config.setScale(1); // never render below the composition's native 1080x1920
