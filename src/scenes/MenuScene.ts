import * as PIXI from "pixi.js";
import { SceneBase } from "./SceneBase";
import { Game } from "../Game";
import { Button, ButtonPalette } from "../ui/Button";

import { AceOfShadows } from "./AceOfShadows";
import { MagicWords } from "./MagicWords";
import { PhoenixFlameScene } from "./PhoenixFlame";
import { applyTextEffect, TextEffectName } from "../utils/textEffects";

interface FloatingIcon {
    sprite: PIXI.Sprite;
    speed: number;
    drift: number;
    baseY: number;
}

export class MenuScene extends SceneBase {
    private title!: PIXI.Text;
    private subtitle!: PIXI.Text;
    private buttons: Button[] = [];
    private resizeHandler = () => this.layout();

    private bgSprite!: PIXI.Sprite;
    private floatingIcons: FloatingIcon[] = [];
    private textEffectAssignments = new Map<PIXI.Text, TextEffectName>();
    private initialTextEffectsPlayed = false;
    private readonly effectOrder: TextEffectName[] = [
        "Fade In",
        "Appear",
        "Wipe",
        "Fly In",
        "Zoom",
        "Split",
        "Shape",
        "Wheel",
        "Float In",
    ];
    private effectCursor = 0;
    private readonly textEffectStaggerMs = 120;
    private readonly buttonRevealDelayMs = 1000;
    private readonly buttonRevealDurationMs = 750;
    private readonly buttonRevealStartScale = 0.86;
    private buttonRevealPlayed = false;
    private buttonRevealTimeouts: number[] = [];
    private buttonBaseScales = new Map<Button, { x: number; y: number }>();

    constructor(game: Game) {
        super(game);
    }

    onCreate(): void {
        this.createBackground();
        this.createTitle();
        this.createButtons();
        this.createFloatingIcons();
        this.layout();

        window.addEventListener("resize", this.resizeHandler);
    }

    private createBackground() {
        const texture = PIXI.Texture.from("../assets/background.png");
        this.bgSprite = new PIXI.Sprite(texture);
        this.bgSprite.alpha = 0.8;
        this.bgSprite.anchor.set(0.5);
        this.container.addChild(this.bgSprite);

        if (texture.baseTexture.valid) {
            this.updateBackgroundScale();
        } else {
            texture.baseTexture.once("loaded", () => this.updateBackgroundScale());
        }
    }

    private createTitle() {
        this.title = new PIXI.Text("SoftGames Assignment", {
            fill: ["#ff6ef8", "#7af2ff"],
            fontSize: 72,
            fontWeight: "bold",
            dropShadow: true,
            dropShadowColor: "#14193a",
            dropShadowBlur: 10,
            dropShadowDistance: 0,
        });
        this.title.anchor.set(0.5);
        this.container.addChild(this.title);

        this.subtitle = new PIXI.Text("Select a magical experience", {
            fill: "#7cf9ff",
            fontWeight: "600",
            dropShadow: true,
            dropShadowColor: "#04142f",
            dropShadowBlur: 6,
            dropShadowDistance: 0,
            fontSize: 28,
        });
        this.subtitle.anchor.set(0.5);
        this.container.addChild(this.subtitle);
    }

    private createButtons() {
        const buttonData = [
            { text: "Ace of Shadows", scene: () => new AceOfShadows(this.game) },
            { text: "Magic Words", scene: () => new MagicWords(this.game) },
            { text: "Phoenix Flame", scene: () => new PhoenixFlameScene(this.game) },
        ];

        const palettes: ButtonPalette[] = [
            {
                idleTop: 0xa078ff,
                idleBottom: 0x4a1cb8,
                hoverTop: 0xc090ff,
                hoverBottom: 0x6b31e5,
                glow: 0x4a1cb8,
            },
            {
                idleTop: 0x4deac8,
                idleBottom: 0x148c72,
                hoverTop: 0x6ffff1,
                hoverBottom: 0x1fb699,
                glow: 0x148c72,
            },
            {
                idleTop: 0xffc36d,
                idleBottom: 0xe64a19,
                hoverTop: 0xffe08e,
                hoverBottom: 0xff7043,
                glow: 0xe64a19,
            },
        ];

        buttonData.forEach((b, i) => {
            const palette = palettes[i % palettes.length];
            const btn = new Button(b.text, 360, 74, palette);
            btn.on("pointerdown", () => this.game.changeScene(b.scene()));

            if (!this.buttons) {
                this.buttons = [];
            }
            this.buttons.push(btn);
            this.container.addChild(btn);
        });
    }

    private createFloatingIcons() {
        const icons = ["✨", "🪄", "🔥", "⭐", "⚡"];
        for (let i = 0; i < 6; i++) {
            const icon = new PIXI.Text(icons[Math.floor(Math.random() * icons.length)], {
                fontSize: 32 + Math.random() * 16,
                fill: "#f1d6ff",
                fontWeight: "bold",
            });
            icon.anchor.set(0.5);
            icon.alpha = 0.6;
            this.container.addChild(icon);
            this.floatingIcons.push({
                sprite: icon,
                speed: 0.3 + Math.random() * 0.3,
                drift: (Math.random() * 0.6 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
                baseY: Math.random() * window.innerHeight,
            });
        }

        PIXI.Ticker.shared.add(this.animateIcons, this);
    }

    private animateIcons = (delta: number) => {
        const dt = delta / 60;
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.floatingIcons.forEach((iconData) => {
            const sprite = iconData.sprite;
            sprite.x += iconData.drift;
            sprite.y += iconData.speed;

            if (sprite.y > h + 30) {
                sprite.y = -30;
            }

            if (sprite.x > w + 60) sprite.x = -60;
            if (sprite.x < -60) sprite.x = w + 60;
        });
    };

    private updateBackgroundScale() {
        if (!this.bgSprite?.texture.baseTexture.valid) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scale = Math.max(w / this.bgSprite.texture.width, h / this.bgSprite.texture.height);
        this.bgSprite.position.set(w / 2, h / 2);
        this.bgSprite.scale.set(scale);
    }

    private layout() {
        if (!this.title || this.buttons.length === 0) {
            return;
        }

        this.updateBackgroundScale();

        const w = window.innerWidth;
        const h = window.innerHeight;

        this.title.position.set(w / 2, h * 0.18);
        this.subtitle.position.set(w / 2, h * 0.25);

        const startY = h * 0.42;

        this.buttons.forEach((btn, i) => {
            btn.pivot.set(btn.buttonWidth / 2, btn.buttonHeight / 2);
            btn.x = w / 2;
            btn.y = startY + i * 110;
        });

        this.playTextEffects();
        this.playButtonReveal();
    }

    private playTextEffects() {
        const targets = this.collectButtonTextEffectTargets();
        if (targets.length === 0) {
            return;
        }

        this.assignButtonEffects(targets);

        targets.forEach((target, idx) => {
            const assignedEffect = this.textEffectAssignments.get(target.text);
            if (!assignedEffect) return;
            applyTextEffect(target.text, assignedEffect, {
                delay: idx * this.textEffectStaggerMs,
                bounds: target.bounds,
            });
        });
    }

    private playInitialTextEffects() {
        if (this.initialTextEffectsPlayed) {
            return;
        }

        const headerTargets: { text: PIXI.Text; bounds?: PIXI.Rectangle }[] = [];
        if (this.title) {
            headerTargets.push({
                text: this.title,
                bounds: this.createBoundsFromText(this.title),
            });
        }
        if (this.subtitle) {
            headerTargets.push({
                text: this.subtitle,
                bounds: this.createBoundsFromText(this.subtitle),
            });
        }

        headerTargets.forEach((target, idx) => {
            const effect = this.nextEffectName();
            this.textEffectAssignments.set(target.text, effect);
            applyTextEffect(target.text, effect, {
                delay: idx * 120,
                bounds: target.bounds,
            });
        });

        this.initialTextEffectsPlayed = true;
    }

    private collectButtonTextEffectTargets(): { text: PIXI.Text; bounds?: PIXI.Rectangle }[] {
        const targets: { text: PIXI.Text; bounds?: PIXI.Rectangle }[] = [];

        this.buttons.forEach((btn) => {
            const label = btn.getLabelText();
            targets.push({
                text: label,
                bounds: new PIXI.Rectangle(0, 0, btn.buttonWidth, btn.buttonHeight),
            });
        });

        return targets;
    }

    private createBoundsFromText(text: PIXI.Text): PIXI.Rectangle {
        const width = text.width;
        const height = text.height;
        return new PIXI.Rectangle(
            text.x - width * text.anchor.x,
            text.y - height * text.anchor.y,
            width,
            height
        );
    }

    private nextEffectName(): TextEffectName {
        if (this.effectCursor >= this.effectOrder.length) {
            console.warn("[MenuScene] More text elements than available unique effects.");
            this.effectCursor = 0;
        }
        return this.effectOrder[this.effectCursor++];
    }

    private nextEffectNameExcluding(exclusions: Set<TextEffectName>): TextEffectName {
        let effect = this.nextEffectName();
        let attempts = 1;

        while (exclusions.has(effect) && attempts <= this.effectOrder.length) {
            effect = this.nextEffectName();
            attempts++;
        }

        if (exclusions.has(effect)) {
            console.warn("[MenuScene] Reusing text effect because all unique options are taken.");
        }

        return effect;
    }

    private assignButtonEffects(targets: { text: PIXI.Text }[]) {
        const aceTarget = targets.find((t) => t.text.text === "Ace of Shadows");
        if (aceTarget) {
            let aceEffect = this.textEffectAssignments.get(aceTarget.text);
            if (!aceEffect) {
                aceEffect = this.nextEffectName();
                this.textEffectAssignments.set(aceTarget.text, aceEffect);
            }
            const resolvedEffect = aceEffect;
            targets.forEach((target) => {
                this.textEffectAssignments.set(target.text, resolvedEffect);
            });
            return;
        }

        const usedEffects = new Set<TextEffectName>();
        targets.forEach((target) => {
            const existingEffect = this.textEffectAssignments.get(target.text);
            if (existingEffect) {
                usedEffects.add(existingEffect);
            }
        });

        targets.forEach((target) => {
            if (this.textEffectAssignments.has(target.text)) {
                return;
            }
            const effect = this.nextEffectNameExcluding(usedEffects);
            this.textEffectAssignments.set(target.text, effect);
            usedEffects.add(effect);
        });
    }

    private playButtonReveal() {
        if (this.buttonRevealPlayed || this.buttons.length === 0) {
            return;
        }

        this.buttonRevealPlayed = true;

        this.buttons.forEach((btn, idx) => {
            this.prepareButtonForReveal(btn);
            const timeout = window.setTimeout(() => {
                this.animateButtonReveal(btn);
            }, idx * this.buttonRevealDelayMs);
            this.buttonRevealTimeouts.push(timeout);
        });
    }

    private prepareButtonForReveal(btn: Button) {
        if (!this.buttonBaseScales.has(btn)) {
            this.buttonBaseScales.set(btn, { x: btn.scale.x, y: btn.scale.y });
        }
        const base = this.buttonBaseScales.get(btn)!;
        btn.alpha = 0;
        btn.scale.set(base.x * this.buttonRevealStartScale, base.y * this.buttonRevealStartScale);
    }

    private animateButtonReveal(btn: Button) {
        const base = this.buttonBaseScales.get(btn);
        if (!base) return;

        const ticker = PIXI.Ticker.shared;
        const duration = this.buttonRevealDurationMs;
        const startScaleX = base.x * this.buttonRevealStartScale;
        const startScaleY = base.y * this.buttonRevealStartScale;
        const targetScaleX = base.x;
        const targetScaleY = base.y;
        let elapsed = 0;

        const tick = () => {
            if (btn.destroyed || !btn.parent) {
                ticker.remove(tick);
                return;
            }

            elapsed += ticker.deltaMS;
            const progress = Math.min(1, elapsed / duration);
            const eased = this.easeOutCubic(progress);

            btn.alpha = eased;
            const scaleX = startScaleX + (targetScaleX - startScaleX) * eased;
            const scaleY = startScaleY + (targetScaleY - startScaleY) * eased;
            btn.scale.set(scaleX, scaleY);

            if (progress >= 1) {
                btn.alpha = 1;
                btn.scale.set(targetScaleX, targetScaleY);
                ticker.remove(tick);
            }
        };

        ticker.add(tick);
    }

    private easeOutCubic(t: number) {
        return 1 - Math.pow(1 - t, 3);
    }

    onDestroy(): void {
        window.removeEventListener("resize", this.resizeHandler);
        PIXI.Ticker.shared.remove(this.animateIcons, this);
        this.buttonRevealTimeouts.forEach((id) => window.clearTimeout(id));
        this.buttonRevealTimeouts = [];
        this.buttonBaseScales.clear();
    }
}
