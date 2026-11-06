// Builds two outputs from src/:
//   site/index.html            standalone website (Netlify), React served from site/vendor
//   dist/artifact.html         the claude.ai artifact version (React from cdnjs)
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const r = (...p) => path.join(root, ...p);

const out = await esbuild.build({
  entryPoints: [r("src/app.jsx")], bundle: true, format: "iife", write: false,
  jsx: "transform", jsxFactory: "React.createElement", jsxFragment: "React.Fragment",
  target: "es2019", minify: true, legalComments: "none",
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const shell = fs.readFileSync(r("src/shell-artifact.html"), "utf8");

// claude.ai artifact
fs.mkdirSync(r("dist"), { recursive: true });
fs.writeFileSync(r("dist/artifact.html"), shell.replace("/*APP*/", () => js));

// standalone site
const cut = shell.indexOf('<div id="root"></div>');
const headPart = shell.slice(0, cut).replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "");
const site = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Track transfers into Bills Checking, bill payments, and money you hold for your uncle.">
<meta name="theme-color" content="#0c100f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Money">
<meta name="robots" content="noindex">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${headPart}</head>
<body>
<div id="root"></div>
<noscript>Money Command Center needs JavaScript turned on.</noscript>
<script src="/vendor/react.production.min.js"></script>
<script src="/vendor/react-dom.production.min.js"></script>
<script>
${js}
</script>
</body>
</html>
`;
fs.mkdirSync(r("site/vendor"), { recursive: true });
fs.writeFileSync(r("site/index.html"), site);
for (const [pkg, file] of [["react", "react.production.min.js"], ["react-dom", "react-dom.production.min.js"]])
  fs.copyFileSync(r("node_modules", pkg, "umd", file), r("site/vendor", file));
console.log("site/index.html", site.length, "bytes; dist/artifact.html written");
