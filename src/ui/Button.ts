import * as PIXI from "pixi.js";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";

export interface ButtonPalette {
    idleTop: number;
    idleBottom: number;
    hoverTop: number;
    hoverBottom: number;
    glow?: number;
    textColor?: number | string;
}

const defaultPalette: ButtonPalette = {
    idleTop: 0x58b3ff,
    idleBottom: 0x1650e0,
    hoverTop: 0x8cd7ff,
    hoverBottom: 0x1c6dff,
};

const colorToHexString = (color: number) => "#" + color.toString(16).padStart(6, "0");

const lightenColor = (color: number, intensity = 0.7) => {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    const mix = (channel: number) =>
        Math.min(255, Math.round(channel * (1 - intensity) + 255 * intensity));

    return colorToHexString((mix(r) << 16) | (mix(g) << 8) | mix(b));
};

export class Button extends PIXI.Container {
    private glow: PIXI.Graphics;
    private bg: PIXI.Graphics;
    private gloss: PIXI.Graphics;
    private label: PIXI.Text;
    private _w: number;
    private _h: number;
    private palette: ButtonPalette;

    public get buttonWidth() { return this._w; }
    public get buttonHeight() { return this._h; }

    constructor(text: string, width = 360, height = 90, palette: ButtonPalette = defaultPalette) {
        super();

        this._w = width;
        this._h = height;
        this.palette = palette;

        this.eventMode = "static";
        this.cursor = "pointer";

        // Layered visuals
        this.glow = new PIXI.Graphics();
        this.addChild(this.glow);

        this.bg = new PIXI.Graphics();
        this.addChild(this.bg);

        this.gloss = new PIXI.Graphics();
        this.addChild(this.gloss);

        this.drawButton(false);

        // Label
        const derivedColor = lightenColor(this.palette.hoverTop ?? this.palette.idleTop);
        const labelFill = typeof palette.textColor === "number"
            ? colorToHexString(palette.textColor)
            : palette.textColor ?? derivedColor;

        this.label = new PIXI.Text(text, {
            fill: labelFill,
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

    public getLabelText(): PIXI.Text {
        return this.label;
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
        this.glow.clear();
        this.gloss.clear();

        const radius = 32;
        const pad = 10;

        const topColor = hover ? this.palette.hoverTop : this.palette.idleTop;
        const bottomColor = hover ? this.palette.hoverBottom : this.palette.idleBottom;
        const glowColor = this.palette.glow ?? bottomColor;

        const gradient = this.createVerticalGradient(topColor, bottomColor);

        // soft glow behind button
        this.glow.beginFill(glowColor, hover ? 0.35 : 0.25);
        this.glow.drawRoundedRect(-pad, -pad, this._w + pad * 2, this._h + pad * 2, radius + 14);
        this.glow.endFill();

        this.bg.beginTextureFill({ texture: gradient });
        this.bg.drawRoundedRect(0, 0, this._w, this._h, radius);
        this.bg.endFill();

        // neon border
        this.bg.lineStyle(4, hover ? 0xffffff : 0xcde7ff, hover ? 0.95 : 0.8);
        this.bg.drawRoundedRect(2, 2, this._w - 4, this._h - 4, radius - 6);
        this.bg.lineStyle(0);

        this.bg.filters = [
            new DropShadowFilter({
                distance: 10,
                blur: 12,
                alpha: 0.6,
                color: 0x041137,
                rotation: 90,
            })
        ];

        // glossy highlight
        this.gloss.beginFill(0xffffff, hover ? 0.22 : 0.18);
        this.gloss.drawRoundedRect(10, 8, this._w - 20, this._h * 0.45, radius - 12);
        this.gloss.endFill();

        // subtle bottom shine
        this.gloss.beginFill(0xffffff, 0.08);
        this.gloss.drawRoundedRect(12, this._h * 0.62, this._w - 24, this._h * 0.3, radius - 14);
        this.gloss.endFill();
    }

    private onClick() {
        // Bouncy click effect
        this.scale.set(0.94);
    }
}
