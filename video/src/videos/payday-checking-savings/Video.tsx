import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {P} from './look';
import {SpeakerAvatars} from '../../story/components/SpeakerAvatars';
import {PaydayScene} from './scenes/PaydayScene';
import {CheckingScene} from './scenes/CheckingScene';
import {CarKeyScene} from './scenes/CarKeyScene';
import {SavingsScene} from './scenes/SavingsScene';

type Id = (typeof SCENES)[number]['id'];

/** Who's talking: friend on the left (her bubbles point left), Gio on the right. */
const Speakers: React.FC = () => (
	<SpeakerAvatars
		speakers={[
			{id: 'friend', label: 'FRIEND', initial: 'F', fill: '#FFFFFF', ink: '#0A0A0B'},
			{id: 'gio', label: 'GIO', initial: 'G', fill: P.accent, ink: '#04130C'},
		]}
		lineSpeaker={Object.fromEntries(SCRIPT.map((l) => [l.id, l.speaker ?? '']))}
	/>
);

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {payday: PaydayScene, checking: CheckingScene, carkey: CarKeyScene, savings: SavingsScene},
	overlay: Speakers,
	looks: {payday: P, checking: P, carkey: P, savings: P},
	transitions: {
		// the question pushes up and out as Gio's board rises in (answer replaces question)
		checking: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		// carkey: hard cut (0 frames) — the second question interrupts
		// emerald sweep = "here's the plan for that" — the board comes back
		savings: {presentation: panelSweep({color: P.accent, direction: 'left'}), timing: 'linear'},
	},
};

export const PaydayCheckingSavingsSchema = narratedSchema;
export const calculatePaydayCheckingSavingsMetadata = makeCalculateMetadata(DEF);

/** Payday: Checking vs High-Yield Savings — faceless two-voice dialogue. */
export const PaydayCheckingSavings: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
