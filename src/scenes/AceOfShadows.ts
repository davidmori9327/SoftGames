import * as PIXI from "pixi.js";
import { SceneBase } from "./SceneBase";
import { Game } from "../Game";

export class AceOfShadows extends SceneBase {
    private stacks: PIXI.Container[] = [];
    private stackShadows: PIXI.Graphics[] = [];
    private cards: PIXI.Sprite[] = [];

    private moveClock = 0;
    private readonly STACK_COUNT = 4;
    private readonly CARD_COUNT = 144;

    constructor(game: Game) {
        super(game);
    }

    //---------------------------------------------------
    // Scene Initialization
    //---------------------------------------------------
    onCreate(): void {
        this.createTitle();
        this.createStacks();
        this.createCards();

        window.addEventListener("resize", () => this.layout());
        this.layout();
    }

    //---------------------------------------------------
    // Title
    //---------------------------------------------------
    private createTitle() {
        const t = new PIXI.Text("Ace of Shadows", {
            fill: "#ffffff",
            fontSize: 52,
            fontWeight: "bold",
            dropShadow: true,
            dropShadowDistance: 2,
            dropShadowBlur: 4,
        });
        t.anchor.set(0.5);
        t.y = 80;
        t.x = window.innerWidth / 2;
        this.container.addChild(t);
    }

    //---------------------------------------------------
    // Create stacks + shadows
    //---------------------------------------------------
    private createStacks() {
        for (let i = 0; i < this.STACK_COUNT; i++) {
            const stack = new PIXI.Container();
            this.stacks.push(stack);
            this.container.addChild(stack);

            // Soft ellipse shadow under each stack
            const shadow = new PIXI.Graphics();
            shadow.beginFill(0x000000, 0.4);
            shadow.drawEllipse(0, 0, 130, 40);
            shadow.endFill();
            shadow.alpha = 0.25;

            this.stackShadows.push(shadow);
            this.container.addChild(shadow);
        }
    }

    //---------------------------------------------------
    // Create 144 cards distributed among stacks
    //---------------------------------------------------
    private createCards() {
        const tex = PIXI.Texture.from("assets/cards/card_back.png");

        let stackIndex = 0;

        for (let i = 0; i < this.CARD_COUNT; i++) {
            const card = new PIXI.Sprite(tex);
            card.anchor.set(0.5);
            card.scale.set(0.34);    // nice card size
            card.angle = Math.random() * 4 - 2; // slight tilt

            const stack = this.stacks[stackIndex];

            // stacking offset
            card.y = -i * 0.55;
            stack.addChild(card);

            this.cards.push(card);

            // 36 cards per stack for even distribution
            if ((i + 1) % 36 === 0) stackIndex++;
        }
    }

    //---------------------------------------------------
    // Layout (responsive)
    //---------------------------------------------------
    private layout() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const spacing = Math.min(260, w / 5);

        const centerX = w / 2;
        const centerY = h * 0.55;

        if (!this.stacks) {
            this.stacks = [];
        }
        this.stacks.forEach((stack, i) => {
            stack.x = centerX + (i - 1.5) * spacing;
            stack.y = centerY;

            const shadow = this.stackShadows[i];
            shadow.x = stack.x;
            shadow.y = stack.y + 150;
        });
    }

    //---------------------------------------------------
    // Update loop
    //---------------------------------------------------
    onUpdate(dt: number): void {
        this.moveClock += dt / 60;

        if (this.moveClock >= 1) {
            this.moveClock = 0;
            this.moveTopCard();
        }
    }

    //---------------------------------------------------
    // Moves a top card from one stack to another
    //---------------------------------------------------
    private moveTopCard() {
        // Find stack with cards
        const sourceStack = this.stacks.find(s => s.children.length > 0);
        if (!sourceStack) return;

        const card = sourceStack.children[sourceStack.children.length - 1] as PIXI.Sprite;

        // Choose a different target stack
        let targetStack = sourceStack;
        while (targetStack === sourceStack) {
            targetStack = this.stacks[Math.floor(Math.random() * this.stacks.length)];
        }

        // Global position BEFORE reparenting
        const globalStart = card.getGlobalPosition();

        // Temporarily move card to root container for animation
        this.container.addChild(card);
        card.x = globalStart.x;
        card.y = globalStart.y;

        // Target landing position
        const targetPos = targetStack.toGlobal(new PIXI.Point(0, -targetStack.children.length * 0.55));

        // Tween animation (2 seconds)
        this.animateCard(card, targetPos.x, targetPos.y, 1200, () => {
            // After animation, reparent back to target stack
            const local = targetStack.toLocal(new PIXI.Point(card.x, card.y));
            card.x = local.x;
            card.y = local.y;
            targetStack.addChild(card);
        });
    }

    //---------------------------------------------------
    // Tween animation (ease-in-out)
    //---------------------------------------------------
    private animateCard(card: PIXI.Sprite, tx: number, ty: number, duration: number, onComplete: () => void) {
        const sx = card.x;
        const sy = card.y;

        let time = 0;

        const tick = (dt: number) => {
            time += dt;

            const t = Math.min(time / duration, 1);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            card.x = sx + (tx - sx) * ease;
            card.y = sy + (ty - sy) * ease;

            card.scale.set(0.34 + Math.sin(t * Math.PI) * 0.02); // slight float effect
            card.angle += 0.2; // slight rotation during animation

            if (t >= 1) {
                PIXI.Ticker.shared.remove(tick);
                onComplete();
            }
        };

        PIXI.Ticker.shared.add(tick);
    }

    //---------------------------------------------------
    // Cleanup
    //---------------------------------------------------
    onDestroy(): void {
        window.removeEventListener("resize", () => this.layout());
    }
}
