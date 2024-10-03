"use strict";

const clamp = (num, min, max) => Math.max(min, Math.min(num, max));

const lerp = (start, end, t) => start + (end - start) * t;

const easeLinear = (start, end, time, duration) => {
    const x = clamp(time, 0, duration) / duration;
    const t = x;
    return lerp(start, end, t);
};

const easeOutExpo = (start, end, time, duration) => {
    const x = clamp(time, 0, duration) / duration;
    const t = x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    return lerp(start, end, t);
};
