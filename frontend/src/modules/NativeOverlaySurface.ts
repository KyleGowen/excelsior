import {createElement,useState,type ReactNode} from 'react';
import {OverlayHostProvider} from '../lib/layout/OverlayHostProvider';
/** Private parent variant: roots inherit layout/appearance and dispose with their surface. */
export function NativeOverlaySurface({ children }: { children: ReactNode }) {
 const [root, setRoot] = useState<HTMLDivElement | null>(null);
 return createElement('div', {className:'module-native-overlay-surface'}, createElement('div', {ref:setRoot,className:'module-native-overlay-root',role:'region','aria-label':'Native module overlay root'}), root ? createElement(OverlayHostProvider,{options:{root,position:'absolute'},children:createElement('div',{className:'module-native-content'},children)}) : null);
}
