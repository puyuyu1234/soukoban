"use strict";

class StrokeRectActor extends RectActor {
    render(canvas) {
        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = this.color;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

class Entity extends TextActor {
    constructor(c, x, y) {
        const text = CHARA[c][1];
        super(text, x, y);
        this.c = c;
        this.dx = 0;
        this.dy = 0;
        this.isMoving = false;
        this.speed = 0.125;
        this.actor = null;
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

        if (this.actor) {
            this.actor.x = this.x * BLOCKSIZE + BLOCKSIZE / 2;
            this.actor.y = this.y * BLOCKSIZE + BLOCKSIZE / 2;
        }
    }
}

class Player extends Entity {
    constructor(c, x, y) {
        super(c, x, y);
        this.isStartMove = false;
        this.moveHistory = [];
    }

    input(inputManager, entityList) {
        this.isStartMove = false;
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
                    this.isStartMove = true;
                    this.dx = km[1];
                    this.dy = km[2];
                    return;
                }
            });
        }

        if (!this.isMoving) {
            const z = inputManager.getKey("z");
            if (z == 1 || (z >= 20 && z % 3 == 0)) {
                console.log("undo");
                const moves = this.moveHistory.pop();
                if (moves) {
                    moves.forEach((move) => {
                        const entityID = move[0];
                        const x = move[1];
                        const y = move[2];
                        if (entityID == "player") {
                            this.x = x;
                            this.y = y;
                        } else {
                            entityList[entityID].x = x;
                            entityList[entityID].y = y;
                        }
                    });
                }
            }
        }
    }

    hitbox(stageBG, entityList) {
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
            stageEntity[entity.y | 0][entity.x | 0].c = entity.c;
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
                        const block2ID = stageEntity[this.y + this.dy * 2][this.x + this.dx * 2].id;
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
}

class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    judgeEntity(entityList) {
        let f = false;
        entityList.forEach((entity) => {
            if (entity.x == this.x && entity.y == this.y && (CHARA[entity.c][2] & 8) == 8) {
                f = true;
                return;
            }
        });
        return f;
    }
}

class GameScene extends Scene {
    constructor(stageNum) {
        super();
        this.stageNum = stageNum;
        this.state = "playing";
        this.retryWaitTime = 0;
        this.commentWaitTime = 0;
        this.stageBG = structuredClone(STAGE[stageNum][0]);
        this.entityList = [];
        this.goalList = [];
        this.isFreeze = false;

        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 20; x++) {
                const block = this.stageBG[y][x];
                let replaceFlag = false;
                if ((CHARA[block][2] & 2) == 2) {
                    this.goalList.push(new Goal(x, y));
                    this.stageBG[y] = nthReplace(this.stageBG[y], x, ".");
                    replaceFlag = true;
                }
                if ((CHARA[block][2] & 16) != 16) {
                    if (!replaceFlag) this.stageBG[y] = nthReplace(this.stageBG[y], x, " ");
                    if (block == "S") {
                        this.player = new Player(block, x, y);
                    } else {
                        this.entityList.push(new Entity(block, x, y));
                    }
                }
            }
        }

        // 背景アクター追加
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 20; x++) {
                const block = this.stageBG[y][x];
                const color = CHARA[block][1];
                const bgActor = new RectActor(
                    color,
                    x * BLOCKSIZE,
                    y * BLOCKSIZE,
                    BLOCKSIZE,
                    BLOCKSIZE
                );
                bgActor.id = y * 20 + x;
                this.add(bgActor);
                const strokeActor = new StrokeRectActor(
                    "#ccc",
                    x * BLOCKSIZE,
                    y * BLOCKSIZE,
                    BLOCKSIZE,
                    BLOCKSIZE
                );
                strokeActor.id = y * 20 + x + 300;
                this.add(strokeActor);
            }
        }

        // プレイヤーアクター追加
        {
            const text = CHARA[this.player.c][1];
            const playerActor = new TextActor(
                text,
                this.player.x * BLOCKSIZE + BLOCKSIZE / 2,
                this.player.y * BLOCKSIZE + BLOCKSIZE / 2
            );
            playerActor.layer = 1;
            playerActor.id = 0;
            playerActor.font = "16px monospace";
            this.player.actor = playerActor;
            this.add(playerActor);
        }

        // エンティティアクター追加
        this.entityList.forEach((entity, id) => {
            const text = CHARA[entity.c][1];
            const entityActor = new TextActor(
                text,
                entity.x * BLOCKSIZE + BLOCKSIZE / 2,
                entity.y * BLOCKSIZE + BLOCKSIZE / 2
            );
            entityActor.layer = 1;
            entityActor.id = 1 + id;
            entityActor.font = "16px monospace";
            entity.actor = entityActor;
            this.add(entityActor);
        });

        // ステージバーアクターなど追加
        {
            const stageName = new TextActor("STAGE : " + stageNum, 50, 10);
            const step = new TextActor("STEP : 0", 250, 10);
            stageName.color = step.color = "#fff";
            stageName.textAlign = step.textAlign = "left";
            step.update = () => {
                step.text = "STEP : " + this.player.moveHistory.length;
            };
            const layer2Actors = [
                new RectActor("#000", 0, 0, 400, 20),
                new RectActor("#000", 0, 280, 400, 20),
                stageName,
                step,
            ];
            layer2Actors.forEach((actor, id) => {
                actor.layer = 2;
                actor.id = id;
                this.add(actor);
            });

            stageName.layer = 2;
        }

        // ステージコメント表示
        {
            this.commentActor = [];
            const comments = STAGE[stageNum][1];
            if (comments.length != 0) {
                const bg = new RectActor("#0006", 0, 0, 0, 40 + comments.length * 20);
                bg.layer = 3;
                bg.w0 = 0;
                bg.w1 = 400;
                bg.time = -20;
                bg.moveTime = 20;
                bg.update = () => {
                    bg.width = easeOutExpo(bg.w0, bg.w1, bg.time, bg.moveTime);
                    bg.time++;
                };
                this.commentActor.push(bg);
                this.add(bg);

                comments.forEach((comment, id) => {
                    const ca = new TextActor("", 20, 30 + id * 20);
                    ca.color = "#fff";
                    ca.textAlign = "left";
                    ca.font = "16px monospace";
                    ca.layer = 3;
                    ca.id = 1 + id;
                    ca.time = -20;
                    ca.update = () => {
                        if (ca.time > 20 + id * 5) {
                            ca.text = comment;
                        } else {
                            ca.text = "";
                        }
                        ca.time++;
                    };
                    this.commentActor.push(ca);
                    this.add(ca);
                });
            }
        }

        // 暗転解除
        {
            const blackActor = this.makeBlackActor(400, 0, 20);
            this.add(blackActor);
        }

        this.isCommentShowed = true;
    }

    makeBlackActor(w0, w1, moveTime, changeScene = undefined, changeTime) {
        const blackActor = new RectActor("#000", 0, 0, w0, 300);
        blackActor.layer = 9;
        blackActor.w0 = w0;
        blackActor.w1 = w1;
        blackActor.time = 0;
        blackActor.moveTime = moveTime;
        blackActor.update = () => {
            blackActor.width = easeOutExpo(
                blackActor.w0,
                blackActor.w1,
                blackActor.time,
                blackActor.moveTime
            );
            if (changeScene) {
                if (blackActor.time > changeTime) currentScene = changeScene;
            }
            blackActor.time++;
        };

        return blackActor;
    }

    update(inputManager) {
        super.update(inputManager);
        if (this.isFreeze) return;
        this.retryWaitTime--;
        if (this.state == "playing") {
            this.player.input(inputManager, this.entityList);
            if (this.player.isStartMove) {
                this.player.hitbox(this.stageBG, this.entityList);
                // 入力したらコメント消去
                if (this.isCommentShowed) {
                    this.commentActor.forEach((ca) => (ca.time = -Infinity));
                    const bg = this.commentActor[0];
                    if (bg) {
                        bg.time = 0;
                        bg.update = () => {
                            bg.width = easeOutExpo(400, 0, bg.time, 20);
                            bg.time++;
                        };
                        this.isCommentShowed = false;
                    }
                }
            }

            if (this.retryWaitTime <= 0) {
                const retryActor = new TextActor("", 200, 290);
                retryActor.layer = 4;
                this.add(retryActor);
            }

            // リトライ受付
            if (inputManager.getKey("r") == 1) {
                if (this.retryWaitTime <= 0) {
                    const retryActor = new TextActor(TEXT.retry, 200, 290);
                    retryActor.font = "16px monospace";
                    retryActor.layer = 4;
                    retryActor.color = "#fff";
                    this.add(retryActor);
                    this.retryWaitTime = 90;
                } else {
                    this.isFreeze = true;
                    const blackActor = this.makeBlackActor(
                        0,
                        400,
                        20,
                        new GameScene(this.stageNum),
                        25
                    );
                    this.add(blackActor);
                }
            }

            // キャラ移動
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
            if (inputManager.getKey("0") == 30) {
                c = this.goalList.length;
            }
            if (c == this.goalList.length) {
                // クリア演出
                {
                    const setEase = (actor, x0, x1, moveTime) => {
                        actor.update = () => {
                            actor.x = easeOutExpo(x0, x1, actor.time, moveTime);
                            actor.time++;
                        };
                    };
                    const clearBG = new RectActor("#0006", 0, 150, 400, 0);
                    clearBG.update = () => {
                        const height = easeOutExpo(0, 260, clearBG.time, 20);
                        clearBG.y = 150 - height / 2;
                        clearBG.height = height;
                        clearBG.time++;
                    };

                    const clear1 = new RectActor("#fff", 400, 120, 400, 2);
                    const clear2 = new RectActor("#fff", -800, 178, 400, 2);
                    setEase(clear1, 400, 0, 60);
                    setEase(clear2, -800, 0, 60);
                    const clear3 = new TextActor(TEXT.stageClear, 200, 180);
                    clear3.color = "rgb(255 255 255 / 0)";
                    clear3.font = "40px monospace";
                    clear3.update = () => {
                        const y = easeOutExpo(180, 150, clear3.time, 20);
                        const alpha = easeLinear(0, 1, clear3.time, 20);
                        clear3.y = y;
                        clear3.color = `rgb(255 255 255 / ${alpha})`;
                        clear3.time++;
                    };
                    const clearActors = [clearBG, clear1, clear2, clear3];
                    clearActors.forEach((actor, id) => {
                        actor.layer = 5;
                        actor.id = id;
                        this.add(actor);
                    });
                }

                if (this.stageNum + 1 == STAGE.length) {
                    // last stage
                    const clearActor = new TextActor(TEXT.lastStage, 200, 270);
                    const clearActor2 = new TextActor(TEXT.lastStage2, 200, 290);
                    clearActor.font = "16px monospace";
                    clearActor2.font = "16px monospace";
                    clearActor.layer = 10;
                    clearActor2.layer = 10;
                    clearActor2.id = 1;
                    clearActor.color = "#fff";
                    clearActor2.color = "#fff";
                    this.add(clearActor);
                    this.add(clearActor2);
                    this.state = "gameClear";
                } else {
                    const clearActor = new TextActor(TEXT.clearEX, 200, 290);
                    clearActor.font = "16px monospace";
                    clearActor.layer = 4;
                    clearActor.color = "#fff";
                    this.add(clearActor);
                    this.state = "gameClear";
                }
            }
        }

        if (this.state == "gameClear") {
            if (inputManager.getKey(" ") == 1) {
                if (this.stageNum + 1 == STAGE.length) {
                    // last stage
                } else {
                    const blackActor = this.makeBlackActor(
                        0,
                        400,
                        20,
                        new GameScene(++this.stageNum),
                        25
                    );
                    this.add(blackActor);
                }
            }
        }
    }
}

class TitleScene extends GameScene {
    constructor() {
        super(0);
        this.isFreeze = true;
        const BG = new RectActor("#000", 0, 0, 400, 300);
        BG.layer = 7;
        BG.update = () => {
            if (BG.time > 300) {
                BG.height = easeLinear(300, 0, BG.time - 300, 60);
                this.isFreeze = false;
            }
            BG.time++;
        };
        this.add(BG);
        this.titleAnimationActor = [BG];

        const titleBG = new RectActor("#000", 0, 200, 400, 100);
        titleBG.layer = 8;
        this.add(titleBG);
        this.titleActors = [titleBG];
        const titleActorsData = [
            ["🥺", 400, 250, "60px"],
            ["を倉庫に", 480, 240, "20px"],
            ["押し込むゲーム", 500, 270, "20px"],
            ["👐", 630, 250, "60px"],
            ["😎", 700, 250, "60px"],
        ];
        titleActorsData.forEach((tad, id) => {
            const titleActor = new TextActor(tad[0], tad[1], tad[2]);
            titleActor.font = tad[3] + " bold monospace";
            titleActor.color = "#fff";
            titleActor.textAlign = "left";
            titleActor.layer = 8;
            titleActor.id = 1 + id;
            titleActor.update = () => {
                titleActor.x = easeLinear(tad[1], tad[1] - 390, titleActor.time, 300);
                titleActor.time++;
            };
            this.add(titleActor);
            this.titleAnimationActor.push(titleActor);
            this.titleActors.push(titleActor);
        });
    }

    update(inputManager) {
        super.update(inputManager);

        const keyList = [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "w",
            "a",
            "s",
            "d",
            "r",
            "z",
            " ",
        ];
        keyList.forEach((key) => {
            if (inputManager.getKey(key) == 1) {
                this.titleAnimationActor.forEach((actor) => {
                    actor.time = 400;
                });
            }

            if (this.titleAnimationActor[0].time == 500) {
                this.titleActors.forEach((actor) => {
                    const y = actor.y;
                    actor.time = 0;
                    actor.update = () => {
                        actor.y = easeOutExpo(y, y + 100, actor.time, 60);
                        actor.time++;
                    };
                });
            }
        });
    }
}

//let currentScene = new GameScene(5);
let currentScene = new TitleScene();

const game = new Game(canvas, currentScene);
game.start();
