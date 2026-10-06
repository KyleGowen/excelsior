import { createContext, useContext } from 'react';
import { defaultImageAssets, type ModuleImageAssets } from './cardImages';
export const ImageAssetsContext = createContext<ModuleImageAssets>(defaultImageAssets);
export function useImageAssets():ModuleImageAssets { return useContext(ImageAssetsContext); }
