/** Extra QC beats (absolute frames). */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['basket_tiles_in', f('L4', 'stocks', 0.6)],
	['voo_owned', f('L7', 'own', 0.4)],
	['voo_500', f('L8', 'companies', 0.2)],
	['apple_msft_focus', f('L9', 'Microsoft', 0.6)],
	['voo_to_vti_mid', f('L10', 'VTI', 0.35)],
	['vti_full', f('L12', 'market', 0.3)],
	['vt_world', f('L14', 'countries', 0.2)],
	['vxus_dim', f('L15', 'part', 0.3)],
	['voo_plus_vxus', f('L16', 'VXUS', 0.4)],
	['schd_cash', f('L18', 'payment', 0.3)],
	['schd_change', f('L19', 'change', 0.3)],
	['overlap', f('L21', 'companies', 0.2)],
	['vt_one_fund', f('L22', 'first', 0.3)],
	['disclaimer', f('L23', 'advice', 0)],
	['end_card', f('L24', 'ETF', 0.5)],
];
