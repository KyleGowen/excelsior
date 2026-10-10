import type {Meta,StoryObj} from '@storybook/react-vite';
import {ExportDeckPanel} from '../features/deck-editor/ExportDeckPanel';
import {exportDeckFixture} from './exportDeckFixture';
const meta={title:'Decks/Server Export',component:ExportDeckPanel,args:{open:true,input:{deck:exportDeckFixture,topDeck:'Cards: 8/56 | Threat: 19/76\n\n-- Characters --\n1x Billy the Kid [ERB] [Frontline]'},onClose:()=>{}}} satisfies Meta<typeof ExportDeckPanel>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Ready:Story={};
export const Loading:Story={args:{loading:true}};
export const Unavailable:Story={args:{error:new Error('Fictional outage'),onRetry:()=>{}}};
