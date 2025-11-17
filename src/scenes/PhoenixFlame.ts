import {
    Container,
    Graphics,
    IDestroyOptions,
    Sprite,
    Texture,
    Text,
    MIPMAP_MODES,
    SCALE_MODES,
} from "pixi.js";
import { SceneBase } from "./SceneBase";

type RGB = [number, number, number];

class PhoenixFlame extends Container {
    private readonly fireWidth = 200;
    private readonly fireHeight = 140;
    private readonly palette: RGB[] = [];
    private firePixels: Uint8Array;

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private imageData: ImageData;
    private texture: Texture;
    private sprite: Sprite;

    private accumulator = 0;

    constructor() {
        super();
        this.buildPalette();

        this.firePixels = new Uint8Array(this.fireWidth * this.fireHeight);
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.fireWidth;
        this.canvas.height = this.fireHeight;
        this.ctx = this.canvas.getContext("2d")!;
        this.imageData = this.ctx.createImageData(this.fireWidth, this.fireHeight);

        this.texture = Texture.from(this.canvas);
        this.texture.baseTexture.mipmap = MIPMAP_MODES.OFF;
        this.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;

        this.sprite = new Sprite(this.texture);
        this.sprite.anchor.set(0.5, 1);
        this.addChild(this.sprite);

        this.seedFuel();
    }

    private buildPalette() {
        const colors = [
            0x070707,
            0x1f0707,
            0x2f0f07,
            0x471607,
            0x571e07,
            0x671f07,
            0x772507,
            0x8f2e07,
            0x9f3707,
            0xaf3f07,
            0xbf4707,
            0xc74707,
            0xdf4f07,
            0xdf5707,
            0xdf5707,
            0xd75f07,
            0xd7670f,
            0xcf6f0f,
            0xcf770f,
            0xcf7f0f,
            0xcf8717,
            0xc78717,
            0xc78f17,
            0xc7971f,
            0xbf9f1f,
            0xbfa727,
            0xbfaf2f,
            0xb7af2f,
            0xb7b737,
            0xb7bf3f,
            0xbfbf47,
            0xbfc747,
            0xefefc7,
            0xffffff,
        ];
        this.palette.length = 0;
        colors.forEach((hex) => {
            const r = (hex >> 16) & 0xff;
            const g = (hex >> 8) & 0xff;
            const b = hex & 0xff;
            this.palette.push([r, g, b]);
        });
    }

    private seedFuel() {
        const lastRow = this.fireHeight - 1;
        for (let x = 0; x < this.fireWidth; x++) {
            const idx = x + lastRow * this.fireWidth;
            this.firePixels[idx] = this.palette.length - 1;
        }
    }

    private updateFire() {
        const width = this.fireWidth;
        const height = this.fireHeight;
        for (let y = 0; y < height - 1; y++) {
            for (let x = 0; x < width; x++) {
                const src = x + (y + 1) * width;
                const decay = Math.floor(Math.random() * 3);
                const destX = x + decay - 1;
                const dest =
                    Math.max(0, Math.min(width - 1, destX)) + y * width;
                const value = Math.max(this.firePixels[src] - (decay & 1), 0);
                this.firePixels[dest] = value;
            }
        }
    }

    private renderFire() {
        const buffer = this.imageData.data;
        for (let i = 0; i < this.firePixels.length; i++) {
            const intensity = this.firePixels[i];
            const color = this.palette[intensity] ?? [0, 0, 0];
            const offset = i * 4;
            buffer[offset] = color[0];
            buffer[offset + 1] = color[1];
            buffer[offset + 2] = color[2];
            buffer[offset + 3] = intensity === 0 ? 0 : 255;
        }
        this.ctx.putImageData(this.imageData, 0, 0);
        this.texture.baseTexture.update();
    }

    public update(deltaSeconds: number) {
        this.accumulator += deltaSeconds * 60;
        while (this.accumulator > 1) {
            this.updateFire();
            this.accumulator -= 1;
        }
        this.renderFire();
    }

    public configureForViewport(width: number, height: number, heightCoverage = 0.55) {
        const desiredHeight = height * heightCoverage;
        const desiredWidth = width * 1.05;
        const scaleX = desiredWidth / this.fireWidth;
        const scaleY = desiredHeight / this.fireHeight;
        this.sprite.scale.set(scaleX, scaleY);
        this.sprite.position.set(0, 0);
    }

    public override destroy(options?: boolean | IDestroyOptions) {
        super.destroy(options);
        this.texture.destroy(true);
    }
}

export class PhoenixFlameScene extends SceneBase {
    private title!: Text;
    private subtitle!: Text;
    private background!: Graphics;
    private flame!: PhoenixFlame;
    private resizeHandler = () => this.layout();

    onCreate(): void {
        this.createBackground();
        this.createHeader();
        this.createFlame();
        this.layout();
        window.addEventListener("resize", this.resizeHandler);
    }

    private createBackground() {
        this.background = new Graphics();
        this.container.addChild(this.background);
    }

    private drawBackground() {
        const g = this.background;
        g.clear();
        const w = window.innerWidth;
        const h = window.innerHeight;
        const steps = 32;
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            const color = this.lerpColor(0x050204, 0x1a0200, t);
            g.beginFill(color);
            g.drawRect(0, (h / steps) * i, w, h / steps + 2);
            g.endFill();
        }
    }

    private createHeader() {
        this.title = new Text("Phoenix Flame", {
            fill: "#ffe8c7",
            fontSize: 56,
            fontWeight: "bold",
            dropShadow: true,
            dropShadowColor: "#ff9330",
            dropShadowBlur: 18,
            dropShadowDistance: 0,
        });
        this.title.anchor.set(0.5);
        this.container.addChild(this.title);

        this.subtitle = new Text("Press ESC twice to return to the menu.", {
            fill: "#ffb878",
            fontSize: 20,
        });
        this.subtitle.anchor.set(0.5);
        this.container.addChild(this.subtitle);
    }

    private createFlame() {
        this.flame = new PhoenixFlame();
        this.container.addChild(this.flame);
    }

    private layout() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.drawBackground();

        this.title.position.set(w / 2, h * 0.12);
        this.subtitle.position.set(w / 2, this.title.y + this.title.height / 2 + 25);

        this.flame.configureForViewport(w, h, 0.95);
        this.flame.position.set(w / 2, h * 1.1);
    }

    onUpdate(dt: number): void {
        this.flame.update(dt / 60);
    }

    private lerpColor(a: number, b: number, t: number) {
        const ar = (a >> 16) & 0xff;
        const ag = (a >> 8) & 0xff;
        const ab = a & 0xff;
        const br = (b >> 16) & 0xff;
        const bg = (b >> 8) & 0xff;
        const bb = b & 0xff;
        const rr = ar + (br - ar) * t;
        const rg = ag + (bg - ag) * t;
        const rb = ab + (bb - ab) * t;
        return ((rr << 16) | (rg << 8) | rb) >>> 0;
    }

    onDestroy(): void {
        window.removeEventListener("resize", this.resizeHandler);
        this.flame.destroy({ children: true });
    }
}
