import "./styles.css";
import { GameApp } from "./game/GameApp";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Missing #app root");
}

const game = new GameApp(root);
game.start();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.warn("RIW service worker registration failed", error);
    });
  });
}