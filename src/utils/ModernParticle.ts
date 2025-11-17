import * as PIXI from "pixi.js";
import {
    PropertyList,
    ParticleUtils,
    GetTextureFromString,
    Emitter,
} from "pixi-particles";

type RGBColor = { r: number; g: number; b: number };

/**
 * Modernized copy of the pixi-particles `Particle` class.
 * Rewritten with native Pixi v7 classes so it can run on ES class syntax.
 */
export class ModernParticle extends PIXI.Sprite {
    public emitter: Emitter;
    public velocity = new PIXI.Point();
    public rotationSpeed = 0;
    public rotationAcceleration = 0;
    public maxLife = 0;
    public age = 0;
    public ease: ((v: number, ...rest: number[]) => number) | null = null;
    public extraData: Record<string, unknown> | null = null;
    public alphaList = new PropertyList();
    public speedList = new PropertyList();
    public speedMultiplier = 1;
    public acceleration = new PIXI.Point();
    public maxSpeed = NaN;
    public scaleList = new PropertyList();
    public scaleMultiplier = 1;
    public colorList = new PropertyList(true);
    public noRotation = false;

    private _doAlpha = false;
    private _doScale = false;
    private _doSpeed = false;
    private _doAcceleration = false;
    private _doColor = false;
    private _doNormalMovement = false;
    private _oneOverLife = 0;

    public next: ModernParticle | null = null;
    public prev: ModernParticle | null = null;

    constructor(emitter: Emitter) {
        super();
        this.emitter = emitter;
        this.anchor.set(0.5);
        // keep prototypes consistent with original implementation
        (this as any).init = this.init.bind(this);
        (this as any).update = this.update.bind(this);
        (this as any).applyArt = this.applyArt.bind(this);
        (this as any).kill = this.kill.bind(this);
    }

    init(): void {
        this.age = 0;

        const startSpeed = (this.speedList.current.value as number) || 0;
        this.velocity.x = startSpeed * this.speedMultiplier;
        this.velocity.y = 0;
        ParticleUtils.rotatePoint(this.rotation, this.velocity);

        if (this.noRotation) {
            this.rotation = 0;
        } else {
            this.rotation *= ParticleUtils.DEG_TO_RADS;
        }

        this.rotationSpeed *= ParticleUtils.DEG_TO_RADS;
        this.rotationAcceleration *= ParticleUtils.DEG_TO_RADS;

        const alphaNode = this.alphaList.current;
        this.alpha = (alphaNode?.value as number) ?? 1;
        const scaleNode = this.scaleList.current;
        const initialScale = (scaleNode?.value as number) ?? 1;
        this.scale.set(initialScale);

        const speedNode = this.speedList.current;
        const colorNode = this.colorList.current;

        this._doAlpha = !!(alphaNode && alphaNode.next);
        this._doSpeed = !!(speedNode && speedNode.next);
        this._doScale = !!(scaleNode && scaleNode.next);
        this._doColor = !!(colorNode && colorNode.next);
        this._doAcceleration =
            this.acceleration.x !== 0 || this.acceleration.y !== 0;
        const baseSpeed = (speedNode?.value as number) ?? 0;
        this._doNormalMovement =
            this._doSpeed || !!baseSpeed || this._doAcceleration;

        this._oneOverLife = 1 / this.maxLife;

        const color =
            (colorNode?.value as RGBColor | undefined) ?? {
                r: 255,
                g: 255,
                b: 255,
            };
        this.tint = ParticleUtils.combineRGBComponents(color.r, color.g, color.b);
        this.visible = true;
    }

    applyArt(art?: PIXI.Texture) {
        this.texture = art || PIXI.Texture.EMPTY;
    }

    update(delta: number): number {
        this.age += delta;
        if (this.age >= this.maxLife || this.age < 0) {
            this.kill();
            return -1;
        }

        let lerp = this.age * this._oneOverLife;
        if (this.ease) {
            if (this.ease.length === 4) {
                lerp = this.ease(lerp, 0, 1, 1);
            } else {
                lerp = this.ease(lerp);
            }
        }

        if (this._doAlpha) {
            this.alpha = this.alphaList.interpolate(lerp) as number;
        }

        if (this._doScale) {
            const scale =
                (this.scaleList.interpolate(lerp) as number) * this.scaleMultiplier;
            this.scale.set(scale);
        }

        if (this._doNormalMovement) {
            let deltaX = 0;
            let deltaY = 0;

            if (this._doSpeed) {
                const speed =
                    (this.speedList.interpolate(lerp) as number) * this.speedMultiplier;
                ParticleUtils.normalize(this.velocity);
                ParticleUtils.scaleBy(this.velocity, speed);
                deltaX = this.velocity.x * delta;
                deltaY = this.velocity.y * delta;
            } else if (this._doAcceleration) {
                const oldVX = this.velocity.x;
                const oldVY = this.velocity.y;
                this.velocity.x += this.acceleration.x * delta;
                this.velocity.y += this.acceleration.y * delta;
                if (!this.maxSpeed || this.maxSpeed < 0) {
                    deltaX = ((oldVX + this.velocity.x) / 2) * delta;
                    deltaY = ((oldVY + this.velocity.y) / 2) * delta;
                } else {
                    const currentSpeed = ParticleUtils.length(this.velocity);
                    if (currentSpeed > this.maxSpeed) {
                        ParticleUtils.scaleBy(
                            this.velocity,
                            this.maxSpeed / currentSpeed
                        );
                    }
                    deltaX = this.velocity.x * delta;
                    deltaY = this.velocity.y * delta;
                }
            } else {
                deltaX = this.velocity.x * delta;
                deltaY = this.velocity.y * delta;
            }

            this.position.x += deltaX;
            this.position.y += deltaY;
        }

        if (this._doAcceleration) {
            this.velocity.x += this.acceleration.x * delta;
            this.velocity.y += this.acceleration.y * delta;
        }

        if (!this.noRotation) {
            this.rotation +=
                (this.rotationSpeed +
                    this.rotationAcceleration * this.age) *
                delta;
        }

        const colorList: any = this.colorList;
        if (this._doColor && !(colorList.current && colorList.next)) {
            this._doColor = false;
            const fallback =
                (colorList.current && colorList.current.value) || {
                    r: 255,
                    g: 255,
                    b: 255,
                };
            this.tint = ParticleUtils.combineRGBComponents(
                fallback.r,
                fallback.g,
                fallback.b
            );
        }

        if (this._doColor) {
            const list = this.colorList as any;
            if (!list.current) {
                list.current = {
                    value: { r: 255, g: 255, b: 255 },
                    time: 0,
                    next: null,
                    isStepped: true,
                    ease: null,
                };
            }
            if (!list.next) {
                list.next = {
                    value: list.current.value,
                    time: 1,
                    next: null,
                    isStepped: true,
                    ease: null,
                };
            }

            const raw = list.interpolate(lerp) as unknown;
            const color =
                raw && typeof raw === "object"
                    ? (raw as RGBColor)
                    : { r: 255, g: 255, b: 255 };
            this.tint = ParticleUtils.combineRGBComponents(
                color.r,
                color.g,
                color.b
            );
        } else if (colorList.current && colorList.current.value) {
            const base = colorList.current.value as RGBColor;
            this.tint = ParticleUtils.combineRGBComponents(base.r, base.g, base.b);
        }

        return lerp;
    }

    kill() {
        this.emitter.recycle(this as any);
    }

    override destroy(options?: boolean | PIXI.IDestroyOptions) {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        super.destroy(options);
        // cleanup references
        (this as any).emitter = null;
        (this as any).velocity = null;
        (this as any).colorList = null;
        (this as any).scaleList = null;
        (this as any).alphaList = null;
        (this as any).speedList = null;
        (this as any).ease = null;
        (this as any).next = null;
        (this as any).prev = null;
    }

    static parseArt(art: Array<PIXI.Texture | string>) {
        for (let i = art.length - 1; i >= 0; --i) {
            const entry = art[i];
            if (typeof entry === "string") {
                art[i] = GetTextureFromString(entry);
            }
        }
        return art as PIXI.Texture[];
    }

    static parseData(extraData: unknown) {
        return extraData;
    }
}
