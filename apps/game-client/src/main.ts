import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Missing #app root");
}

void import("./game/GameApp").then(({ GameApp }) => {
  const game = new GameApp(root);
  game.start();
}).catch((error: unknown) => {
  console.error("RIW game runtime load failed", error);
  root.textContent = "Impossible de charger le jeu. Recharge la page.";
});

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.warn("RIW service worker registration failed", error);
    });
  });
}
