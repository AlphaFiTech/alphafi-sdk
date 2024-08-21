const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  target: "node",
  mode: "production", // or 'development' depending on your needs
  module: {
    rules: [
      {
        test: /\.graphql$/,
        exclude: /node_modules/,
        loader: "graphql-tag/loader",
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-typescript"],
            },
          },
          "ts-loader",
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
          "source-map-loader",
        ],
        enforce: "pre",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".graphql"],
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    library: {
      name: "AlphaFiSDK", // Replace with your library name
      type: "umd",
    },
    globalObject: "this",
  },
  devtool: "source-map",
  performance: {
    hints: "warning",
  },
  plugins: [
    new CleanWebpackPlugin(), // Clean output directory before build
  ],
  externals: {
    lodash: {
      commonjs: "lodash",
      commonjs2: "lodash",
      amd: "lodash",
      root: "_",
    },
    react: {
      commonjs: "react",
      commonjs2: "react",
      amd: "react",
      root: "React",
    },
  },
};
