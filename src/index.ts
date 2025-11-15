import * as PIXI from "pixi.js";
import { Game } from "./Game";
import { ResizeManager } from "./utils/ResizeManager";
import { FPSCounter } from "./utils/FPSCounter";

window.onload = async () => {
    // Create PIXI App
    const app = new PIXI.Application({
        background: "#000000",
        resizeTo: window,
        antialias: true,
    });

    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
    
    document.body.appendChild(app.view as any);

    // Enable fullscreen on click
    document.body.onclick = () => {
        if (document.fullscreenElement == null) {
            document.body.requestFullscreen().catch(() => {});
        }
    };

    // Resize handling
    new ResizeManager(app);

    // FPS Counter
    const fps = new FPSCounter();
    app.stage.addChild(fps);

    // Start the game
    new Game(app);
};
