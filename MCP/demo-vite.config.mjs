import {fileURLToPath} from 'node:url';
import {defineConfig} from '../FE/node_modules/vite/dist/node/index.js';
import react from '../FE/node_modules/@vitejs/plugin-react/dist/index.js';
export default defineConfig({root:fileURLToPath(new URL('../FE',import.meta.url)),plugins:[react()],server:{host:'127.0.0.1',port:15174,strictPort:true,proxy:{'/api':'http://127.0.0.1:18081'}}});
