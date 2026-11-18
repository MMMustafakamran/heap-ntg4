// HARNESS: not from the docs. One Node server on :8153 that hosts a separate Copilot Runtime per
// doc page at /api/<page-id>/copilotkit, built from each page's pages/<id>/runtime.ts
// (default export: a CopilotRuntime, written from that page's own server snippet, verbatim where
// the page shows one). The quickstart keeps the doc's own server.ts on :8151.
// Page apps reach it at http://10.0.2.2:8153/api/<page-id>/copilotkit (Android emulator).
import { createServer } from "node:http";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { RUNTIMES } from "./pages/runtimes";

const listeners = Object.fromEntries(
  Object.entries(RUNTIMES).map(([id, runtime]) => [
    id,
    createCopilotNodeListener({ runtime, basePath: `/api/${id}/copilotkit`, cors: true }),
  ]),
);

const port = Number(process.env.PORT ?? 8153);
createServer((req, res) => {
  const id = req.url?.match(/^\/api\/([\w-]+)\/copilotkit/)?.[1];
  const l = id ? listeners[id] : undefined;
  if (!l) { res.writeHead(404).end(`HARNESS: no runtime for ${req.url}`); return; }
  return l(req, res);
}).listen(port, () => console.log(`harness runtimes on :${port}: ${Object.keys(listeners).join(", ") || "(none)"}`));
