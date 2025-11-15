import * as PIXI from "pixi.js";
import { SceneBase } from "./SceneBase";
import { Game } from "../Game";
import { Button } from "../ui/Button";

import { AceOfShadows } from "./AceOfShadows";
import { MagicWords } from "./MagicWords";
import { PhoenixFlame } from "./PhoenixFlame";

export class MenuScene extends SceneBase {
    private title!: PIXI.Text;
    private buttons: Button[] = [];

    constructor(game: Game) {
        super(game);
    }

    onCreate(): void {
        this.createTitle();
        this.createButtons();
        this.layout();

        window.addEventListener("resize", () => this.layout());
    }

    private createTitle() {
        this.title = new PIXI.Text("SoftGames Assignment", {
            fill: "#ffffff",
            fontSize: 60,
            fontWeight: "bold",
        });

        this.title.anchor.set(0.5);
        this.container.addChild(this.title);
    }

    private createButtons() {
        const buttonData = [
            { text: "Ace of Shadows", scene: () => new AceOfShadows(this.game) },
            { text: "Magic Words", scene: () => new MagicWords(this.game) },
            { text: "Phoenix Flame", scene: () => new PhoenixFlame(this.game) },
        ];

        buttonData.forEach((b, i) => {
            const btn = new Button(b.text, 330, 70);
            btn.on("pointerdown", () => this.game.changeScene(b.scene()));

            if (!this.buttons) {
                this.buttons = [];
            }
            this.buttons.push(btn);
            this.container.addChild(btn);
        });
    }

    private layout() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Title
        this.title.x = w / 2;
        this.title.y = h * 0.2;

        // Center all buttons vertically
        const startY = h * 0.4;

        this.buttons.forEach((btn, i) => {
            btn.pivot.set(btn.buttonWidth / 2, btn.buttonHeight / 2);
            btn.x = window.innerWidth / 2;
            btn.y = startY + i * 100;
        });
    }

    onDestroy(): void {
        window.removeEventListener("resize", () => this.layout());
    }
}
