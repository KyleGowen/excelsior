import { CollectionModule } from './CollectionModule';
import { ExcelsiorModuleHost } from '../../app/ExcelsiorModuleHost';
/** Route-only adapter. The same module is used by independent hosts. */
export default function CollectionPage() {
 return <ExcelsiorModuleHost><CollectionModule /></ExcelsiorModuleHost>;
}
