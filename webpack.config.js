const path = require("path");
const HtmlPlugin = require("html-webpack-plugin");
module.exports = {
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".mjs", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlPlugin({
      template: path.join(__dirname, "src/index.html"),
    }),
  ],
};
