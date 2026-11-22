/** Story beats checked frame-by-frame in QC (absolute frames). */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['checking_header', f('G1', 'checking.', 0.35)],
	['rent', f('G1', 'rent,', 0.3)],
	['gas', f('G1', 'gas.', 0.35)],
	['key_breaks_down', f('F2', 'breaks', 0.4)],
	['emergency_label', f('G2', 'emergency', 0.4)],
	['hys_header', f('G2', 'savings', 0.35)],
	['interest_chip', f('G2', 'interest', 0.35)],
	['set_aside', f('G2', 'aside.', 0.4)],
];
