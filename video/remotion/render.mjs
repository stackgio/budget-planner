import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const id = process.argv[2] || 'Main';
const out = process.argv[3] || `out/${id}.mp4`;
const stills = process.argv.slice(4).map(Number);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id, browserExecutable});
if (stills.length) {
  for (const f of stills) {
    await renderStill({serveUrl, composition, frame: f, output: `${process.env.STILLS || 'out/stills'}/f${String(f).padStart(4,'0')}.png`, browserExecutable});
  }
} else {
  await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: out, browserExecutable,
    crf: 16, pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '320k', x264Preset: 'slow', concurrency: 4,
    onProgress: ({progress}) => { if (Math.round(progress*100)%10===0) process.stdout.write(`\r${Math.round(progress*100)}%`); }});
}
console.log('\ndone');
