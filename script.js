"use strict";

const BLOCKSIZE = 20;
const CHARA = {
    " ": ["color", "#aaa", 0],
    "#": ["color", "#622", 1], // 1: 壁
    "S": ["letter", "😎", 0],
    "G": ["color", "#cc2", 2], // 2: ゴール
    "P": ["letter", "🥺", 1 + 4 + 8], // 4: 押せるentity, 8:クリア判定あり
};

const STAGE = [
    [
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "      #########     ",
        "      #G    PS#     ",
        "      #########     ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
    ],
    [
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "      #########     ",
        "      #G      #     ",
        "      #GP P PS#     ",
        "      #G      #     ",
        "      #########     ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
    ],
    [
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "           ####     ",
        "      ######S #     ",
        "      #   ##PP#     ",
        "      # #     ##    ",
        "     ##    #   #    ",
        "     #GG ###   #    ",
        "     ##### #####    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
    ],
];

const nthReplace = (str, n, after) => {
    return str.replace(RegExp(`(?<=^.{${n}}).`), after);
};

class Entity {
    constructor(c, x, y) {
        this.char = c;
        this.x = x;
        this.y = y;
        this.goalX = x;
        this.goalY = y;
        this.isMoving = false;
        this.speed = 0.125;
    }

    input(inputManager, stageBG, entityList) {
        let moveStart = false;
        const keyMoveList = [
            ["ArrowUp", 0, -1],
            ["ArrowDown", 0, 1],
            ["ArrowLeft", -1, 0],
            ["ArrowRight", 1, 0],
            ["w", 0, -1],
            ["s", 0, 1],
            ["a", -1, 0],
            ["d", 1, 0],
        ];
        if (!this.isMoving) {
            this.dx = 0;
            this.dy = 0;
            keyMoveList.forEach((km) => {
                if (inputManager.getKey(km[0]) > 0) {
                    this.isMoving = true;
                    moveStart = true;
                    this.dx = km[1];
                    this.dy = km[2];
                    return;
                }
            });
        }

        if (moveStart) {
            // stageEntityの生成
            const stageEntity = [];
            for (let y = 0; y < 15; y++) {
                stageEntity[y] = [];
                for (let x = 0; x < 20; x++) {
                    stageEntity[y][x] = {};
                    stageEntity[y][x].c = stageBG[y][x];
                }
            }
            entityList.forEach((entity, id) => {
                stageEntity[entity.y | 0][entity.x | 0].c = entity.char;
                stageEntity[entity.y | 0][entity.x | 0].id = id;
            });

            // 壁(1)かつエンティティでない場合は止める
            {
                const block = stageEntity[this.y + this.dy][this.x + this.dx].c;
                if ((CHARA[block][2] & 1) == 1 && (CHARA[block][2] & 4) != 4) {
                    this.dx = 0;
                    this.dy = 0;
                    this.isMoving = false;
                }
            }

            // ぷゆゆ(4)の場合、押すが、壁(1)の場合は止める
            {
                const block = stageEntity[this.y + this.dy][this.x + this.dx].c;
                if ((CHARA[block][2] & 4) == 4) {
                    const block2 = stageEntity[this.y + this.dy * 2][this.x + this.dx * 2].c;
                    // 壁の場合ストップ
                    if ((CHARA[block2][2] & 1) == 1) {
                        this.dx = 0;
                        this.dy = 0;
                        this.isMoving = false;
                    } else {
                        // 壁ではない場合、動かす
                        const id = stageEntity[this.y + this.dy][this.x + this.dx].id;
                        const entity = entityList[id];
                        entity.isMoving = true;
                        entity.dx = this.dx;
                        entity.dy = this.dy;
                    }
                }
            }
        }
    }

    update() {
        if (this.dx < 0) {
            this.x -= this.speed;
        } else if (this.dx > 0) {
            this.x += this.speed;
        }
        if (this.dy < 0) {
            this.y -= this.speed;
        } else if (this.dy > 0) {
            this.y += this.speed;
        }
        if (this.isMoving) {
            if (Number.isInteger(this.x + this.y)) {
                this.isMoving = false;
                this.dx = 0;
                this.dy = 0;
            }
        }
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

class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    judgeEntity(entityList) {
        let f = false;
        entityList.forEach((entity) => {
            if (entity.x == this.x && entity.y == this.y) {
                f = true;
                return;
            }
        });
        return f;
    }
}

class GameScene {
    constructor(stageNum) {
        this.state = "playing";
        this.retryWaitTime = 0;
        this.stageBG = structuredClone(STAGE[stageNum]);
        this.entityList = [];
        this.goalList = [];

        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 20; x++) {
                const block = this.stageBG[y][x];
                if (block == "G") this.goalList.push(new Goal(x, y));
                if (block != " " && block != "#" && block != "G") {
                    this.stageBG[y] = nthReplace(this.stageBG[y], x, " ");
                    if (block == "S") {
                        this.player = new Entity(block, x, y);
                    } else {
                        this.entityList.push(new Entity(block, x, y));
                    }
                }
            }
        }
    }

    update(inputManager) {
        this.retryWaitTime--;
        if (this.state == "playing") {
            this.player.input(inputManager, this.stageBG, this.entityList);
            if (inputManager.getKey("r") == 1) {
                if (this.retryWaitTime <= 0) {
                    this.retryWaitTime = 120;
                } else {
                    console.log("retry");
                    currentScene = new GameScene(currentSceneID);
                }
            }
            this.player.update();
            this.entityList.forEach((entity) => {
                entity.update();
            });
            // ゴール判定

            let c = 0;
            this.goalList.forEach((goal) => {
                if (goal.judgeEntity(this.entityList)) {
                    c++;
                }
            });
            if (c == this.goalList.length) {
                console.log("clear");
                this.state = "gameClear";
            }
        }

        if (this.state == "gameClear") {
            if (inputManager.getKey(" ") == 1) {
                if (currentSceneID + 1 == STAGE.length) {
                    // last stage
                } else {
                    console.log("nextStage");
                    currentScene = new GameScene(++currentSceneID);
                }
            }
        }
    }

    render() {
        const renderBlock = (ctx, c, x, y) => {
            const picType = CHARA[c][0];
            const picData = CHARA[c][1];

            if (picType == "color") {
                ctx.fillStyle = picData;
                ctx.fillRect(x * BLOCKSIZE, y * BLOCKSIZE, BLOCKSIZE, BLOCKSIZE);
            }
            if (picType == "letter") {
                ctx.font = "16px monospace";
                ctx.textBaseline = "middle";
                ctx.textAlign = "center";
                ctx.fillText(picData, x * BLOCKSIZE + BLOCKSIZE / 2, y * BLOCKSIZE + BLOCKSIZE / 2);
            }
        };

        const ctx = canvas.getContext("2d");
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 20; x++) {
                renderBlock(ctx, this.stageBG[y][x], x, y);
                ctx.strokeStyle = "#ccc";
                ctx.strokeRect(x * BLOCKSIZE, y * BLOCKSIZE, BLOCKSIZE, BLOCKSIZE);
            }
        }

        renderBlock(ctx, this.player.char, this.player.x, this.player.y);
        this.entityList.forEach((entity) => {
            renderBlock(ctx, entity.char, entity.x, entity.y);
        });

        if (this.retryWaitTime > 0) {
            ctx.font = "16px monospace";
            ctx.fillStyle = "#000";
            ctx.fillText("もう一度Rでリトライ", 200, 270);
        } else if (this.state == "gameClear") {
            ctx.font = "16px monospace";
            ctx.fillStyle = "#000";
            if (currentSceneID + 1 == STAGE.length) {
                ctx.fillText("現在こちらがラストステージです", 200, 250);
                ctx.fillText("プレイありがとうございました", 200, 270);
            } else {
                ctx.fillText("Spaceで次のステージ", 200, 270);
            }
        }
    }
}

const loop = () => {
    inputManager.update();
    currentScene.update(inputManager);
    currentScene.render();
    requestAnimationFrame(loop);
};

let currentSceneID = 0;
let currentScene = new GameScene(currentSceneID);
let inputManager = new InputManager(canvas);
requestAnimationFrame(loop);
