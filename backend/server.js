const http = require("node:http");
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("library.db");

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/publish") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const data = JSON.parse(body);
      // 1. Update SQLite
      db.prepare("UPDATE performances SET status = ? WHERE id = ?").run(
        data.status,
        data.id,
      );

      // 2. Trigger Surgical Rebuild
      require("../src/update-one").rebuild(data.artistName);

      res.end("Published");
    });
  }
});
server.listen(3000);
