"use strict";

class StrokeRectActor extends RectActor {
    render(canvas) {
        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = this.color;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
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

const stageScoreList = Array(STAGE.length).fill(999);
const stageHighScoreList = [5, 8, 15, 42, 42, 38, 50, 53, 43, 26, 40, 57];
for (let i = 0; i < STAGE.length; i++) {
    const cookieName = "stageScore_" + i;
    const score = CookieManager.getCookie(cookieName);
    if (score) stageScoreList[i] = +score;
}

class Soukoban extends Game {
    constructor(canvas, currentSceneList) {
        super(canvas, currentSceneList, 60);
        this.changeScene(currentSceneList);
    }
}

assets.addImage("stageSelect", "img/stage_select.png");
assets.loadAll().then(() => {
    const scene = [new TitleScene()];
    //const scene = [new GameScene(1)];
    const game = new Soukoban(canvas, scene, 60);
    game.start();
});
