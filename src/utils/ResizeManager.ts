import * as PIXI from "pixi.js";


export class ResizeManager {
    private app: PIXI.Application;

    constructor(app: PIXI.Application) {
        this.app = app;

        this.resize();

        window.addEventListener("resize", () => this.resize());

        window.addEventListener("orientationchange", () => {
            setTimeout(() => this.resize(), 250);
        });
    }

    private resize() {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);

        PIXI.settings.RESOLUTION = window.devicePixelRatio || 1;
    }
}
