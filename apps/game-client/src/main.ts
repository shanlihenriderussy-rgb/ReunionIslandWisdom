import "./styles.css";
import { GameApp } from "./game/GameApp";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Missing #app root");
}

const game = new GameApp(root);
game.start();
