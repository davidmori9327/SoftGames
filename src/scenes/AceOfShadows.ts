import * as PIXI from "pixi.js";
import { SceneBase } from "./SceneBase";
import { Game } from "../Game";

export class AceOfShadows extends SceneBase {

    private title!: PIXI.Text;
    private topStack!: PIXI.Container;
    private bottomStack!: PIXI.Container;
    private topCards!: PIXI.Container;
    private bottomCards!: PIXI.Container;

    private topBorder!: PIXI.Graphics;
    private bottomBorder!: PIXI.Graphics;

    private topShadow!: PIXI.Graphics;
    private bottomShadow!: PIXI.Graphics;
    private subtitle!: PIXI.Text;
    private moveClock = 0;
    private activeAnimTicks: Array<(dt: number) => void> = [];
    private readonly CARD_COUNT = 144;
    private readonly STACK_WIDTH = 520;
    private readonly STACK_HEIGHT = 140;
    private readonly STACK_PADDING = 20;
    private readonly MAX_CARD_SPACING = 6;
    private cardWidth = 0;

    constructor(game: Game) {
        super(game);
    }

    //---------------------------------------------------
    // INIT
    //---------------------------------------------------
    onCreate(): void {
        this.createTitle();
        this.createStacks();
        this.createCards();

        this.layout();
        window.addEventListener("resize", this.layoutBound);

        
    }

    private layoutBound = () => this.layout();

    //---------------------------------------------------
    // TITLE
    //---------------------------------------------------
    private createTitle() {
        this.title = new PIXI.Text("Ace of Shadows", {
            fill: ["#ff8cfb", "#d414f2", "#6b32ff"],
            fontSize: 54,
            fontWeight: "bold",
            dropShadow: true,
            dropShadowColor: "#2a0032",
            dropShadowBlur: 18,
            dropShadowDistance: 0,
        });

        this.title.anchor.set(0.5);

        this.subtitle = new PIXI.Text("Press ESC twice to return to the menu.", {
            fill: "#b8c3ff",
            fontSize: 20,
        });
        this.subtitle.anchor.set(0.5);

        this.container.addChild(this.title);
        this.container.addChild(this.subtitle);
    }

    //---------------------------------------------------
    // STACKS + BORDERS + SHADOWS + MASKS
    //---------------------------------------------------
    private createStacks() {
        // ----- TOP STACK -----
        this.topStack = new PIXI.Container();
        this.container.addChild(this.topStack);

        this.topCards = new PIXI.Container();
        this.topBorder = this.makeBorder();
        this.topStack.addChild(this.topBorder);
        this.topStack.addChild(this.topCards);

        this.topShadow = this.makeShadow();
        this.container.addChild(this.topShadow);

        // Mask for top stack (clips overflowing cards)
        const topMask = this.makeMask();
        this.topStack.addChild(topMask);
        this.topCards.mask = topMask;

        // ----- BOTTOM STACK -----
        this.bottomStack = new PIXI.Container();
        this.container.addChild(this.bottomStack);

        this.bottomCards = new PIXI.Container();
        this.bottomBorder = this.makeBorder();
        this.bottomStack.addChild(this.bottomBorder);
        this.bottomStack.addChild(this.bottomCards);

        this.bottomShadow = this.makeShadow();
        this.container.addChild(this.bottomShadow);

        // Mask for bottom stack
        const bottomMask = this.makeMask();
        this.bottomStack.addChild(bottomMask);
        this.bottomCards.mask = bottomMask;
    }

    //---------------------------------------------------
    // BORDER SHAPE
    //---------------------------------------------------
    private makeBorder(): PIXI.Graphics {
        const g = new PIXI.Graphics();
        g.lineStyle(4, 0xffffff, 0.9);
        g.beginFill(0x000000, 0.12);
        const halfWidth = this.STACK_WIDTH / 2;
        const halfHeight = this.STACK_HEIGHT / 2;
        g.drawRoundedRect(-halfWidth, -halfHeight, this.STACK_WIDTH, this.STACK_HEIGHT, 18);
        g.endFill();
        return g;
    }

    //---------------------------------------------------
    // MASK SHAPE (SAME SIZE AS BORDER)
    //---------------------------------------------------
    private makeMask(): PIXI.Graphics {
        const m = new PIXI.Graphics();
        m.beginFill(0xffffff);
        const halfWidth = this.STACK_WIDTH / 2;
        const halfHeight = this.STACK_HEIGHT / 2;
        m.drawRoundedRect(-halfWidth, -halfHeight, this.STACK_WIDTH, this.STACK_HEIGHT, 18);
        m.endFill();
        return m;
    }

    //---------------------------------------------------
    // SHADOW SHAPE
    //---------------------------------------------------
    private makeShadow(): PIXI.Graphics {
        const s = new PIXI.Graphics();
        s.beginFill(0x000000, 0.25);
        s.drawEllipse(0, 0, 260, 40);
        s.endFill();
        s.alpha = 0.25;
        return s;
    }

    //---------------------------------------------------
    // CREATE CARDS IN TOP STACK (HORIZONTAL LAYOUT)
    //---------------------------------------------------
    private createCards() {
        const tex = PIXI.Texture.from("assets/cards/card_back.png");
        const cardScale = 0.34;

        for (let i = 0; i < this.CARD_COUNT; i++) {
            const card = new PIXI.Sprite(tex);
            card.anchor.set(0.5);
            card.scale.set(cardScale);
            if (!this.cardWidth && tex.baseTexture.valid) {
                this.cardWidth = tex.width * cardScale;
            }

            // keep cards perfectly aligned
            card.angle = 0;

            this.topCards.addChild(card);
        }

        if (!this.cardWidth || this.cardWidth <= 0) {
            const updateWidth = () => {
                this.cardWidth = tex.width * cardScale;
                this.layoutStackCards(this.topCards, undefined, "center");
                this.layoutStackCards(this.bottomCards, undefined, "left");
            };

            if (tex.baseTexture.valid) {
                updateWidth();
            } else {
                tex.baseTexture.once("loaded", updateWidth);
            }
        }

        this.layoutStackCards(this.topCards, undefined, "center");
    }

    //---------------------------------------------------
    // RESPONSIVE LAYOUT
    //---------------------------------------------------
    private layout() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        if (this.title) {
            this.title.position.set(w / 2, h * 0.13);
        }
        if (this.subtitle && this.title) {
            const subtitleY =
                this.title.y + this.title.height / 2 + 5 + this.subtitle.height / 2;
            this.subtitle.position.set(w / 2, subtitleY);
        }

        const centerX = w / 2;

        const topY = h * 0.35;
        const bottomY = h * 0.65;

        // stack positions
        this.topStack.position.set(centerX, topY);
        this.bottomStack.position.set(centerX, bottomY);

        // shadows under stacks
        this.topShadow.position.set(centerX, topY + 90);
        this.bottomShadow.position.set(centerX, bottomY + 90);

        this.layoutStackCards(this.topCards, undefined, "center");
        this.layoutStackCards(this.bottomCards, undefined, "left");
    }

    //---------------------------------------------------
    // UPDATE LOOP (handles periodic transfers)
    //---------------------------------------------------
    onUpdate(dt: number): void {
        this.moveClock += dt / 60;

        if (this.moveClock >= 1) {
            this.moveClock = 0;
            this.moveCardTopToBottom();
        }
    }

    //---------------------------------------------------
    // MOVE TOP CARD FROM TOP STACK TO BOTTOM STACK
    //---------------------------------------------------
    private moveCardTopToBottom() {
        if (this.topCards.children.length === 0) return;

        const card = this.topCards.children[this.topCards.children.length - 1] as PIXI.Sprite;

        // global start
        const start = card.getGlobalPosition();

        // remove from top stack
        this.topCards.removeChild(card);
        this.layoutStackCards(this.topCards, undefined, "center");

        // temp animate in root container
        this.container.addChild(card);
        card.position.copyFrom(start);

        // prepare bottom stack layout including incoming card
        const targetIndex = this.bottomCards.children.length;
        const totalAfterAdd = targetIndex + 1;
        this.layoutStackCards(this.bottomCards, totalAfterAdd, "left");
        const targetLocal = this.getCardLocalPosition(targetIndex, totalAfterAdd, "left");
        const targetGlobal = this.bottomCards.toGlobal(targetLocal);

        this.animateCard(card, targetGlobal.x, targetGlobal.y, 2000, () => {
            // convert to local coordinates
            const local = this.bottomCards.toLocal(new PIXI.Point(card.x, card.y));
            card.position.copyFrom(local);

            this.bottomCards.addChild(card);
            this.layoutStackCards(this.bottomCards, undefined, "left");
        });
    }

    private getCardLocalPosition(
        index: number,
        total: number,
        align: "center" | "left" = "center"
    ): PIXI.Point {
        const { startX, spacing } = this.calculateLayout(total, align);
        return new PIXI.Point(startX + index * spacing, 0);
    }

    private layoutStackCards(
        container: PIXI.Container,
        countOverride?: number,
        align: "center" | "left" = "center"
    ) {
        const cards = container.children as PIXI.Sprite[];
        if (!cards.length) return;

        const desiredCount = countOverride ?? cards.length;
        const { startX, spacing } = this.calculateLayout(Math.max(desiredCount, 1), align);

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            card.x = startX + i * spacing;
            card.y = 0;
        }
    }

    private calculateLayout(cardCount: number, align: "center" | "left" = "center") {
        const { leftBound, rightBound } = this.getStackBounds();

        if (cardCount <= 1) {
            const singleStart = this.getAlignedStart(align, 0, leftBound, rightBound);
            return { startX: singleStart, spacing: 0 };
        }

        const maxSpan = Math.max(rightBound - leftBound, 0);

        const idealSpacing = maxSpan / Math.max(1, cardCount - 1);
        const spacing = Math.min(this.MAX_CARD_SPACING, idealSpacing);
        const totalWidth = spacing * (cardCount - 1);

        const startX = this.getAlignedStart(align, totalWidth, leftBound, rightBound);
        return { startX, spacing };
    }

    private getStackBounds() {
        const cardWidth = this.cardWidth || 1;
        const cardHalf = cardWidth / 2;
        const margin = this.STACK_PADDING;
        const leftBound = -this.STACK_WIDTH / 2 + margin + cardHalf;
        const rightBound = this.STACK_WIDTH / 2 - margin - cardHalf;
        return { leftBound, rightBound };
    }

    private getAlignedStart(
        align: "center" | "left",
        totalWidth: number,
        explicitLeft?: number,
        explicitRight?: number
    ) {
        const cardWidth = this.cardWidth || 1;
        const cardHalf = cardWidth / 2;
        const margin = this.STACK_PADDING;
        const leftBound =
            explicitLeft ?? -this.STACK_WIDTH / 2 + margin + (cardHalf || 0);
        const rightBound =
            explicitRight ?? this.STACK_WIDTH / 2 - margin - (cardHalf || 0);

        if (align === "left") {
            return leftBound;
        }

        const span = Math.max(rightBound - leftBound, 0);
        const leftover = Math.max(span - totalWidth, 0);
        return leftBound + leftover / 2;
    }

    //---------------------------------------------------
    // ANIMATION
    //---------------------------------------------------
    private animateCard(
        card: PIXI.Sprite,
        tx: number,
        ty: number,
        duration: number,
        onComplete: () => void
    ) {
        const sx = card.x;
        const sy = card.y;

        let time = 0;

        const tick = (dt: number) => {
            time += dt * 16.67;
            const t = Math.min(time / duration, 1);

            // smooth cubic ease-out
            const ease = 1 - Math.pow(1 - t, 3);

            card.x = sx + (tx - sx) * ease;
            card.y = sy + (ty - sy) * ease;

            // keep cards perfectly aligned
            card.scale.set(0.34);
            card.angle = 0;

            if (t >= 1) {
                PIXI.Ticker.shared.remove(tick);
                onComplete();
            }
        };

        PIXI.Ticker.shared.add(tick);
        this.activeAnimTicks.push(tick);
    }

    //---------------------------------------------------
    // CLEANUP
    //---------------------------------------------------
    onDestroy(): void {
        window.removeEventListener("resize", this.layoutBound);
        this.activeAnimTicks.forEach((tick) => PIXI.Ticker.shared.remove(tick));
        this.activeAnimTicks = [];
    }
}
