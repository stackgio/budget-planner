#!/usr/bin/env node
// Generate a dot-matrix world map (equirectangular) for story videos.
// Each dot is tagged with whether it falls inside the United States.
// Data: Natural Earth 1:110m countries via the `world-atlas` npm package.
//
// Usage (deps are only needed to regenerate, not to render):
//   npm i --prefix /tmp/geo world-atlas@2.0.2 d3-geo@3.1.1 topojson-client@3.1.0
//   node scripts/motion/make-dotmap.mjs /tmp/geo/node_modules > src/story/components/worldDots.json
import {createRequire} from 'module';
import path from 'path';

const mods = process.argv[2];
if (!mods) throw new Error('usage: make-dotmap.mjs <node_modules dir with world-atlas, d3-geo, topojson-client>');
const req = createRequire(path.join(path.resolve(mods), 'x.js'));
const {geoContains} = req('d3-geo');
const {feature} = req('topojson-client');
const topo = req('world-atlas/countries-110m.json');
const countries = feature(topo, topo.objects.countries).features;

const LON0 = -170, LON1 = 190, LAT0 = 78, LAT1 = -56, STEP = 2.6; // degrees per dot
const US = '840';
const dots = [];
for (let lat = LAT0; lat >= LAT1; lat -= STEP) {
	for (let lon = LON0; lon <= LON1; lon += STEP) {
		const L = lon > 180 ? lon - 360 : lon;
		const c = countries.find((f) => f.id !== '010' && geoContains(f, [L, lat])); // skip Antarctica
		if (!c) continue;
		dots.push([+((lon - LON0) / (LON1 - LON0)).toFixed(4), +((LAT0 - lat) / (LAT0 - LAT1)).toFixed(4), c.id === US ? 1 : 0]);
	}
}
// [u, v, isUS] with u,v in 0..1 of the map rectangle (aspect = (LON1-LON0)/(LAT0-LAT1))
process.stdout.write(JSON.stringify({aspect: +((LON1 - LON0) / (LAT0 - LAT1)).toFixed(4), source: 'Natural Earth 1:110m (world-atlas 2.0.2)', dots}));
