/**
 * custom-server.js
 *
 * Wraps the Next.js standalone server with a lightweight buffering proxy.
 *
 * Why: Next.js App Router sends HTML responses via HTTP streaming (chunked
 * transfer encoding). The initial flush contains the HTML shell (<!DOCTYPE>,
 * <html>, <head>, <link rel="stylesheet">, etc.). AWS API Gateway HTTP API
 * drops this first chunk when proxying through a VPC Link, resulting in pages
 * that are missing their DOCTYPE, <html> wrapper, and CSS — i.e. a blank page.
 *
 * Fix: For text/html responses the proxy collects all chunks, then sends the
 * complete body with a Content-Length header (no chunked encoding). Non-HTML
 * traffic (JS, CSS, JSON, images, …) is piped through untouched.
 */

const http = require("http");

/* ── Configuration ──────────────────────────────────────────────────────── */

const LISTEN_PORT = parseInt(process.env.PORT, 10) || 3000;
const LISTEN_HOST = process.env.HOSTNAME || "0.0.0.0";
const NEXT_INTERNAL_PORT = LISTEN_PORT + 1;

/* ── 1. Boot the Next.js standalone server on an internal port ────────── */

process.env.PORT = String(NEXT_INTERNAL_PORT);
process.env.HOSTNAME = "127.0.0.1";
require("./server");

/* ── 2. Buffering reverse-proxy ───────────────────────────────────────── */

function createProxy() {
  return http.createServer((clientReq, clientRes) => {
    const proxyOpts = {
      hostname: "127.0.0.1",
      port: NEXT_INTERNAL_PORT,
      path: clientReq.url,
      method: clientReq.method,
      headers: clientReq.headers,
    };

    const proxyReq = http.request(proxyOpts, (upstreamRes) => {
      const contentType = upstreamRes.headers["content-type"] || "";

      if (contentType.includes("text/html")) {
        // Buffer the full HTML response before forwarding
        const chunks = [];
        upstreamRes.on("data", (chunk) => chunks.push(chunk));
        upstreamRes.on("end", () => {
          const body = Buffer.concat(chunks);
          const headers = Object.assign({}, upstreamRes.headers);
          headers["content-length"] = String(body.length);
          delete headers["transfer-encoding"];
          clientRes.writeHead(upstreamRes.statusCode, headers);
          clientRes.end(body);
        });
      } else {
        // Stream everything else (JS, CSS, JSON, images, …) directly
        clientRes.writeHead(upstreamRes.statusCode, upstreamRes.headers);
        upstreamRes.pipe(clientRes);
      }
    });

    proxyReq.on("error", (err) => {
      console.error("[proxy] upstream error:", err.message);
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { "content-type": "text/plain" });
      }
      clientRes.end("Bad Gateway");
    });

    clientReq.pipe(proxyReq);
  });
}

/* ── 3. Wait for Next.js, then start the proxy ───────────────────────── */

function waitForNextJs(retries) {
  if (retries <= 0) {
    console.error("[proxy] Next.js failed to start — giving up.");
    process.exit(1);
  }

  const req = http.get(
    `http://127.0.0.1:${NEXT_INTERNAL_PORT}/healthz`,
    (res) => {
      res.resume(); // drain response
      const proxy = createProxy();
      proxy.listen(LISTEN_PORT, LISTEN_HOST, () => {
        console.log(
          `> Buffering proxy on http://${LISTEN_HOST}:${LISTEN_PORT} → Next.js :${NEXT_INTERNAL_PORT}`
        );
      });
    }
  );
  req.on("error", () => setTimeout(() => waitForNextJs(retries - 1), 500));
}

setTimeout(() => waitForNextJs(60), 1000); // up to 30 s
