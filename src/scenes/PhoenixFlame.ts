import * as PIXI from "pixi.js";
import { SceneBase } from "./SceneBase";

export class PhoenixFlame extends SceneBase {
    onCreate(): void {
        const t = new PIXI.Text("Phoenix Flame", { fill: "#fff", fontSize: 38 });
        t.x = 40;
        t.y = 40;
        this.container.addChild(t);
    }
}
