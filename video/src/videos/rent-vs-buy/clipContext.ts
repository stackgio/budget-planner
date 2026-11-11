import React from 'react';

/** Which standalone excerpt is being rendered (null = the full video). Scenes use it for small opening adjustments. */
export type ClipId = 'parents' | 'repair' | 'afford';
export const ClipContext = React.createContext<ClipId | null>(null);
export const useClip = () => React.useContext(ClipContext);
