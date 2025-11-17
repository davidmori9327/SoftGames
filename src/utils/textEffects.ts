import * as PIXI from "pixi.js";

export type TextEffectName =
    | "Fade In"
    | "Appear"
    | "Wipe"
    | "Fly In"
    | "Zoom"
    | "Split"
    | "Shape"
    | "Wheel"
    | "Float In";

interface TextEffectOptions {
    delay?: number;
    bounds?: PIXI.Rectangle;
}

interface AnimationOptions {
    shouldAbort?: () => boolean;
    onAbort?: () => void;
}

interface TextEffectContext {
    bounds?: PIXI.Rectangle;
}

type EffectRunner = (text: PIXI.Text, context: TextEffectContext) => void;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const animate = (
    duration: number,
    update: (progress: number) => void,
    complete?: () => void,
    options: AnimationOptions = {}
) => {
    const ticker = PIXI.Ticker.shared;
    let elapsed = 0;

    const stop = (invokeComplete: boolean) => {
        ticker.remove(tick);
        if (invokeComplete) {
            complete?.();
        }
    };

    const tick = () => {
        if (options.shouldAbort?.()) {
            options.onAbort?.();
            stop(false);
            return;
        }

        elapsed += ticker.deltaMS;
        const progress = Math.min(1, elapsed / duration);
        update(progress);

        if (progress >= 1) {
            stop(true);
        }
    };

    if (options.shouldAbort?.()) {
        options.onAbort?.();
        return;
    }

    update(0);
    ticker.add(tick);
};

const createMaskFor = (text: PIXI.Text): PIXI.Graphics | null => {
    if (!text.parent) {
        return null;
    }

    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    const width = text.width;
    const height = text.height;
    mask.drawRect(0, 0, width, height);
    mask.endFill();
    mask.position.set(text.x - width * text.anchor.x, text.y - height * text.anchor.y);
    mask.scale.x = 0;
    mask.alpha = 0;
    text.parent.addChild(mask);
    text.mask = mask;
    return mask;
};

const clampValue = (value: number, min: number, max: number) => {
    if (Number.isNaN(value)) return value;
    if (min > max) return value;
    return Math.max(min, Math.min(max, value));
};

const getMovementBounds = (text: PIXI.Text, bounds?: PIXI.Rectangle) => {
    const width = text.width;
    const height = text.height;
    const anchorX = text.anchor.x;
    const anchorY = text.anchor.y;

    if (!bounds) {
        return {
            minX: text.x - width * anchorX,
            maxX: text.x + width * (1 - anchorX),
            minY: text.y - height * anchorY,
            maxY: text.y + height * (1 - anchorY),
        };
    }

    return {
        minX: bounds.x + width * anchorX,
        maxX: bounds.x + bounds.width - width * (1 - anchorX),
        minY: bounds.y + height * anchorY,
        maxY: bounds.y + bounds.height - height * (1 - anchorY),
    };
};

const isDisplayObjectInactive = (obj?: PIXI.DisplayObject) =>
    !obj || obj.destroyed || !(obj as any).transform;

const effectRunners: Record<TextEffectName, EffectRunner> = {
    "Fade In": (text) => {
        text.alpha = 0;
        animate(800, (progress) => {
            text.alpha = progress;
        }, undefined, { shouldAbort: () => isDisplayObjectInactive(text) });
    },
    "Appear": (text, context) => {
        text.alpha = 0;
        const originalY = text.y;
        const bounds = getMovementBounds(text, context.bounds);
        const maxOffset = Math.min(20, bounds.maxY - originalY);
        const startY = clampValue(originalY + maxOffset, bounds.minY, bounds.maxY);
        const delta = startY - originalY;
        text.y = startY;
        animate(500, (progress) => {
            text.alpha = progress;
            text.y = originalY + delta * (1 - progress);
        }, () => {
            if (isDisplayObjectInactive(text)) return;
            text.alpha = 1;
            text.y = originalY;
        }, { shouldAbort: () => isDisplayObjectInactive(text) });
    },
    "Wipe": (text) => {
        const mask = createMaskFor(text);
        if (!mask) return;

        text.alpha = 1;
        animate(900, (progress) => {
            if (!mask.transform) return;
            mask.scale.x = progress;
        }, () => {
            if (!isDisplayObjectInactive(text)) {
                text.mask = null;
            }
            if (!mask.destroyed) {
                mask.destroy();
            }
        }, {
            shouldAbort: () => isDisplayObjectInactive(text) || isDisplayObjectInactive(mask),
            onAbort: () => {
                if (!isDisplayObjectInactive(text)) {
                    text.mask = null;
                }
                if (!mask.destroyed) {
                    mask.destroy();
                }
            }
        });
    },
    "Fly In": (text, context) => {
        const targetX = text.x;
        const bounds = getMovementBounds(text, context.bounds);
        const margin = Math.min((bounds.maxX - bounds.minX) * 0.1, 24);
        const safeMinX = bounds.minX + margin;
        const available = Math.max(0, targetX - safeMinX);
        const maxShift = Math.min(text.width * 0.5, available);
        const startX = clampValue(targetX - maxShift, safeMinX, bounds.maxX);
        text.x = startX;
        text.alpha = 0;

        animate(800, (progress) => {
            text.x = startX + (targetX - startX) * easeOutCubic(progress);
            text.alpha = progress;
        }, () => {
            if (isDisplayObjectInactive(text)) return;
            text.x = targetX;
            text.alpha = 1;
        }, { shouldAbort: () => isDisplayObjectInactive(text) });
    },
    "Zoom": (text) => {
        const targetScaleX = text.scale.x;
        const targetScaleY = text.scale.y;
        text.scale.set(targetScaleX * 0.2, targetScaleY * 0.2);
        text.alpha = 0;

        animate(700, (progress) => {
            const eased = easeOutBack(progress);
            const scaleX = targetScaleX * (0.2 + 0.8 * eased);
            const scaleY = targetScaleY * (0.2 + 0.8 * eased);
            text.scale.set(scaleX, scaleY);
            text.alpha = progress;
        }, () => {
            if (isDisplayObjectInactive(text)) return;
            text.scale.set(targetScaleX, targetScaleY);
            text.alpha = 1;
        }, { shouldAbort: () => isDisplayObjectInactive(text) });
    },
    "Split": (text) => {
        const targetScaleX = text.scale.x;
        const targetScaleY = text.scale.y;
        text.scale.set(targetScaleX * 1.4, 0);
        text.alpha = 0;

        animate(750, (progress) => {
            text.scale.set(
                targetScaleX * (1.4 - 0.4 * progress),
                targetScaleY * progress
            );
            text.alpha = progress;
        }, () => {
            if (isDisplayObjectInactive(text)) return;
            text.scale.set(targetScaleX, targetScaleY);
            text.alpha = 1;
        }, { shouldAbort: () => isDisplayObjectInactive(text) });
    },
    "Shape": (text) => {
        text.alpha = 0;
        text.skew.set(-0.6, 0);

        animate(650, (progress) => {
            text.alpha = progress;
            text.skew.set(-0.6 * (1 - progress), 0);
        }, () => {
            if (isDisplayObjectInactive(text)) return;
            text.alpha = 1;
            text.skew.set(0, 0);
        }, { shouldAbort: () => isDisplayObjectInactive(text) });
    },
    "Wheel": (text) => {
        const targetRotation = text.rotation;
        text.rotation = targetRotation - Math.PI;
        text.alpha = 0;

        animate(900, (progress) => {
            text.rotation = targetRotation - Math.PI * (1 - progress);
            text.alpha = progress;
        }, () => {
            if (isDisplayObjectInactive(text)) return;
            text.rotation = targetRotation;
            text.alpha = 1;
        }, { shouldAbort: () => isDisplayObjectInactive(text) });
    },
    "Float In": (text, context) => {
        const targetY = text.y;
        const bounds = getMovementBounds(text, context.bounds);
        const maxOffset = Math.min(40, bounds.maxY - targetY);
        const startY = clampValue(targetY + maxOffset, bounds.minY, bounds.maxY);
        const delta = startY - targetY;
        text.y = startY;
        text.alpha = 0;

        animate(800, (progress) => {
            text.y = targetY + delta * (1 - progress);
            text.alpha = progress;
        }, () => {
            if (isDisplayObjectInactive(text)) return;
            text.y = targetY;
            text.alpha = 1;
        }, { shouldAbort: () => isDisplayObjectInactive(text) });
    },
};

export const applyTextEffect = (text: PIXI.Text | undefined, effect: TextEffectName, options: TextEffectOptions = {}) => {
    if (!text) return;
    const runner = effectRunners[effect];
    if (!runner) return;

    const runEffect = () => runner(text, { bounds: options.bounds });

    if (options.delay && options.delay > 0) {
        window.setTimeout(runEffect, options.delay);
    } else {
        runEffect();
    }
};
