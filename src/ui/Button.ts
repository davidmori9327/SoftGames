import * as PIXI from "pixi.js";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";

export class Button extends PIXI.Container {
    private bg: PIXI.Graphics;
    private label: PIXI.Text;
    private _w: number;
    private _h: number;

    public get buttonWidth() { return this._w; }
    public get buttonHeight() { return this._h; }

    constructor(text: string, width = 360, height = 90) {
        super();

        this._w = width;
        this._h = height;

        this.eventMode = "static";
        this.cursor = "pointer";

        // Background
        this.bg = new PIXI.Graphics();
        this.drawButton(false);
        this.addChild(this.bg);

        // Label
        this.label = new PIXI.Text(text, {
            fill: "#ffffff",
            fontWeight: "bold",
            fontFamily: "Arial",
            fontSize: 32,
            dropShadow: true,
            dropShadowBlur: 4,
            dropShadowDistance: 0,
        });
        this.label.anchor.set(0.5);
        this.label.x = width / 2;
        this.label.y = height / 2;
        this.addChild(this.label);

        // Hover + click interactions
        this.on("pointerover", () => this.onHover(true));
        this.on("pointerout", () => this.onHover(false));
        this.on("pointerdown", () => this.onClick());
        this.on("pointerup", () => this.onHover(true));
        this.on("pointerupoutside", () => this.onHover(false));
    }

    private createVerticalGradient(colorTop: number, colorBottom: number): PIXI.Texture {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 256;

        const ctx = canvas.getContext("2d")!;
        const grd = ctx.createLinearGradient(0, 0, 0, 256);
        grd.addColorStop(0, "#" + colorTop.toString(16).padStart(6, "0"));
        grd.addColorStop(1, "#" + colorBottom.toString(16).padStart(6, "0"));
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 1, 256);

        return PIXI.Texture.from(canvas);
    }
    
    private onHover(hover: boolean) {
        this.drawButton(hover);  // restore gradient + gloss + shadow
        this.scale.set(hover ? 1.08 : 1.0);
    }

    private drawButton(hover: boolean) {
        this.bg.clear();

        const radius = 28;

        const topColor = hover ? 0x59b4ff : 0x2f89ff;
        const bottomColor = hover ? 0x1f75ff : 0x1860e6;

        const gradient = this.createVerticalGradient(topColor, bottomColor);

        this.bg.beginTextureFill({ texture: gradient });
        this.bg.drawRoundedRect(0, 0, this._w, this._h, radius);
        this.bg.endFill();

        this.bg.filters = [
            new DropShadowFilter({
                distance: 8,
                blur: 8,
                alpha: 0.5,
                color: 0x000000,
                rotation: 90
            })
        ];

        // remove old gloss, add a new one
        const gloss = new PIXI.Graphics();
        gloss.beginFill(0xffffff, 0.15);
        gloss.drawRoundedRect(0, 0, this._w, this._h * 0.45, radius);
        gloss.endFill();
        gloss.y = 0;

        // must ensure gloss always above bg
        this.addChild(gloss);
    }

    private onClick() {
        // Bouncy click effect
        this.scale.set(0.94);
    }
}
