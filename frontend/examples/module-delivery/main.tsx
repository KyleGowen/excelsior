import { createRoot } from 'react-dom/client';
import { BuiltModuleDemo } from './BuiltModuleDemo';
import '../../dist/modules/fonts.css';
import './host.css';
createRoot(document.getElementById('root')!).render(<BuiltModuleDemo />);
