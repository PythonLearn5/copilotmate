import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@copilotkit/react-core",
    "@copilotkit/react-ui",
    "@copilotkit/runtime",
    "@copilotkit/core",
    "@copilotkit/shared",
    "@ag-ui/client",
    "@ag-ui/core",
    "@copilotkit/a2ui-renderer",
    "@copilotkit/web-inspector",
  ],
  webpack(config, { webpack }) {
    // CopilotKit v2 CSS uses Tailwind v4 syntax that PostCSS/Tailwind v3 can't parse.
    // Replace the CSS import with an empty file; the real CSS is loaded via <link> in layout.tsx.
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /react-core[\\/]dist[\\/]v2[\\/]index\.css$/,
        path.resolve(__dirname, "src/empty.css")
      )
    );
    return config;
  },
};

export default nextConfig;
