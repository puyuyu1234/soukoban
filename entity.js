"use strict";

class Entity {
    constructor(c, x, y) {
        this.x = x;
        this.y = y;
        this.c = c;
        this.dx = 0;
        this.dy = 0;
        this.isMoving = false;
        this.speed = 0.125;
        this.actor = null;
        this.tags = [];
        this.letter = 1;

        this.otherLetterList = [];
        if (CHARA[c][0] == "2letter") {
            this.letter = 2;
        }
        if (CHARA[c][0] == "3letter") {
            this.letter = 3;
        }
    }

    hasTag(tagName) {
        return this.tags.includes(tagName);
    }

    setMove(stageEntity, moves, dx, dy) {
        const judgeFlag = (block, flag) => (CHARA[block][2] & flag) == flag;

        // 仮の移動ステータス登録
        this.isMoving = true;
        this.dx = dx;
        this.dy = dy;

        // 移動先が
        // otherLetterと同一の場合はreturn true
        // Entity(4)かつ、thisがpusher(128)の場合は再帰判定
        // うんち(32)かつ、thisがゆめ(64)の場合はreturn true
        // 壁(1)の場合は止める

        const block = stageEntity[this.y + dy][this.x + dx];
        const selfBlock = stageEntity[this.y][this.x];
        // otherLetterと同一の場合はreturn true
        if (this.otherLetterList.includes(block.entity)) {
            moves.push([selfBlock.id, this.x, this.y, this.actor.text]);
            return true;
        }

        // 黄色(8)かつ、thisがeater(512)の場合はtrue
        if (judgeFlag(block.c, 8) && judgeFlag(this.c, 512)) {
            moves.push([block.id, block.entity.x, block.entity.y, block.entity.actor.text]);
            moves.push([selfBlock.id, this.x, this.y, this.actor.text]);
            // 黄色消去
            block.entity.x = 20;
            block.entity.otherLetterList.forEach((e) => {
                const bl = stageEntity[e.y][e.x];
                moves.push([bl.id, e.x, e.y, e.actor.text]);
                e.x = 20;
            });
            return true;
        }

        // Entity(4)かつ、thisがpusher(128)の場合は再帰判定
        if (judgeFlag(block.c, 4) && judgeFlag(this.c, 128)) {
            // 押してみる
            let f = block.entity.setMove(stageEntity, moves, dx, dy);
            block.entity.otherLetterList.forEach((entity) => {
                f &= entity.setMove(stageEntity, moves, dx, dy);
            });
            if (f) {
                if (this.hasTag("player")) {
                    moves.push(["player", this.x, this.y, this.actor.text]);
                } else {
                    moves.push([selfBlock.id, this.x, this.y, this.actor.text]);
                }
            } else {
                this.isMoving = false;
                this.dx = this.dy = 0;
            }
            return f;
        }

        // うんち(32)かつ、thisがゆめ(64)の場合はreturn true
        if (judgeFlag(block.c, 32) && judgeFlag(this.c, 64)) {
            moves.push([block.id, block.entity.x, block.entity.y, block.entity.actor.text]);
            moves.push([selfBlock.id, this.x, this.y, this.actor.text]);
            // うんち消去
            block.entity.x = 20;
            return true;
        }

        // 透過壁(1024)で、プレイヤーの場合は透過可能
        if (judgeFlag(block.c, 1024) && this.hasTag("player")) {
            moves.push(["player", this.x, this.y, this.actor.text]);
            return true;
        }

        // 壁(1)の場合は止める
        if (judgeFlag(block.c, 1)) {
            this.isMoving = false;
            this.dx = this.dy = 0;
            return false;
        }

        // 何もない場合
        if (this.hasTag("player")) {
            moves.push(["player", this.x, this.y, this.actor.text]);
        } else {
            moves.push([selfBlock.id, this.x, this.y, this.actor.text]);
        }
        return true;
    }

    adjastOtherLetter() {
        // otherLetterと同期を取る
        this.otherLetterList.forEach((entity) => {
            if (!entity.isMoving) {
                this.isMoving = false;
                this.dx = this.dy = 0;
            }
        });
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
            // ぷゆゆ変化(2048)の場合、変化
            if ((CHARA[this.c][2] & 2048) == 2048) {
                this.actor.text = "🥺";
            }
            if (Number.isInteger(this.x + this.y)) {
                this.isMoving = false;
                this.dx = 0;
                this.dy = 0;
            }
        }

        if (this.actor) {
            this.actor.x = this.x * BLOCKSIZE + (BLOCKSIZE * this.letter) / 2;
            this.actor.y = this.y * BLOCKSIZE + BLOCKSIZE / 2;
        }
    }
}

class Player extends Entity {
    constructor(c, x, y) {
        super(c, x, y);
        this.isStartMove = false;
        this.moveHistory = [];
        this.tags = ["player"];
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
            // 巻き戻し
            const z = inputManager.getKey("z");
            if (z == 1 || (z >= 20 && z % 3 == 0)) {
                const moves = this.moveHistory.pop();
                if (moves) {
                    moves.forEach((move) => {
                        const entityID = move[0];
                        const x = move[1];
                        const y = move[2];
                        const text = move[3];
                        if (entityID == "player") {
                            this.x = x;
                            this.y = y;
                        } else {
                            entityList[entityID].x = x;
                            entityList[entityID].y = y;
                            entityList[entityID].actor.text = text;
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
            stageEntity[entity.y | 0][entity.x | 0].entity = entity;
        });

        const moves = [];

        const canMove = this.setMove(stageEntity, moves, this.dx, this.dy);

        if (canMove) {
            this.moveHistory.push(moves);
            if (moves.length >= 2) {
                audio.push.play();
            }
        }
    }
}
