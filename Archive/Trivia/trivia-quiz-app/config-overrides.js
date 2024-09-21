module.exports = function override(config, env) {
    // do stuff with the webpack config...
    config.module.rules.push({
      test: /\.(js|mjs|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          plugins: ['babel-plugin-transform-react-pug', 'babel-plugin-transform-react-jsx'],
        },
      },
    });
    return config;
  };