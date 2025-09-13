import { build } from 'vite';
import { analyze } from 'rollup-plugin-analyzer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function analyzeBuild() {
  try {
    console.log('📦 Bundle Analysis');
    console.log('================');
    
    const result = await build({
      plugins: [
        analyze({
          summaryOnly: true,
          writeTo: (analysis) => {
            console.log(analysis);
          }
        })
      ]
    });
    
    console.log('✅ Build analysis complete');
    return result;
  } catch (error) {
    console.error('❌ Build analysis failed:', error.message);
    process.exit(1);
  }
}

analyzeBuild().catch(console.error);

