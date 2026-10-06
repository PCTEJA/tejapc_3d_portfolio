const fs = require("node:fs");
const path = require("node:path");
const target = path.resolve(__dirname, "../public/vendor");
const source = path.resolve(__dirname, "../node_modules/three");
fs.mkdirSync(target, { recursive: true });
for (const file of ["three.module.min.js", "three.core.min.js"]) {
  fs.copyFileSync(path.join(source, "build", file), path.join(target, file));
}
fs.copyFileSync(path.join(source, "LICENSE"), path.join(target, "THREE-LICENSE.txt"));
