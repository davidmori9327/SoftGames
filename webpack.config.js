const path = require("path");

module.exports = {
  entry: "./src/index.ts",

  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },

  mode: "development",

  devtool: "source-map",

  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      }
    ]
  },

  devServer: {
    static: [
      {
        directory: path.join(__dirname),
        publicPath: "/",
      }
    ],
    historyApiFallback: true,
    compress: true,
    port: 8080,
    hot: true,
    open: true,
  }
};
