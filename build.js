// build.js
const fs = require("fs");
const path = require("path");
const buildAll = require("./src/build-all");

// 1. Load your master data
const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));

// 2. Ensure the public directory exists
const PUBLIC_DIR = path.join(__dirname, "public");
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR);
}

// 3. Run the builder
buildAll(data);
