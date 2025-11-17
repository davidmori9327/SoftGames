import * as PIXI from "pixi.js";
import { Game } from "../Game";


export abstract class SceneBase {
    public container: PIXI.Container;
    protected game: Game;
    protected app: PIXI.Application;

    private _updateBound: (dt: number) => void;

    constructor(game: Game) {
        this.game = game;
        this.app = game.app;
        this.container = new PIXI.Container();

        this._updateBound = this._update.bind(this);

        this.app.stage.addChild(this.container);

        PIXI.Ticker.shared.add(this._updateBound);
    }

    public init() {
        this.onCreate();
    }

    
    abstract onCreate(): void;

    private _update(dt: number): void {
        this.onUpdate(dt);
    }

    onUpdate(dt: number): void {
    
    }

    onDestroy(): void {
    }

    destroy(): void {
       
        PIXI.Ticker.shared.remove(this._updateBound);

        this.onDestroy();

        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }

        this.container.destroy({
            children: true,
            texture: false,
            baseTexture: false,
        });
    }
}
