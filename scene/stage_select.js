"use strict";

class StageSelect extends Scene {
    constructor(stageNum = 0) {
        super();
        this.stageNum = stageNum;
        this.cursorX = stageNum % 4;
        this.cursorY = (stageNum / 4) | 0;
        this.cursorLimitY = Math.ceil((STAGE.length - 1) / 4);
        const addActors = (actorList) => {
            actorList.forEach((actor, id) => {
                actor.id = id;
                actor.globalAlpha = 0;
                actor.time = 0;
                actor.update = () => {
                    actor.globalAlpha = easeLinear(0, 1, actor.time, 10);
                    actor.time++;
                };
                this.add(actor);
            });
        };
        const actorList = [];
        const BGsprite = new Sprite(assets.get("stageSelect"), new Rectangle(67, 0, 400, 300));
        const BG1 = new SpriteActor(BGsprite, 0, 0, 400, 300);
        const BG2 = new RectActor("#0009", 0, 0, 400, 300);
        const BG3 = new RectActor("#fff", 100, 50, 200, 2);
        const cursor = new StrokeRectActor(
            "#ff0",
            195 + 50 * this.cursorX,
            75 + 40 * this.cursorY,
            50,
            40
        );
        cursor.layer = 2;
        this.cursor = cursor;
        const title = new TextActor(TEXT.select.title, 200, 30);
        title.color = "#fff";
        actorList.push(BG1, BG2, BG3, title, cursor);
        STAGE.forEach((stageData, id) => {
            if (id == 0) return;
            const stage = stageData[0];
            const baseX = 200 + 50 * ((id - 1) % 4);
            const baseY = 80 + 40 * (((id - 1) / 4) | 0);
            for (let y = 0; y < 15; y++) {
                for (let x = 0; x < 20; x++) {
                    const charaData = CHARA[stage[y][x]];
                    let color;
                    if (charaData[0] == "color") {
                        color = charaData[1];
                    } else {
                        color = "#ff0";
                    }
                    const stagePixel = new RectActor(color, baseX + x * 2, baseY + y * 2, 2, 2);
                    actorList.push(stagePixel);
                }
            }
        });

        const FG = new RectActor("#000", 0, 280, 400, 20);
        actorList.push(FG);
        const space = new TextActor(TEXT.select.space, 200, 290);
        space.color = "#fff";
        space.font = "16px monospace";
        actorList.push(FG, space);

        addActors(actorList);
        this.stageRender(stageNum + 1);
    }

    stageRender(stageNum) {
        const addActors = (actorList) => {
            actorList.forEach((actor, id) => {
                actor.layer = 1;
                actor.id = id;
                actor.y0 = actor.y;
                actor.globalAlpha = 0;
                actor.time = 0;
                actor.update = () => {
                    actor.globalAlpha = easeLinear(0, 1, actor.time, 10);
                    actor.y = easeOutExpo(actor.y0 + 10, actor.y0, actor.time, 20) | 0;
                    actor.time++;
                };
                this.add(actor);
            });
        };
        const actorList = [];
        const stageText = new TextActor(formatString(TEXT.select.stage, stageNum), 100, 90);
        const sc1 = stageScoreList[stageNum] ?? "--";
        const sc2 = stageHighScoreList[stageNum] ?? "--";
        const stepText = new TextActor(formatString(TEXT.select.step, sc1, sc2), 100, 115);
        if (+sc1 < +sc2) {
            stepText.color = "#f22";
        } else if (+sc1 == +sc2) {
            stepText.color = "#ff4";
        } else {
            stepText.color = "#fff";
        }
        const stageBG = new RectActor("#000", 15, 145, 160, 120);
        stageText.color = "#fff";
        actorList.push(stageText, stepText, stageBG);
        const stageData = STAGE[stageNum];
        if (stageData) {
            const stage = stageData[0];
            const baseX = 20;
            const baseY = 140;
            const size = 8;
            for (let y = 0; y < 15; y++) {
                for (let x = 0; x < 20; x++) {
                    const charaData = CHARA[stage[y][x]];
                    let color;
                    if (charaData[0] == "color") {
                        color = charaData[1];
                    } else {
                        color = "#ff0";
                    }
                    const stagePixel = new RectActor(
                        color,
                        baseX + x * size,
                        baseY + y * size,
                        size,
                        size
                    );
                    actorList.push(stagePixel);
                }
            }
        } else {
            for (let i = 0; i < 300; i++) {
                const ac = new Actor(0, 0);
                actorList.push(ac);
            }
        }
        addActors(actorList);
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

    update(inputManager) {
        super.update(inputManager);

        // カーソル移動
        const cursorMoveList = [
            ["ArrowUp", 0, -1],
            ["ArrowDown", 0, 1],
            ["ArrowLeft", -1, 0],
            ["ArrowRight", 1, 0],
            ["w", 0, -1],
            ["s", 0, 1],
            ["a", -1, 0],
            ["d", 1, 0],
        ];
        cursorMoveList.forEach((cursorMove, id) => {
            if (inputManager.getKey(cursorMove[0]) == 1) {
                this.cursorX = (4 + this.cursorX + cursorMoveList[id][1]) % 4;
                this.cursorY =
                    (this.cursorLimitY + this.cursorY + cursorMoveList[id][2]) % this.cursorLimitY;
                this.cursor.x0 = this.cursor.x;
                this.cursor.y0 = this.cursor.y;
                const x1 = 195 + 50 * this.cursorX;
                const y1 = 75 + 40 * this.cursorY;

                this.cursor.time = 0;
                this.cursor.update = () => {
                    this.cursor.x = easeOutExpo(this.cursor.x0, x1, this.cursor.time, 10);
                    this.cursor.y = easeOutExpo(this.cursor.y0, y1, this.cursor.time, 10);
                    this.cursor.time++;
                };
                this.stageNum = 4 * this.cursorY + this.cursorX;
                this.stageRender(this.stageNum + 1);
            }
        });

        if (inputManager.getKey(" ") == 1) {
            if (STAGE[1 + this.stageNum]) {
                const blackActor = this.makeBlackActor(
                    0,
                    400,
                    20,
                    new GameScene(1 + this.stageNum),
                    25
                );
                this.add(blackActor);
            }
        }
    }
}
