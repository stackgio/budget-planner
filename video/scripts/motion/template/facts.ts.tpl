import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. Components import from here —
 * never type a figure into a scene. Hypothetical values must be labelled
 * "Example" on screen; personal values are exactly what the creator supplied.
 */
export const FACTS = {
	start: fact(1000, 'hypothetical', 'TODO: placeholder example'),
	end: fact(2500, 'hypothetical', 'TODO: placeholder example'),
};
