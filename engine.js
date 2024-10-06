"use strict";

const formatString = (format, ...args) => {
    return format.replace(/{(\d+)}/g, (match, index) =>
        typeof args[index] !== "undefined" ? args[index] : match
    );
};

const nthReplace = (str, n, after) => {
    return str.replace(RegExp(`(?<=^.{${n}}).`), after);
};

class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

class CookieManager {
    // Cookieの読み取り
    static getCookie(name) {
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.split("=");
            if (cookieName === name) {
                return decodeURIComponent(cookieValue);
            }
        }
        return null; // Cookieが存在しない場合はnullを返す
    }

    // Cookieの書き込み
    static setCookie(name, value, days = 365, path = "/") {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        const cookieValue = encodeURIComponent(value);
        document.cookie = `${name}=${cookieValue}; expires=${expires.toUTCString()}; path=${path}; SameSite=Lax`;
        return this.getCookie(name) == value;
    }

    // Cookieの削除
    static deleteCookie(name, path = "/") {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
    }
}

class EventDispatcher {
    constructor() {
        this._eventListeners = {};
    }

    addEventListener(type, callback) {
        if (this._eventListeners[type] == undefined) {
            this._eventListeners[type] = [];
        }

        this._eventListeners[type].push(callback);
    }

    removeEventListener(type) {
        this._eventListeners[type] = [];
    }

    dispatchEvent(type, event) {
        const listeners = this._eventListeners[type];
        if (listeners != undefined) listeners.forEach((callback) => callback(event));
    }
}

class Sprite {
    constructor(image, rectangle) {
        this.image = image;
        this.rectangle = rectangle;
    }
}

class AssetLoader {
    constructor() {
        this._promises = [];
        this._assets = new Map();
    }

    addImage(name, url) {
        const img = new Image();
        img.src = url;

        const promise = new Promise((resolve) =>
            img.addEventListener("load", () => {
                this._assets.set(name, img);
                resolve(img);
            })
        );

        this._promises.push(promise);
    }

    async loadAll() {
        await Promise.all(this._promises);
        return this._assets;
    }

    get(name) {
        return this._assets.get(name);
    }
}

const assets = new AssetLoader();

class GameEvent {
    constructor(target) {
        this.target = target;
    }
}

class Actor extends EventDispatcher {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.layer = 0;
        this.id = 0;
        this.time = 0;
        this.tags = [];
        this.globalAlpha = 1;
        this.rotate = 0;
    }

    hasTag(tagName) {
        return this.tags.includes(tagName);
    }
    update() {}
    render(canvas) {
        const ctx = canvas.getContext("2d");
        ctx.save();
        ctx.globalAlpha = this.globalAlpha;
    }
}

class SpriteActor extends Actor {
    constructor(sprite, x, y, width, height) {
        super(x, y);
        this.sprite = sprite;
        this.width = width;
        this.height = height;
    }

    render(canvas) {
        super.render(canvas);
        const ctx = canvas.getContext("2d");
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate((this.rotate * Math.PI) / 180);
        ctx.translate(-this.x - this.width / 2, -this.y - this.height / 2);
        ctx.drawImage(
            this.sprite.image,
            this.sprite.rectangle.x,
            this.sprite.rectangle.y,
            this.sprite.rectangle.width,
            this.sprite.rectangle.height,
            this.x,
            this.y,
            this.width,
            this.height
        );
        ctx.restore();
    }
}

class RectActor extends Actor {
    constructor(color, x, y, width, height) {
        super(x, y);
        this.color = color;
        this.width = width;
        this.height = height;
    }

    render(canvas) {
        super.render(canvas);
        const ctx = canvas.getContext("2d");
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate((this.rotate * Math.PI) / 180);
        ctx.translate(-this.x - this.width / 2, -this.y - this.height / 2);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
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
        super.render(canvas);
        const ctx = canvas.getContext("2d");
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotate * Math.PI) / 180);
        ctx.translate(-this.x, -this.y);
        ctx.fillStyle = this.color;
        ctx.textBaseline = this.textBaseline;
        ctx.textAlign = this.textAlign;
        ctx.font = this.font;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
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

class Scene extends EventDispatcher {
    constructor() {
        super();
        this.actorsList = [];
    }

    add(actor) {
        if (!this.actorsList[actor.layer]) {
            this.actorsList[actor.layer] = [];
        }
        this.actorsList[actor.layer][actor.id] = actor;
    }

    changeScene(newSceneList) {
        const event = new GameEvent(newSceneList);
        this.dispatchEvent("changescene", event);
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
    constructor(canvas, currentSceneList, maxFps = 60) {
        this.currentSceneList = currentSceneList;
        this.prevTimestamp = 0;
        this.maxFps = maxFps;
        this.inputManager = new InputManager(canvas);
    }

    changeScene(newSceneList) {
        this.currentSceneList = newSceneList;
        this.currentSceneList.forEach((currentScene) => {
            currentScene.removeEventListener("changescene");
            currentScene.addEventListener("changescene", (e) => this.changeScene(e.target));
        });
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
        this.currentSceneList.forEach((currentScene) => {
            currentScene.update(this.inputManager);
            currentScene.render(canvas);
        });
        requestAnimationFrame(this._loop.bind(this));
    }

    start() {
        requestAnimationFrame(this._loop.bind(this));
    }
}
