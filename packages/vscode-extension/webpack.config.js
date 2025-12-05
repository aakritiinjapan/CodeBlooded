const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    target: 'node',
    entry: './src/extension.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    devtool: isProduction ? 'hidden-source-map' : 'source-map',
    externals: {
      vscode: 'commonjs vscode'
    },
    resolve: {
      extensions: ['.ts', '.js', '.mjs'],
      extensionAlias: {
        '.js': ['.js', '.ts'],
        '.mjs': ['.mjs', '.mts']
      },
      fullySpecified: false
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: isProduction,
                compilerOptions: {
                  sourceMap: !isProduction
                }
              }
            }
          ]
        },
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false
          }
        }
      ]
    },
    optimization: {
      minimize: isProduction,
      usedExports: false
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  };
};
