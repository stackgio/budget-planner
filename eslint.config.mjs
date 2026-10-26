import { config } from "@remotion/eslint-config-flat";

export default [
  // The template contains placeholders (__NAME__) until scripts/new-video.sh fills them in.
  { ignores: ["src/videos/_template/**"] },
  ...config,
];
