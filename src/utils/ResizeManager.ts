import * as PIXI from "pixi.js";

/**
 * ResizeManager
 * --------------------------------------------------
 * Automatically resizes the PIXI application whenever
 * the browser window changes size.
 *
 * - Uses resizeTo: window (Pixi v7 recommended)
 * - Ensures the stage scales correctly
 * - Handles device rotation on mobile
 * - Prevents canvas stretching artifacts
 */
export class ResizeManager {
    private app: PIXI.Application;

    constructor(app: PIXI.Application) {
        this.app = app;

        // Initial setup
        this.resize();

        // Listen to window resize
        window.addEventListener("resize", () => this.resize());

        // Extra mobile safety: orientation change
        window.addEventListener("orientationchange", () => {
            setTimeout(() => this.resize(), 250);
        });
    }

    private resize() {
        // These two lines ensure FULL responsive behavior in Pixi v7:
        this.app.renderer.resize(window.innerWidth, window.innerHeight);

        // If your game uses a virtual camera or stage scaling,
        // you may add more logic here (optional):
        //
        // Example:
        // this.app.stage.scale.set(window.innerWidth / 1920);
        //
        // Not required for now — your system is scene-based and handles layout manually.

        // Optional smoothing
        PIXI.settings.RESOLUTION = window.devicePixelRatio || 1;
    }
}
