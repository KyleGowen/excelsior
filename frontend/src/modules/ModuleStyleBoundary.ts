import { createElement, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
/// <reference types="vite/client" />
import styles from './moduleNativeStyles.css?inline';
import { scopeNativeStyles } from './nativeStyles';
export interface ModuleStyleOptions {
 mode: 'isolated';
 /** The host owns surface height. Defaults to 680px; positive finite pixels only. */
 height?: number;
}
const localStyles = scopeNativeStyles(styles) + `
:host { display:block; min-width:0; --module-root-font-size:16px; }
.module-native-root { all:initial; display:block; height:100%; min-width:0; color:var(--color-text); background:var(--color-bg-base); font:var(--font-size-base)/var(--line-normal) var(--font-sans); }
.module-native-root > .module-layout-container, .module-appearance, .module-native-overlay-surface { height:100%; min-height:0; }
.module-native-overlay-surface { position:relative; isolation:isolate; }
.module-native-content { height:100%; overflow:auto; min-width:0; overscroll-behavior:contain; }
.module-native-overlay-root { position:absolute; inset:0; z-index:var(--z-modal); pointer-events:none; }
.module-native-overlay-root > * { pointer-events:auto; }
`;
/** No stylesheet, reset, token or layout writes escape this surface. */
export default function ModuleStyleBoundary({ options, children }: { options: ModuleStyleOptions; children: ReactNode }) {
 const height = options.height ?? 680;
 if (options.mode !== 'isolated' || !Number.isFinite(height) || height <= 0) throw new Error('Isolated module height must be positive finite pixels');
 const element = useRef<HTMLDivElement>(null);
 const [surface, setSurface] = useState<HTMLElement | null>(null);
 useLayoutEffect(() => {
  const node = element.current!; const shadow = node.shadowRoot ?? node.attachShadow({ mode: 'open' });
  const sheet = node.ownerDocument.createElement('style'); sheet.textContent = localStyles;
  const target = node.ownerDocument.createElement('div'); target.className = 'module-native-root';
  shadow.append(sheet, target); setSurface(target);
  return () => { sheet.remove(); target.remove(); };
 }, []);
 return createElement('div',{ref:element,className:'module-style-boundary',style:{height,width:'100%',minWidth:0,containerType:'size',contain:'layout style size'}}, surface ? createPortal(children,surface) : null);
}
