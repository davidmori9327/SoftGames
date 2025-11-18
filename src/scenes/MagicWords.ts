import * as PIXI from "pixi.js";
import { SceneBase } from "./SceneBase";
import fallbackData from "./magicwords_fallback";

type DialogueEntry = { name: string; text: string };
type EmojiDef = { name: string; url: string };
type AvatarDef = { name: string; url: string; position?: "left" | "right" };
type MagicWordsPayload = {
    dialogue: DialogueEntry[];
    emojis: EmojiDef[];
    emojies?: EmojiDef[];
    avatars: AvatarDef[];
};

type Segment =
    | { type: "text"; value: string }
    | { type: "emoji"; value: string };

export class MagicWords extends SceneBase {
    private content: PIXI.Container = new PIXI.Container();
    private loadingText!: PIXI.Text;
    private emojiTextures = new Map<string, PIXI.Texture>();
    private avatarTextures = new Map<string, PIXI.Texture>();
    private data?: MagicWordsPayload;
    private layoutBound = () => {
        this.drawBackground();
        this.updateHeaderPositions();
        this.updateScrollMask();
        this.rebuildDialogue();
    };
    private scrollMask!: PIXI.Graphics;
    private maxScroll = 0;
    private handleWheelBound = (e: WheelEvent) => this.onWheel(e);
    private background!: PIXI.Graphics;
    private title!: PIXI.Text;
    private subtitle!: PIXI.Text;
    private readonly CONTENT_TOP = 110;
    private readonly ROW_TOP_MARGIN = 36;

    onCreate(): void {
        this.createBackdrop();
        this.container.addChild(this.content);
        this.createHeader();
        this.createScrollMask();
        this.createLoadingLabel();

        this.loadData();
        window.addEventListener("resize", this.layoutBound);
        window.addEventListener("wheel", this.handleWheelBound);
    }

    private async loadData() {
        this.setLoading("Loading dialogue...");

        const payload = await this.fetchData();
        this.data = payload;

        await this.preloadTextures(payload);

        this.setLoading("");
        this.rebuildDialogue();
    }

    private async fetchData(): Promise<MagicWordsPayload> {
        const endpoint = "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords";
        try {
            const resp = await fetch(endpoint);
            if (!resp.ok) throw new Error(`Failed status ${resp.status}`);
            const json = await resp.json();
            const normalized = this.normalizePayload(json);
            if (!this.isValidPayload(normalized)) {
                throw new Error("Response missing required fields");
            }
            return normalized;
        } catch (err) {
            console.warn("Falling back to bundled data for Magic Words", err);
            const fallback = this.normalizePayload(fallbackData);
            if (this.isValidPayload(fallback)) {
                return fallback;
            }
            return {
                dialogue: [],
                emojis: [],
                avatars: [],
            };
        }
    }

    private normalizePayload(data: any): MagicWordsPayload {
        return {
            dialogue: Array.isArray(data?.dialogue) ? data.dialogue : [],
            emojis: Array.isArray(data?.emojis)
                ? data.emojis
                : Array.isArray(data?.emojies)
                ? data.emojies
                : [],
            avatars: Array.isArray(data?.avatars) ? data.avatars : [],
        };
    }

    private isValidPayload(data: MagicWordsPayload): boolean {
        return Boolean(data.dialogue.length && data.avatars.length && data.emojis.length);
    }

    private async preloadTextures(payload: MagicWordsPayload) {
        const makeCircleTexture = (color: number) => {
            const g = new PIXI.Graphics();
            g.beginFill(color);
            g.drawCircle(0, 0, 40);
            g.endFill();
            return this.app.renderer.generateTexture(g);
        };

        const loadTexture = async (url: string, fallbackColor: number) => {
            try {
                return await PIXI.Texture.fromURL(url, {
                    resourceOptions: { crossOrigin: "anonymous" },
                });
            } catch {
                return makeCircleTexture(fallbackColor);
            }
        };

        for (const e of payload.emojis) {
            const tex = await loadTexture(e.url, 0xffc107);
            this.emojiTextures.set(e.name.toLowerCase(), tex);
        }

        for (const a of payload.avatars) {
            const tex = await loadTexture(a.url, 0x3498db);
            this.avatarTextures.set(a.name.toLowerCase(), tex);
        }
    }

    private createBackdrop() {
        this.background = new PIXI.Graphics();
        this.drawBackground();
        this.container.addChild(this.background);
    }

    private drawBackground() {
        if (!this.background) return;
        this.background.clear();

        const dynamicTop = this.content ? this.content.y : this.CONTENT_TOP;
        const captionHeight = Math.max(this.CONTENT_TOP, dynamicTop);
        const captionColor = 0x101a4a;
        const bodyColor = 0x0b1027;

        this.background.beginFill(captionColor);
        this.background.drawRect(0, 0, window.innerWidth, captionHeight);
        this.background.endFill();

        this.background.beginFill(bodyColor);
        this.background.drawRect(0, captionHeight, window.innerWidth, window.innerHeight - captionHeight);
        this.background.endFill();
    }

    private createHeader() {
        this.title = new PIXI.Text("Magic Words", {
            fill: ["#7ae2ff", "#4d8dff", "#172adf"],
            fontSize: 46,
            fontWeight: "bold",
            dropShadow: true,
            dropShadowColor: "#070f5a",
            dropShadowBlur: 14,
            dropShadowDistance: 0,
        });
        this.title.anchor.set(0.5);
        this.container.addChild(this.title);

        this.subtitle = new PIXI.Text("Press ESC twice to return to the menu.", {
            fill: "#b8c3ff",
            fontSize: 20,
        });
        this.subtitle.anchor.set(0.5);
        this.container.addChild(this.subtitle);

        this.updateHeaderPositions();
    }

    private updateHeaderPositions() {
        if (!this.title || !this.subtitle) return;
        const w = window.innerWidth;
        const titleY = 40;
        this.title.position.set(w / 2, titleY);
        const subtitleY = titleY + this.title.height / 2 + 5 + this.subtitle.height / 2;
        this.subtitle.position.set(w / 2, subtitleY);
        this.content.y = Math.max(this.CONTENT_TOP, subtitleY + this.subtitle.height / 2 + 20);
    }

    private createLoadingLabel() {
        this.loadingText = new PIXI.Text("", {
            fill: "#ffffff",
            fontSize: 20,
        });
        this.loadingText.anchor.set(0.5);
        this.loadingText.position.set(window.innerWidth / 2, window.innerHeight / 2);
        this.container.addChild(this.loadingText);
    }

    private setLoading(text: string) {
        this.loadingText.text = text;
        this.loadingText.visible = !!text;
    }

    private rebuildDialogue() {
        if (!this.data) return;

        this.messageContainers.forEach((row) => row.destroy({ children: true }));
        this.content.removeChildren();
        this.messageContainers = [];

        const maxBubbleWidth = Math.min(window.innerWidth * 0.6, 780);
        const startY = this.ROW_TOP_MARGIN;
        let cursorY = startY;

        for (const line of this.data.dialogue) {
            const row = this.createMessageRow(line, maxBubbleWidth);
            const rowHeight = Math.max(
                row.getLocalBounds().height,
                row.height
            );
            row.y = cursorY;
            this.content.addChild(row);
            this.messageContainers.push(row);
            cursorY += rowHeight + 26;
        }

        const totalHeight = cursorY + 40;
        const visibleHeight = window.innerHeight - this.CONTENT_TOP;
        this.maxScroll = Math.max(0, totalHeight - visibleHeight);
        this.clampScroll();
        this.updateScrollMask();
    }

    private createMessageRow(
        line: DialogueEntry,
        maxBubbleWidth: number
    ): PIXI.Container {
        const row = new PIXI.Container();

        const avatarInfo =
            this.data?.avatars.find(
                (a) => a.name.toLowerCase() === line.name.toLowerCase()
            ) ?? this.data?.avatars[0];

        const isLeft = (avatarInfo?.position ?? "left") === "left";
        const avatar = this.createAvatarSprite(avatarInfo, 88);

        const bubble = this.createBubble(line.text, maxBubbleWidth);

        const totalWidth = avatar.width + 24 + bubble.width;
        const startX = isLeft ? 40 : window.innerWidth - totalWidth - 40;
        if (isLeft) {
            avatar.position.set(startX, 0);
            bubble.position.set(startX + avatar.width + 16, 0);
        } else {
            bubble.position.set(startX, 0);
            avatar.position.set(startX + bubble.width + 16, 0);
        }

        row.addChild(avatar, bubble);
        return row;
    }

    private createAvatarSprite(def: AvatarDef | undefined, size: number) {
        const sprite = new PIXI.Sprite(
            def ? this.avatarTextures.get(def.name.toLowerCase()) : undefined
        );
        sprite.texture =
            sprite.texture && sprite.texture.baseTexture.valid
                ? sprite.texture
                : this.makePlaceholderTexture(0x4287f5);
        sprite.width = size;
        sprite.height = size;
        sprite.anchor.set(0.5);
        sprite.position.set(size / 2, size / 2);

        const radius = size / 2;
        const outlineRadius = radius + 4;

        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.drawCircle(0, 0, radius);
        mask.endFill();

        const frame = new PIXI.Graphics();
        frame.lineStyle(4, 0xffffff, 0.9);
        frame.drawCircle(0, 0, outlineRadius);
        frame.endFill();

        const avatarContainer = new PIXI.Container();
        sprite.position.set(radius, radius);
        mask.position.set(radius, radius);
        frame.position.set(radius, radius);

        sprite.mask = mask;

        avatarContainer.addChild(sprite, mask, frame);
        avatarContainer.width = outlineRadius * 2;
        avatarContainer.height = outlineRadius * 2;

        return avatarContainer;
    }

    private createBubble(text: string, maxBubbleWidth: number) {
        const bubble = new PIXI.Container();

        const bubbleBg = new PIXI.Graphics();
        bubbleBg.beginFill(0x15204a, 0.9);
        bubbleBg.lineStyle(2, 0x6f8cff, 0.8);
        bubbleBg.drawRoundedRect(0, 0, maxBubbleWidth, 90, 16);
        bubbleBg.endFill();
        bubble.addChild(bubbleBg);

        const content = this.buildRichText(text, maxBubbleWidth - 40);
        const bounds = content.getLocalBounds();
        content.position.set(
            16,
            (bubbleBg.height - bounds.height) / 2 - bounds.y
        );
        bubble.addChild(content);

        return bubble;
    }

    private buildRichText(text: string, wrapWidth: number): PIXI.Container {
        const container = new PIXI.Container();
        const baseStyle = new PIXI.TextStyle({
            fill: "#f5f6ff",
            fontSize: 22,
        });
        const emojiSize = 30;

        const segments = this.parseSegments(text);
        let x = 0;
        let y = 0;
        const lineHeight = 32;

        for (const segment of segments) {
            if (segment.type === "text") {
                const words = segment.value.split(/(\s+)/);
                for (const word of words) {
                    if (word === "") continue;
                    const wordText = new PIXI.Text(word, baseStyle);
                    const wordWidth = wordText.width;
                    if (x + wordWidth > wrapWidth && x > 0) {
                        x = 0;
                        y += lineHeight;
                    }
                    wordText.position.set(x, y);
                    container.addChild(wordText);
                    x += wordWidth;
                }
            } else {
                const tex =
                    this.emojiTextures.get(segment.value.toLowerCase()) ??
                    this.makePlaceholderTexture(0xffc107);
                if (x + emojiSize > wrapWidth && x > 0) {
                    x = 0;
                    y += lineHeight;
                }
                const sprite = new PIXI.Sprite(tex);
                sprite.width = emojiSize;
                sprite.height = emojiSize;
                sprite.position.set(x, y + (lineHeight - emojiSize) / 2);
                container.addChild(sprite);
                x += emojiSize + 4;
            }
        }

        return container;
    }

    private parseSegments(text: string): Segment[] {
        const segments: Segment[] = [];
        const regex = /(\(|\{)(.*?)(\)|\})/g;
        let last = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > last) {
                segments.push({ type: "text", value: text.slice(last, match.index) });
            }
            const emojiName = match[2].trim();
            if (emojiName.length > 0) {
                segments.push({ type: "emoji", value: emojiName });
            }
            last = regex.lastIndex;
        }
        if (last < text.length) {
            segments.push({ type: "text", value: text.slice(last) });
        }
        return segments;
    }

    private makePlaceholderTexture(color: number) {
        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawRoundedRect(0, 0, 80, 80, 16);
        g.endFill();
        return this.app.renderer.generateTexture(g);
    }

    private createScrollMask() {
        this.scrollMask = new PIXI.Graphics();
        this.scrollMask.visible = false;
        this.container.addChild(this.scrollMask);
        this.content.mask = this.scrollMask;
        this.updateScrollMask();
    }

    private updateScrollMask() {
        if (!this.scrollMask) return;
        this.scrollMask.clear();
        this.scrollMask.beginFill(0xffffff);
        const height = Math.max(0, window.innerHeight - this.CONTENT_TOP);
        this.scrollMask.drawRect(0, this.CONTENT_TOP, window.innerWidth, height);
        this.scrollMask.endFill();
    }

    private onWheel(event: WheelEvent) {
        if (this.maxScroll <= 0) return;
        event.preventDefault();
        this.content.y -= event.deltaY * 0.5;
        this.clampScroll();
    }

    private clampScroll() {
        if (this.maxScroll <= 0) {
            this.content.y = this.CONTENT_TOP;
            return;
        }
        const minY = this.CONTENT_TOP - this.maxScroll;
        const maxY = this.CONTENT_TOP;
        this.content.y = Math.min(maxY, Math.max(minY, this.content.y));
    }

    onDestroy(): void {
        window.removeEventListener("resize", this.layoutBound);
        window.removeEventListener("wheel", this.handleWheelBound);
        this.messageContainers.forEach((row) => row.destroy({ children: true }));
        this.messageContainers = [];
        this.content.removeChildren();
    }

    private messageContainers: PIXI.Container[] = [];
}
