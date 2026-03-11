const fs = require("fs");
const path = require("path");

const pkgDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo-module-scripts",
);
const target = path.join(pkgDir, "tsconfig.base");
const source = path.join(pkgDir, "tsconfig.base.json");
const expoLocationTsconfig = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo-location",
  "tsconfig.json",
);

try {
  if (!fs.existsSync(pkgDir)) {
    process.exit(0);
  }

  if (!fs.existsSync(source)) {
    console.warn("[fix-tsconfig] source not found:", source);
    process.exit(0);
  }

  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, '{ "extends": "./tsconfig.base.json" }\n', "utf8");
    console.log("[fix-tsconfig] created", target);
  }

  if (fs.existsSync(expoLocationTsconfig)) {
    const content = fs.readFileSync(expoLocationTsconfig, "utf8");
    const fixed = content
      .replace(
        '"extends": "expo-module-scripts/tsconfig.base.json",',
        '"extends": "../expo-module-scripts/tsconfig.base.json",',
      )
      .replace(
        '"extends": "expo-module-scripts/tsconfig.base",',
        '"extends": "../expo-module-scripts/tsconfig.base.json",',
      );
    if (fixed !== content) {
      fs.writeFileSync(expoLocationTsconfig, fixed, "utf8");
      console.log("[fix-tsconfig] patched", expoLocationTsconfig);
    }
  }
} catch (error) {
  console.warn("[fix-tsconfig] skipped:", error.message);
}
