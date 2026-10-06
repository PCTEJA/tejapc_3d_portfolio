const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../public");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
};
const server = http.createServer((request, response) => {
  if (request.url === "/chat") {
    response.writeHead(503, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        error:
          "Static preview. Run the Express server with OPENAI_API_KEY for the assistant.",
      }),
    );
    return;
  }
  let filename;
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    filename = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (!filename.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  fs.stat(filename, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type":
        types[path.extname(filename)] || "application/octet-stream",
    });
    fs.createReadStream(filename).pipe(response);
  });
});
const port = process.env.PORT || 4173;
server.listen(port, "127.0.0.1", () =>
  console.log(`Portfolio preview: http://127.0.0.1:${port}`),
);
