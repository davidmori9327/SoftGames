const path = require("path");

module.exports = {
  entry: "./src/index.ts",

  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    publicPath: "/",
    assetModuleFilename: "assets/[name][ext]"
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
        use: "ts-loader",
        exclude: /node_modules/,
      },

      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: "asset/resource",
      }
    ]
  },

  devServer: {
    static: [
      {
        directory: path.join(__dirname),
        publicPath: "/",
      },
      {
        directory: path.join(__dirname, "src/assets"),
        publicPath: "/assets",
      }
    ],

    historyApiFallback: { index: "/index.html" },
    hot: true,
    port: 8080,
    open: true,
  }
};
