#!/usr/bin/env node
// Scaffold a new /motion video and register its composition.
// Usage: node scripts/motion/new-video.mjs <slug> <CompositionId> <mode> "<title>"
//   slug: kebab-case (src/videos/<slug>/)   CompositionId: PascalCase, letters/digits only
//   mode: personal-journey|education|historical-graph|budget|meme|dividend|motivational
// Refuses to touch an existing slug or composition id.
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const [slug, comp, mode, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(' ') || slug;
const MODES = ['personal-journey', 'education', 'historical-graph', 'budget', 'meme', 'dividend', 'motivational'];
const die = (m) => { console.error('new-video:', m); process.exit(1); };
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) die('slug must be kebab-case');
if (!comp || !/^[A-Z][A-Za-z0-9]*$/.test(comp)) die('CompositionId must be PascalCase letters/digits');
if (!MODES.includes(mode)) die(`mode must be one of ${MODES.join(', ')}`);
const dir = path.join(root, 'src/videos', slug);
if (existsSync(dir)) die(`src/videos/${slug} already exists — pick a new slug (e.g. ${slug}-v2)`);
const rootFile = path.join(root, 'src/StoryRoot.tsx');
let rootSrc = readFileSync(rootFile, 'utf8');
if (new RegExp(`id="${comp}"`).test(rootSrc) || /id="(GraphVideo)"/.test(`id="${comp}"`)) die(`composition ${comp} already exists`);
if (!rootSrc.includes('// @motion-imports') || !rootSrc.includes('{/* @motion-compositions')) die('StoryRoot.tsx markers missing');

const fill = (s) => s.replaceAll('__COMP__', comp).replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title.replace(/'/g, "\\'")).replaceAll('__MODE__', mode);
const tpl = path.join(here, 'template');
const copyDir = (from, to) => {
	mkdirSync(to, {recursive: true});
	for (const e of readdirSync(from, {withFileTypes: true})) {
		if (e.isDirectory()) copyDir(path.join(from, e.name), path.join(to, e.name));
		else if (e.name.endsWith('.tpl')) writeFileSync(path.join(to, e.name.replace(/\.tpl$/, '')), fill(readFileSync(path.join(from, e.name), 'utf8')));
	}
};
copyDir(tpl, dir);
mkdirSync(path.join(root, 'public/motion', slug, 'assets'), {recursive: true});

rootSrc = rootSrc
	.replace('// @motion-imports', `import {${comp}, ${comp}Schema, calculate${comp}Metadata} from './videos/${slug}/Video';\n// @motion-imports`)
	.replace(
		'{/* @motion-compositions',
		`<Composition id="${comp}" component={${comp}} schema={${comp}Schema} width={story.width} height={story.height} fps={story.fps} durationInFrames={900} defaultProps={${comp}Schema.parse({})} calculateMetadata={calculate${comp}Metadata} />\n\t\t{/* @motion-compositions`,
	);
writeFileSync(rootFile, rootSrc);
console.log(`created src/videos/${slug}/ (script.ts, facts.ts, Video.tsx, qc.ts, scenes/) and public/motion/${slug}/assets/`);
console.log(`registered composition ${comp} in src/StoryRoot.tsx`);
