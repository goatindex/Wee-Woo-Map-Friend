/**
 * Babel Configuration for WeeWoo Map Friend
 * Transforms ES6 modules for Jest testing
 */

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        },
        modules: 'commonjs' // Transform ES6 modules to CommonJS for Jest
      }
    ]
  ],
  
  plugins: [
    // Add any additional plugins if needed
  ],
  
  // Environment-specific configuration
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            },
            modules: 'commonjs'
          }
        ]
      ]
    },
    development: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['last 2 versions']
            },
            modules: false // Keep ES6 modules in development
          }
        ]
      ]
    },
    production: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['last 2 versions']
            },
            modules: false // Keep ES6 modules in production
          }
        ]
      ]
    }
  }
};

