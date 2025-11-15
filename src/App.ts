import * as PIXI from "pixi.js";
import { Game } from "./Game";

export class App {
    public pixi!: PIXI.Application;
    public game!: Game;

    async init() {
        this.pixi = new PIXI.Application({
            background: "#000",
            resizeTo: window,
        });

        document.body.style.margin = "0";
        document.body.appendChild(this.pixi.view as any);

        this.game = new Game(this.pixi);
    }
}
