"use strict";

const BLOCKSIZE = 20;
const CHARA = {
    " ": ["color", "#aaa", 16], // 16: 背景
    "#": ["color", "#622", 1 + 16], // 1: 壁
    "S": ["letter", "😎", 0],
    ".": ["color", "#48c", 2 + 16], // 2: ゴール
    "P": ["letter", "🥺", 1 + 4 + 8], // 4: 押せるentity, 8:クリア判定あり
    "p": ["letter", "🥺", 1 + 4 + 8 + 2], // 4: 押せるentity, 8:クリア判定あり
    "U": ["letter", "💩", 1 + 32], // 32: うんち
    "u": ["letter", "💩", 1 + 32 + 2], // 32: うんち
    "Y": ["letter", "🤥", 1 + 4 + 8 + 64], // 64: うんち食べる
    "y": ["letter", "🤥", 1 + 4 + 8 + 64 + 2], // 64: うんち食べる
};

const STAGE = [
    [
        [
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "      #########     ",
            "      #.    PS#     ",
            "      #########     ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
        ],
        [
            "👨‍🌾「このぷゆゆは寝床が分からないらしいので",
            "　　 連れて行ってあげてください」",
            "😎「なんで分かんねえんだよ💢」",
            "🥺「❓」",
        ],
    ],
    [
        [
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "       ######       ",
            "       #.   #       ",
            "       #pPPS#       ",
            "       #.   #       ",
            "       ######       ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
        ],
        ["🥺「ぷー」🥺「ぷー」🥺「ぷー」", "😎「はやく寝ろ」"],
    ],
    [
        [
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "          ####      ",
            "     ######S #      ",
            "     #   ##  #      ",
            "    ## #    P##     ",
            "    #     # P #     ",
            "    # ..###   #     ",
            "    ##### #####     ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
        ],
        ["🥺「道に迷っちゃったぷゆ……」", "😎（なんで迷うんだ……？）"],
    ],
    [
        [
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "         #####      ",
            "        ##   #      ",
            "        # Y  #      ",
            "        #    #      ",
            "      ### #P##      ",
            "      #..U  S#      ",
            "      ########      ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
        ],
        ["🥺「うんちがあって眠れないぷゆ！」", "🤥「ゆめちゃんの食事邪魔するのやめてな」"],
    ],
    [
        [
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
            "      ########      ",
            "      #..  Y #      ",
            "      #. YYYS#      ",
            "      #.y U U#      ",
            "      ########      ",
            "                    ",
            "                    ",
            "                    ",
            "                    ",
        ],
        [
            "🤥「ゆめちゃんうんち食べるよぉ🤥💩」",
            "🤥「なりすまし🤥💢",
            "　　 ゆめちゃんいちご食べるよぉ🤥🍓」",
            "🤥「おまなり🤥💢」",
            "😎「はよ寝ろ💢」",
        ],
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

        this.moveHistory = [];
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
                for (let x = 0; x < 21; x++) {
                    stageEntity[y][x] = {};
                    stageEntity[y][x].c = stageBG[y][x];
                }
            }
            entityList.forEach((entity, id) => {
                stageEntity[entity.y | 0][entity.x | 0].c = entity.char;
                stageEntity[entity.y | 0][entity.x | 0].id = id;
            });

            const moves = [];

            const judgeFlag = (block, flag) => (CHARA[block][2] & flag) == flag;

            // 壁(1)かつエンティティ(4)でない場合は止める
            {
                const block = stageEntity[this.y + this.dy][this.x + this.dx].c;
                if (judgeFlag(block, 1) && !judgeFlag(block, 4)) {
                    this.dx = 0;
                    this.dy = 0;
                    this.isMoving = false;
                }
            }

            // エンティティ(4)の場合、押すが、壁(1)の場合は止める
            {
                const block = stageEntity[this.y + this.dy][this.x + this.dx].c;
                if (judgeFlag(block, 4)) {
                    const block2 = stageEntity[this.y + this.dy * 2][this.x + this.dx * 2].c;
                    // 壁(1)ではない場合、動かす
                    // または、block1がゆめ(64)、block2がうんち(32)の場合、動かす
                    const notWall = !judgeFlag(block2, 1);
                    const yumePoop = judgeFlag(block, 64) && judgeFlag(block2, 32);
                    if (notWall || yumePoop) {
                        if (yumePoop) {
                            // うんち消去
                            const block2ID =
                                stageEntity[this.y + this.dy * 2][this.x + this.dx * 2].id;
                            moves.push([block2ID, this.x + this.dx * 2, this.y + this.dy * 2]);
                            entityList[block2ID].x = 20;
                        }
                        const id = stageEntity[this.y + this.dy][this.x + this.dx].id;
                        moves.push([id, this.x + this.dx, this.y + this.dy]);
                        const entity = entityList[id];
                        entity.isMoving = true;
                        entity.dx = this.dx;
                        entity.dy = this.dy;
                    } else {
                        // 壁の場合ストップ
                        this.dx = 0;
                        this.dy = 0;
                        this.isMoving = false;
                    }
                }
            }

            if (this.isMoving) {
                moves.push(["player", this.x, this.y]);
            }

            if (moves[0]) {
                this.moveHistory.push(moves);
            }
        }

        if (!this.isMoving) {
            if (inputManager.getKey("z") == 1) {
                console.log("undo");
                const moves = this.moveHistory.pop();
                if (moves) {
                    moves.forEach((move) => {
                        const entity = move[0];
                        const x = move[1];
                        const y = move[2];
                        if (entity == "player") {
                            this.x = x;
                            this.y = y;
                        } else {
                            entityList[entity].x = x;
                            entityList[entity].y = y;
                        }
                    });
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
        this.commentWaitTime = 0;
        this.stageBG = structuredClone(STAGE[stageNum][0]);
        this.entityList = [];
        this.goalList = [];

        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 20; x++) {
                let block = this.stageBG[y][x];
                let replaceFlag = false;
                if ((CHARA[block][2] & 2) == 2) {
                    this.goalList.push(new Goal(x, y));
                    this.stageBG[y] = nthReplace(this.stageBG[y], x, ".");
                    replaceFlag = true;
                }
                if ((CHARA[block][2] & 16) != 16) {
                    if (!replaceFlag) this.stageBG[y] = nthReplace(this.stageBG[y], x, " ");
                    if (block == "S") {
                        this.player = new Entity(block, x, y);
                    } else {
                        this.entityList.push(new Entity(block, x, y));
                    }
                }
            }
        }

        this.comments = STAGE[stageNum][1];
        this.commentWaitTime = 300;
    }

    update(inputManager) {
        this.retryWaitTime--;
        if (this.state == "playing") {
            // 入力したらコメント消去
            if (this.commentWaitTime > 0) {
                const keyList = [
                    "ArrowUp",
                    "ArrowDown",
                    "ArrowLeft",
                    "ArrowRight",
                    "w",
                    "s",
                    "a",
                    "d",
                    "r",
                    " ",
                ];
                keyList.forEach((k) => {
                    if (inputManager.getKey(k) == 1) {
                        this.commentWaitTime = 0;
                    }
                });
            }

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

        if (this.state == "gameClear") {
            ctx.font = "16px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000";
            if (currentSceneID + 1 == STAGE.length) {
                ctx.fillText("現在こちらがラストステージです", 200, 250);
                ctx.fillText("プレイありがとうございました", 200, 270);
            } else {
                ctx.fillText("Spaceで次のステージ", 200, 270);
            }
        } else if (this.retryWaitTime > 0) {
            ctx.font = "16px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000";
            ctx.fillText("もう一度Rでリトライ", 200, 270);
        }

        if (this.commentWaitTime > 0) {
            ctx.font = "16px monospace";
            ctx.textAlign = "left";
            ctx.fillStyle = "#000";
            if (this.comments) {
                this.comments.forEach((comment, id) => {
                    ctx.fillText(comment, 20, 30 + id * 20);
                });
            }
        }
    }
}

let prevTimestamp;
const maxFps = 60;
const loop = (timestamp) => {
    const elapsedSec = (timestamp - prevTimestamp) / 1000;
    const accuracy = 0.9; // あまり厳密にするとフレームが飛ばされることがあるので
    const frameTime = (1 / maxFps) * accuracy; // 精度を落とす
    if (elapsedSec <= frameTime) {
        requestAnimationFrame(loop.bind(this));
        return;
    }
    prevTimestamp = timestamp;

    inputManager.update();
    currentScene.update(inputManager);
    currentScene.render();
    requestAnimationFrame(loop.bind(this));
};

let currentSceneID = 0;
let currentScene = new GameScene(currentSceneID);
let inputManager = new InputManager(canvas);
requestAnimationFrame(loop.bind(this));

smartPhoneButton.addEventListener("click", () => {
    const buttons = document.getElementsByClassName("spb");
    for (const b of buttons) {
        if (b.style.visibility == "visible") {
            b.style.visibility = "collapse";
        } else {
            b.style.visibility = "visible";
        }
    }
});

const activeButtons = new Map();
const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "z", "r", " "];
document.querySelectorAll(".spb").forEach((b, k) => {
    b.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });
    b.addEventListener("touchstart", (event) => {
        const touch = event.changedTouches[0];
        activeButtons.set(touch.identifier, [b, k]);
        canvas.dispatchEvent(new KeyboardEvent("keydown", { key: keys[k] }));
        event.preventDefault();
    });
});

document.addEventListener("touchend", (event) => {
    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const bk = activeButtons.get(touch.identifier);
        if (bk == undefined) continue;
        const [button, k] = bk;
        if (button) {
            canvas.dispatchEvent(new KeyboardEvent("keyup", { key: keys[k] }));
            activeButtons.delete(touch.identifier);
        }
    }
});
