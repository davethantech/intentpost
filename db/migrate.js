require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("./index");

(async () => {
  await db.init();
  const dir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort();
  for (const file of files) {
    console.log(`Applying ${file}`);
    await db.query(fs.readFileSync(path.join(dir, file), "utf8"));
  }
  await db.close();
  console.log(`Migration complete: ${files.length} migrations`);
})().catch(async e => { console.error(e); try { await db.close(); } catch {} process.exit(1); });
