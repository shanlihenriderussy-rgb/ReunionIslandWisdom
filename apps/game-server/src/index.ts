import { createServer } from "node:http";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { worldRoomName } from "@riw/shared";
import { ReunionWorldRoom } from "./rooms/ReunionWorldRoom.js";

const port = Number.parseInt(process.env.PORT ?? "2567", 10);
const host = process.env.HOST ?? "0.0.0.0";

// Serveur HTTP minimal : repond aux health checks (Fly.io / load balancer).
// Le matchmaking Colyseus 0.16 (@colyseus/ws-transport) passe par l'upgrade
// WebSocket, pas par une route HTTP : le listener 'request' ci-dessous est
// donc libre et n'entre pas en conflit avec le transport (qui ecoute 'upgrade').
const httpServer = createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/health" || req.url === "/healthz")) {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
});

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer })
});

gameServer.define(worldRoomName, ReunionWorldRoom);

httpServer.listen(port, host, () => {
  console.log(`RIW game server listening on ${host}:${port} (ws + /health)`);
});
