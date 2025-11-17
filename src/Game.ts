import * as PIXI from "pixi.js";
import { SceneBase } from "./scenes/SceneBase";
import { MenuScene } from "./scenes/MenuScene";

export class Game {
    public app: PIXI.Application;
    private currentScene: SceneBase | null = null;
    private escListener = (event: KeyboardEvent) => this.onKeyDown(event);
    private fullscreenListener = () => this.onFullscreenChange();
    private pendingMenuReturn = false;

    constructor(app: PIXI.Application) {
        this.app = app;

        this.changeScene(new MenuScene(this));
        window.addEventListener("keydown", this.escListener);
        document.addEventListener("fullscreenchange", this.fullscreenListener);
    }

    
    public changeScene(newScene: SceneBase) {
        if (this.currentScene) {
            this.currentScene.destroy();
        }

        this.currentScene = newScene;
        this.currentScene.init();
    }

    private onKeyDown(event: KeyboardEvent) {
        if (event.key !== "Escape") return;

        if (document.fullscreenElement) {
            this.pendingMenuReturn = true;
            document.exitFullscreen?.();
        } else {
            this.returnToMenu();
        }
    }

    private onFullscreenChange() {
        if (!document.fullscreenElement && this.pendingMenuReturn) {
            this.pendingMenuReturn = false;
            this.returnToMenu();
        }
    }

    private returnToMenu() {
        if (!(this.currentScene instanceof MenuScene)) {
            this.changeScene(new MenuScene(this));
        }
    }
}
