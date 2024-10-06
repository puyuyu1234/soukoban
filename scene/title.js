"use strict";

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

            if (this.titleAnimationActor[0].time == 400) {
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
