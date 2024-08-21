const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  target: "web",
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
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-typescript"],
            },
          },
          "ts-loader",
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "umd",
    globalObject: "this",
  },
  devtool: "source-map", // Generate source maps
  performance: {
    hints: "warning",
    maxAssetSize: 1024000, // Set size in bytes (1 MiB)
    maxEntrypointSize: 1048576, // Set size in bytes (1 MiB)
  },
  plugins: [
    new CleanWebpackPlugin(), // Clean output directory before build
  ],
};
