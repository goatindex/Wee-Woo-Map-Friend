/**
 * Rollup Configuration for WeeWoo Map Friend
 * Builds modern ES modules while maintaining legacy compatibility
 */

import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Base configuration
const baseConfig = {
  external: [
    // Keep external libraries as externals (loaded via CDN)
    'leaflet',
    '@turf/turf',
    'proj4'
  ],
  output: {
    globals: {
      'leaflet': 'L',
      '@turf/turf': 'turf', 
      'proj4': 'proj4'
    }
  }
};

// Modern ES modules build
const modernConfig = {
  ...baseConfig,
  input: 'js/modules/app.js', // Will create this as the new entry point
  output: {
    ...baseConfig.output,
    file: 'dist/js/app.modern.js',
    format: 'es',
    sourcemap: isDevelopment
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      preventAssignment: true
    }),
    nodeResolve({
      preferBuiltins: false
    }),
    commonjs(),
    ...(isProduction ? [terser({
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      },
      mangle: {
        keep_fnames: true // Keep function names for debugging
      }
    })] : []),
    copy({
      targets: [
        // Copy assets that don't need processing
        { src: 'css/**/*', dest: 'dist/css' },
        // Note: GeoJSON files (103+ MB) are served directly from source for performance
        // They are loaded dynamically via fetch() and don't need to be bundled
        { src: 'in_app_docs/**/*', dest: 'dist/in_app_docs' },
        { src: 'manifest.json', dest: 'dist' },
        { src: 'sw.js', dest: 'dist' },
        { src: 'browserconfig.xml', dest: 'dist' },
        { src: '*.txt', dest: 'dist' },
        { src: '*.html', dest: 'dist' }, // Will need to update index.html separately
        { src: 'backend/**/*', dest: 'dist/backend' },
        { src: 'scripts/**/*', dest: 'dist/scripts' },
        { src: 'layersources', dest: 'dist' }
      ]
    })
  ]
};

// Legacy compatibility build (keeps current system working)
const legacyConfig = {
  ...baseConfig,
  input: 'js/legacy/bootstrap.js', // Will move current bootstrap here
  output: {
    ...baseConfig.output,
    file: 'dist/js/app.legacy.js', 
    format: 'iife',
    name: 'WeeWooMapApp',
    sourcemap: isDevelopment
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      preventAssignment: true
    }),
    nodeResolve({
      preferBuiltins: false
    }),
    commonjs(),
    ...(isDevelopment ? [] : [terser({
      compress: {
        drop_console: false,
        drop_debugger: true  
      }
    })])
  ]
};

// Export configuration based on environment
export default isDevelopment ? [modernConfig] : [modernConfig, legacyConfig];
