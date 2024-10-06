"use strict";

class MenuScene extends Scene {
    constructor(parentScene) {
        super();
        this.time = 0;
        this.isFreeze = false;
        this.parentScene = parentScene;
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

        const BG = new RectActor("#000c", 0, 20, 400, 260);
        const actorList = [BG];

        // ボタンなど
        {
            const resumeButton = new RectActor("#888", 160, 52, 80, 16);
            const resume = new TextActor(TEXT.menu.Resume, 200, 60);
            resume.font = "10px monospace";
            const selectButton = new RectActor("#888", 160, 92, 80, 16);
            const select = new TextActor(TEXT.menu.Stage, 200, 100);
            select.font = "10px monospace";

            actorList.push(resumeButton, resume, selectButton, select);
            this.button = {
                selectID: 0,
                rect: [resumeButton, selectButton],
                text: [resume, select],
            };
        }

        // 操作方法
        {
            const keyButtonActor = (k, x, y, w, h) => {
                const button = new StrokeRectActor("#fff", x - w / 2, y - h / 2, w, h);
                const key = new TextActor(k, x, y);
                key.font = "12px monospace";
                key.color = "#fff";
                actorList.push(button, key);
            };
            const guideTextActor = (t, x, y) => {
                const text = new TextActor(t, x, y);
                text.font = "12px monospace";
                text.color = "#fff";
                actorList.push(text);
            };
            const lineActor = (x, y, w) => {
                const line = new RectActor("#fff", x - w / 2, y - 1, w, 2);
                actorList.push(line);
            };
            const guide = new TextActor(TEXT.menu.Guide, 200, 150);
            guide.color = "#fff";
            lineActor(200, 170, 360);
            guideTextActor(TEXT.menu.Move, 110, 190);
            keyButtonActor("Ｗ", 70, 230, 16, 16);
            keyButtonActor("Ａ", 50, 250, 16, 16);
            keyButtonActor("Ｓ", 70, 250, 16, 16);
            keyButtonActor("Ｄ", 90, 250, 16, 16);
            keyButtonActor("↑", 150, 230, 16, 16);
            keyButtonActor("←", 130, 250, 16, 16);
            keyButtonActor("↓", 150, 250, 16, 16);
            keyButtonActor("→", 170, 250, 16, 16);
            guideTextActor(TEXT.menu.Retry, 270, 185);
            keyButtonActor("Ｒ", 350, 185, 16, 16);
            lineActor(300, 200, 160);
            guideTextActor(TEXT.menu.Undo, 270, 215);
            keyButtonActor("Ｚ", 350, 215, 16, 16);
            guideTextActor(TEXT.menu.Cont, 270, 235);
            guideTextActor(TEXT.menu.Long, 350, 235);
            lineActor(300, 250, 160);
            guideTextActor(TEXT.menu.Menu, 270, 265);
            keyButtonActor("ESC", 350, 265, 24, 16);

            const spaceText = new TextActor(TEXT.menu.Space, 200, 290);
            spaceText.font = "16px monospace";
            spaceText.color = "#fff";
            actorList.push(guide, spaceText);
        }

        this.acList = actorList;
        addActors(actorList);
    }

    setChoiseAnimation(selectID) {
        // とりあえずすべて縮小
        this.button.rect.forEach((rect, id) => {
            rect.time = 0;
            rect.w0 = rect.width;
            rect.h0 = rect.height;
            rect.c0 = parseInt(rect.color.slice(1, 2), 16);
            rect.update = () => {
                const c = (easeOutExpo(rect.c0, 8, rect.time, 10) | 0).toString(16);
                rect.color = "#" + c + c + c;
                const w = easeOutExpo(rect.w0, 80, rect.time, 10);
                rect.width = w;
                rect.x = 200 - w / 2;
                const h = easeOutExpo(rect.h0, 16, rect.time, 10);
                rect.height = h;
                rect.y = 60 + id * 40 - h / 2;
                rect.time++;
            };
        });
        this.button.text.forEach((text) => {
            text.font = "10px monospace";
        });

        // selectIDのものだけ拡大
        {
            const rect = this.button.rect[selectID];
            const text = this.button.text[selectID];
            rect.time = 0;
            rect.w0 = rect.width;
            rect.h0 = rect.height;
            rect.c0 = parseInt(rect.color.slice(1, 2), 16);
            rect.update = () => {
                const c = (easeOutExpo(rect.c0, 15, rect.time, 10) | 0).toString(16);
                rect.color = "#" + c + c + c;
                const w = easeOutExpo(rect.w0, 120, rect.time, 10);
                rect.width = w;
                rect.x = 200 - w / 2;
                const h = easeOutExpo(rect.h0, 24, rect.time, 10);
                rect.height = h;
                rect.y = 60 + selectID * 40 - h / 2;
                rect.time++;
            };
            text.font = "16px monospace";
        }
    }

    update(inputManager) {
        super.update(inputManager);
        this.time++;
        if (this.isFreeze) return;

        // 選択肢アニメーション設定
        if (this.time == 10) {
            this.setChoiseAnimation(this.button.selectID);
        }

        const keyList = ["ArrowUp", "ArrowDwon", "w", "s"];
        keyList.forEach((key) => {
            if (inputManager.getKey(key) == 1) {
                this.button.selectID = (this.button.selectID + 1) % 2;
                this.setChoiseAnimation(this.button.selectID);
            }
        });

        if (inputManager.getKey(" ") == 1) {
            if (this.button.selectID == 0) {
                this.close();
            } else {
                this.changeScene([new StageSelect(Math.max(0, this.parentScene.stageNum - 1))]);
                // stage select
            }
        }

        // メニュー閉じ受付
        if (inputManager.getKey("Escape") == 1) {
            this.close();
        }
    }

    close() {
        this.isFreeze = true;
        this.acList.forEach((actor) => {
            actor.time = 0;
            actor.update = () => {
                actor.globalAlpha = easeLinear(1, 0, actor.time, 10);
                actor.time++;
            };
            this.add(actor);
        });

        const changeScene = new Actor(0, 0);
        changeScene.time = 0;
        changeScene.update = () => {
            if (changeScene.time == 10) {
                this.parentScene.isFreeze = false;
                this.changeScene([this.parentScene]);
            }
            changeScene.time++;
        };
        this.add(changeScene);
    }
}
