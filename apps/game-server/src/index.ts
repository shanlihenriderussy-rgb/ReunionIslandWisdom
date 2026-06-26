import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { worldRoomName } from "@riw/shared";
import { ReunionWorldRoom } from "./rooms/ReunionWorldRoom.js";

const port = Number.parseInt(process.env.PORT ?? "2567", 10);
const host = process.env.HOST ?? "0.0.0.0";

type TextResponse = {
  type: (contentType: string) => {
    send: (body: string) => void;
  };
};

const healthHandler = (_req: unknown, res: TextResponse) => {
  res.type("text/plain").send("ok");
};

const gameServer = new Server({
  transport: new WebSocketTransport(),
  express: (app) => {
    app.get("/health", healthHandler);
    app.get("/healthz", healthHandler);
  }
});

gameServer.define(worldRoomName, ReunionWorldRoom);

await gameServer.listen(port, host, undefined, () => {
  console.log(`RIW game server listening on ${host}:${port} (ws + /health)`);
});
