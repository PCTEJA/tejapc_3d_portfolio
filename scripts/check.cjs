const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "../public");
execFileSync(process.execPath, ["--check", path.join(root, "app.js")], {
  stdio: "inherit",
});
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
if (new Set(ids).size !== ids.length) throw new Error("Duplicate HTML IDs");
for (const [, reference] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(https?:|mailto:|tel:)/.test(reference)) continue;
  if (reference.startsWith("#")) {
    if (!ids.includes(reference.slice(1)))
      throw new Error(`Missing anchor: ${reference}`);
  } else if (!fs.existsSync(path.join(root, reference)))
    throw new Error(`Missing asset: ${reference}`);
}
console.log(
  "Static site validated: JavaScript syntax, unique IDs, anchors, and local assets.",
);
