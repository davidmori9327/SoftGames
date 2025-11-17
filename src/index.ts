import * as PIXI from "pixi.js";
import { Game } from "./Game";
import { ResizeManager } from "./utils/ResizeManager";
import { FPSCounter } from "./utils/FPSCounter";

window.onload = async () => {
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

    document.body.onclick = () => {
        if (document.fullscreenElement == null) {
            document.body.requestFullscreen().catch(() => {});
        }
    };

    new ResizeManager(app);

    const fps = new FPSCounter();
    app.stage.addChild(fps);

    new Game(app);
};
