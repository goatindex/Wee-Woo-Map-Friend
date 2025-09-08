/**
 * Babel Configuration for WeeWoo Map Friend
 * ES6 module support with decorator compilation for InversifyJS
 */

export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['last 2 versions']
        },
        modules: false // Keep ES6 modules for modern browsers
      }
    ]
  ],
  
  plugins: [
    // Decorator support for InversifyJS
    ['@babel/plugin-proposal-decorators', { 'legacy': true }],
    // Class properties support
    ['@babel/plugin-proposal-class-properties', { 'loose': true }]
  ]
};

