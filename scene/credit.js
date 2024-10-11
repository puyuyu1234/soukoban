"use strict";

class CreditScene extends Scene {
    constructor(parentScene) {
        super();
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

        const BG = new RectActor("#000c", 250, 0, 150, 300);
        const BG2 = new RectActor("#000", 0, 280, 400, 20);
        const ex = new TextActor(TEXT.credit.space, 200, 290);
        ex.color = "#fff";
        ex.font = "16px monospace";

        const credits = [
            new TextActor(TEXT.credit.credit1, 325, 30),
            new TextActor(TEXT.credit.credit2, 325, 50),
            new TextActor(TEXT.credit.credit3, 325, 90),
            new TextActor(TEXT.credit.credit4, 325, 110),
            new TextActor(TEXT.credit.credit5, 325, 150),
            new TextActor(TEXT.credit.credit6, 325, 170),
            new TextActor(TEXT.credit.credit7, 325, 200),
            new TextActor(TEXT.credit.credit8, 325, 250),
        ];
        credits.forEach((actor) => {
            actor.color = "#fff";
            actor.font = "12px monospace";
        });

        const actorList = [BG, BG2, ex].concat(credits);
        this.acList = actorList;

        addActors(actorList);
    }

    update(inputManager) {
        super.update(inputManager);

        // 閉じ受付
        if (inputManager.getKey(" ") == 1) {
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
