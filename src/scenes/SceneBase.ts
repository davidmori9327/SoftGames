import * as PIXI from "pixi.js";
import { Game } from "../Game";

/**
 * Base class all scenes must extend.
 * Provides a consistent lifecycle:
 * - onCreate(): called when the scene loads
 * - onUpdate(dt): called every frame
 * - onDestroy(): called when leaving the scene
 */
export abstract class SceneBase {
    public container: PIXI.Container;
    protected game: Game;
    protected app: PIXI.Application;

    private _updateBound: (dt: number) => void;

    constructor(game: Game) {
        this.game = game;
        this.app = game.app;
        this.container = new PIXI.Container();

        // bind update method so we can remove it later
        this._updateBound = this._update.bind(this);

        // Add scene container to stage
        this.app.stage.addChild(this.container);

        // Add update ticker
        PIXI.Ticker.shared.add(this._updateBound);

        // Let child classes build UI
        this.onCreate();
    }

    /**
     * Called once when the scene is created.
     * Override this in child scenes.
     */
    abstract onCreate(): void;

    /**
     * Internal ticker update wrapper
     */
    private _update(dt: number): void {
        this.onUpdate(dt);
    }

    /**
     * Called every frame.
     * Override this for animations, logic, etc.
     */
    onUpdate(dt: number): void {
        // optional override
    }

    /**
     * Cleanup when leaving the scene
     */
    onDestroy(): void {
        // override in child if needed
    }

    /**
     * Remove scene from stage and ticker
     */
    destroy(): void {
        // remove update ticker
        PIXI.Ticker.shared.remove(this._updateBound);

        // allow child scene to clean up resources
        this.onDestroy();

        // remove container from stage
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }

        // recursively destroy children
        this.container.destroy({
            children: true,
            texture: false,
            baseTexture: false,
        });
    }
}
