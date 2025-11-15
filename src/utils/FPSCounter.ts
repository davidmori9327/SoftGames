import * as PIXI from "pixi.js";

export class FPSCounter extends PIXI.Text {
  constructor() {
    super("FPS: 0", { fill: "#00ff00", fontSize: 18 } as any);

    let lastTime = performance.now();
    let frameCount = 0;

    PIXI.Ticker.shared.add(() => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        this.text = `FPS: ${frameCount}`;
        frameCount = 0;
        lastTime = now;
      }
    });
  }
}
