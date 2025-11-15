import * as PIXI from "pixi.js";
import { SceneBase } from "./SceneBase";

export class MagicWords extends SceneBase {
    onCreate(): void {
        const t = new PIXI.Text("Magic Words", { fill: "#fff", fontSize: 38 });
        t.x = 40;
        t.y = 40;
        this.container.addChild(t);
    }
}
