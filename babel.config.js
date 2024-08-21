module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          browsers: "> 0.25%, not dead",
          node: "current",
        },
        useBuiltIns: "usage",
        corejs: 3,
      },
    ],
    "@babel/preset-typescript",
  ],
  plugins: [
    [
      "babel-plugin-polyfill-corejs3",
      {
        method: "usage-pure",
        targets: { chrome: 80, node: "current" },
      },
    ],
    [
      "@babel/plugin-transform-runtime",
      {
        corejs: 3,
        helpers: true,
        regenerator: true,
        useESModules: false,
      },
    ],
  ],
};
