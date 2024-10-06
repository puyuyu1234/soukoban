"use strict";

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
                // BG登録
                const block = this.stageBG[y][x];
                let replaceFlag = false;
                if ((CHARA[block][2] & 2) == 2) {
                    this.goalList.push(new Goal(x, y));
                    this.stageBG[y] = nthReplace(this.stageBG[y], x, ".");
                    replaceFlag = true;
                }

                // Entity登録
                if ((CHARA[block][2] & 16) != 16) {
                    if (!replaceFlag) this.stageBG[y] = nthReplace(this.stageBG[y], x, " ");
                    if (block == "S") {
                        this.player = new Player(block, x, y);
                    } else {
                        const entity = new Entity(block, x, y);
                        this.entityList.push(entity);
                        if ((CHARA[block][2] & 256) == 256) {
                            // letter2以上
                            const l = (CHARA[block][2] & 8) == 8 ? "0" : "9";
                            const entity2 = new Entity(l, x + 1, y);
                            let eList = [entity, entity2];
                            this.entityList.push(entity2);
                            if (CHARA[block][0] == "3letter") {
                                const entity3 = new Entity(l, x + 2, y);
                                eList.push(entity3);
                                this.entityList.push(entity3);
                            }
                            for (let i = 0; i < eList.length; i++) {
                                for (let j = 0; j < eList.length; j++) {
                                    if (i == j) continue;
                                    eList[i].otherLetterList.push(eList[j]);
                                }
                            }
                        }
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
            const stageName = new TextActor(formatString(TEXT.stage, stageNum), 50, 10);
            const step = new TextActor("STEP : 0", 250, 10);
            stageName.color = step.color = "#fff";
            stageName.textAlign = step.textAlign = "left";
            step.update = () => {
                step.text = formatString(
                    TEXT.step,
                    this.player.moveHistory.length,
                    stageHighScoreList[stageNum] ?? "--"
                );
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
                const bg = new RectActor("#0008", 0, 20, 0, 20 + comments.length * 20);
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
                    const ca = new TextActor("", 20, 40 + id * 20);
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
        blackActor.time = 0;
        blackActor.update = () => {
            blackActor.width = easeOutExpo(w0, w1, blackActor.time, moveTime);
            if (changeScene) {
                if (blackActor.time > changeTime) this.changeScene([changeScene]);
            }
            blackActor.time++;
        };

        return blackActor;
    }

    // 入力処理
    updateInput(inputManager) {
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

        // メニュー受付
        if (inputManager.getKey("Escape") == 1) {
            this.isFreeze = true;
            this.changeScene([this, new MenuScene(this)]);
        }
    }

    update(inputManager) {
        super.update(inputManager);
        if (this.isFreeze) return;

        if (this.state == "playing") {
            this.updateInput(inputManager);
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

            this.retryWaitTime--;
            if (this.retryWaitTime <= 0) {
                const retryActor = new TextActor("", 200, 290);
                retryActor.layer = 4;
                this.add(retryActor);
            }

            // キャラ移動
            this.player.update();
            this.entityList.forEach((entity) => {
                entity.adjastOtherLetter();
            });
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
                // スコア記録
                {
                    const newScore = Math.min(
                        stageScoreList[this.stageNum],
                        this.player.moveHistory.length
                    );
                    if (newScore < stageScoreList[this.stageNum]) {
                        // highscore
                        const highscore = new TextActor(TEXT.highScore, 200, 230);
                        highscore.globalAlpha = 0;
                        highscore.rotate = 10;
                        highscore.color = "#ff0";
                        highscore.font = "120px monospace";
                        highscore.update = () => {
                            if (highscore.time > 30) {
                                const s = easeOutExpo(120, 30, highscore.time - 30, 30);
                                highscore.font = s + "px monospace";
                                const alpha = easeLinear(0, 1, highscore.time - 30, 30);
                                highscore.globalAlpha = alpha;
                            }
                            highscore.time++;
                        };
                        highscore.layer = 6;
                        highscore.id = 0;
                        this.add(highscore);
                    }
                    stageScoreList[this.stageNum] = newScore;
                    // クッキー保存
                    if (!CookieManager.setCookie("stageScore_" + this.stageNum, newScore)) {
                        // error
                        console.log("cookieWriteError");
                        const ErrorBG = new RectActor("#fff", 0, 280, 400, 20);
                        ErrorBG.layer = 9;
                        const ErrorText = new TextActor(TEXT.cookieWriteError, 0, 290);
                        ErrorText.textAlign = "left";
                        ErrorText.layer = 9;
                        ErrorText.id = 1;
                        ErrorText.color = "#f00";
                        this.add(ErrorBG);
                        this.add(ErrorText);
                    }
                }

                // クリア演出
                {
                    const setEase = (actor, x0, x1, moveTime) => {
                        actor.update = () => {
                            actor.x = easeOutExpo(x0, x1, actor.time, moveTime);
                            actor.time++;
                        };
                    };
                    const clearBG = new RectActor("#0008", 0, 150, 400, 0);
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
                    const clearActor =
                        this.stageNum == 0
                            ? new TextActor(TEXT.clear0, 200, 290)
                            : new TextActor(TEXT.clearEX, 200, 290);
                    clearActor.font = "16px monospace";
                    clearActor.layer = 4;
                    clearActor.color = "#fff";
                    this.add(clearActor);
                    this.state = "gameClear";
                }
            }
        }

        if (this.state == "gameClear") {
            this.updateInput(inputManager);
            if (inputManager.getKey(" ") == 1) {
                if (this.stageNum + 1 == STAGE.length) {
                    // last stage
                } else {
                    const blackActor = this.makeBlackActor(
                        0,
                        400,
                        20,
                        this.stageNum == 0 ? new StageSelect(0) : new GameScene(++this.stageNum),
                        25
                    );
                    this.add(blackActor);
                }
            }
        }
    }
}
