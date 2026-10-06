import type {Meta,StoryObj} from '@storybook/react-vite';
/** The compiled consumer is a separate live fixture; gallery build is not its browser proof. */
const meta={title:'Modules/Built delivery proof',parameters:{withoutAuth:true,withoutRouter:true},render:()=> <p>The separately built consumer runs at <a href="http://127.0.0.1:5187/delivery-proof/">the local delivery preview</a>. Build and serve it before opening this link. The gallery does not start a server.</p>} satisfies Meta;
export default meta;
type Story=StoryObj<typeof meta>;
export const SeparateConsumer:Story={};
