"use strict";

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
const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "z", "r", " ", "Escape"];
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
