"use strict";

const nthReplace = (str, n, after) => {
    return str.replace(RegExp(`(?<=^.{${n}}).`), after);
};

class Actor {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.layer = 0;
        this.id = 0;
        this.time = 0;
    }

    update() {}
    render(canvas) {}
}

class RectActor extends Actor {
    constructor(color, x, y, width, height) {
        super(x, y);
        this.color = color;
        this.width = width;
        this.height = height;
    }

    render(canvas) {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class TextActor extends Actor {
    constructor(text, x, y) {
        super(x, y);
        this.text = text;
        this.color = "#000";
        this.textBaseline = "middle";
        this.textAlign = "center";
        this.font = "20px monospace";
    }

    render(canvas) {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = this.color;
        ctx.textBaseline = this.textBaseline;
        ctx.textAlign = this.textAlign;
        ctx.font = this.font;
        ctx.fillText(this.text, this.x, this.y);
    }
}

class InputManager {
    constructor(target) {
        this.target = target;
        this._isKeyPressedMap = new Map();
        this._keyMap = new Map();
        this.pointerInit();
        this.bindEvent();
    }

    update() {
        this._isKeyPressedMap.forEach((v, k) => {
            this._keyMap[k] ??= 0;
            this._keyMap[k] = v
                ? Math.max(1, this._keyMap[k] + 1)
                : Math.min(-1, this._keyMap[k] - 1);
        });
    }

    getKey(keyName) {
        return this._keyMap[keyName];
    }

    pointerInit() {
        this.pointerEvents = {
            down: false,
            move: false,
            up: false,

            downPosition: [],
            movePosition: [],
            upPosition: [],
        };
    }

    bindEvent() {
        this.target.addEventListener("pointerdown", (event) => {
            const mouseX = event.clientX - this.target.offsetLeft;
            const mouseY = event.clientY - this.target.offsetTop;

            this.pointerEvents.downPosition = [mouseX, mouseY];
            this.pointerEvents.down = true;
        });

        this.target.addEventListener("pointermove", (event) => {
            const mouseX = event.clientX - this.target.offsetLeft;
            const mouseY = event.clientY - this.target.offsetTop;

            this.pointerEvents.movePosition = [mouseX, mouseY];
            this.pointerEvents.move = true;
        });

        this.target.addEventListener("pointerup", (event) => {
            const mouseX = event.clientX - this.target.offsetLeft;
            const mouseY = event.clientY - this.target.offsetTop;

            this.pointerEvents.upPosition = [mouseX, mouseY];
            this.pointerEvents.up = true;
        });

        this.target.setAttribute("tabindex", 0);
        this.target.addEventListener("keydown", (ke) => {
            this._isKeyPressedMap.set(ke.key, true);
            ke.preventDefault();
        });
        this.target.addEventListener("keyup", (ke) => {
            this._isKeyPressedMap.set(ke.key, false);
        });
    }
}

class Scene {
    constructor() {
        this.actorsList = [];
    }

    add(actor) {
        if (!this.actorsList[actor.layer]) {
            this.actorsList[actor.layer] = [];
        }
        this.actorsList[actor.layer][actor.id] = actor;
    }

    update(inputManager) {
        this.actorsList.forEach((actors) => {
            if (actors) {
                actors.forEach((actor) => {
                    actor.update();
                });
            }
        });
    }

    render(canvas) {
        this.actorsList.forEach((actors) => {
            if (actors) {
                actors.forEach((actor) => {
                    actor.render(canvas);
                });
            }
        });
    }
}

class Game {
    constructor(canvas, currentScene, maxFps = 60) {
        this.currentScene = currentScene;
        this.prevTimestamp = 0;
        this.maxFps = maxFps;
        this.inputManager = new InputManager(canvas);
    }

    _loop(timestamp) {
        const elapsedSec = (timestamp - this.prevTimestamp) / 1000;
        const accuracy = 0.9; // あまり厳密にするとフレームが飛ばされることがあるので
        const frameTime = (1 / this.maxFps) * accuracy; // 精度を落とす
        if (elapsedSec <= frameTime) {
            requestAnimationFrame(this._loop.bind(this));
            return;
        }
        this.prevTimestamp = timestamp;

        this.inputManager.update();
        currentScene.update(this.inputManager);
        currentScene.render(canvas);
        requestAnimationFrame(this._loop.bind(this));
    }

    start() {
        requestAnimationFrame(this._loop.bind(this));
    }
}
