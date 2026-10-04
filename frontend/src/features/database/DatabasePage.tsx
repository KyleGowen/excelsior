import { CardDatabaseModule } from './CardDatabaseModule';
import { ExcelsiorModuleHost } from '../../app/ExcelsiorModuleHost';
/** Route-only adapter. The same module is used by independent hosts. */
export default function DatabasePage() {
 return <ExcelsiorModuleHost><CardDatabaseModule /></ExcelsiorModuleHost>;
}
