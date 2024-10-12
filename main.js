"use strict";

class StrokeRectActor extends RectActor {
    render(canvas) {
        const ctx = canvas.getContext("2d");
        ctx.globalAlpha = this.globalAlpha;
        ctx.strokeStyle = this.color;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

class AudioActor extends Actor {
    constructor(track, loopStart = -1, loopEnd = -1) {
        super();
        this.audio = new Audio(track);
        this.loopStart = loopStart;
        this.loopEnd = loopEnd;
        this.canPlay = false;
    }

    update() {
        // console.log(this.audio.currentTime, this.loopEnd);
        // if (this.loopEnd < this.audio.currentTime) {
        //     this.audio.currentTime -= this.loopEnd - this.loopStart;
        // }
    }

    render() {}

    changeVolume(volume) {
        this.audio.volume = volume;
    }

    play(currentTime = 0) {
        if (!this.canPlay) return;
        this.isPlaying = true;
        this.audio.currentTime = currentTime / 1000;
        this.audio.play();

        clearTimeout(this.timeoutID);
        if (this.loopStart != -1) {
            this.timeoutID = setTimeout(() => {
                this.play(this.loopStart);
            }, this.loopEnd - currentTime);
        }
    }

    stop() {
        this.isPlaying = false;
        this.audio.pause();
        clearTimeout(this.timeoutID);
    }
}

class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    judgeEntity(player, entityList) {
        let f = false;
        const el = entityList.concat(player);
        el.forEach((entity) => {
            if (entity.x == this.x && entity.y == this.y && (CHARA[entity.c][2] & 8) == 8) {
                f = true;
                return;
            }
        });
        return f;
    }
}

const stageScoreList = Array(STAGE.length).fill(999);
const stageHighScoreList = [
    5, 8, 11, 42, 42, 38, 50, 51, 43, 26, 36, 57, 19, 35, 74, 19, 33, 52, 52, 111, 20,
];
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

const time = (8 * 4 * 60 * 1000) / 126;
const audio = {
    move: new AudioActor("se/move.mp3"),
    select: new AudioActor("se/select.mp3"),
    push: new AudioActor("se/push.mp3"),
    clear: new AudioActor("se/clear.mp3"),
    bgm: new AudioActor("bgm/bgm.mp3", time / 2, (time * 3) / 2),
};

assets.addImage("stageSelect", "img/stage_select.png");

canvas.addEventListener(
    "click",
    () => {
        for (let key in audio) {
            audio[key].canPlay = true;
        }
    },
    { once: true }
);

assets.loadAll().then(() => {
    const scene = [new TitleScene()];
    //const scene = [new StageSelect(1)];
    const game = new Soukoban(canvas, scene, 60);
    game.start();
});
