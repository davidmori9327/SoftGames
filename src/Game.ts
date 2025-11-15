import * as PIXI from "pixi.js";
import { SceneBase } from "./scenes/SceneBase";
import { MenuScene } from "./scenes/MenuScene";

export class Game {
    public app: PIXI.Application;
    private currentScene: SceneBase | null = null;

    constructor(app: PIXI.Application) {
        this.app = app;

        // Load initial scene:
        this.changeScene(new MenuScene(this));
    }

    /**
     * Switch scenes (destroys old scene, activates new one)
     */
    public changeScene(newScene: SceneBase) {
        if (this.currentScene) {
            this.currentScene.destroy();
        }

        this.currentScene = newScene;
    }
}
