import { App } from "./App";

window.onload = async () => {
    const app = new App();
    await app.init();
};
