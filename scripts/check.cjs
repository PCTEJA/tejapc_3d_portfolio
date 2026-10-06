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
for (const [, candidates] of html.matchAll(/\b(?:srcset|imagesrcset)="([^"]+)"/g)) {
  for (const candidate of candidates.split(",")) {
    const reference = candidate.trim().split(/\s+/)[0];
    if (!fs.existsSync(path.join(root, reference)))
      throw new Error(`Missing responsive image: ${reference}`);
  }
}
const css = ["style.css", "reference.css"]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
for (const [, reference] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  if (/^(https?:|data:|#)/.test(reference)) continue;
  if (!fs.existsSync(path.join(root, reference)))
    throw new Error(`Missing stylesheet asset: ${reference}`);
}
console.log(
  "Static site validated: JavaScript syntax, unique IDs, anchors, responsive images, fonts, and local assets.",
);
