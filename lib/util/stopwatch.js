const moment = require('moment');
require('moment-duration-format');

function stopwatch() {
    this.start();
}

stopwatch.prototype.start = function() {
    const now = new Date();
    this._startTime = now;
    this._splitTime = now;
}

stopwatch.prototype.split = function() {
    const now = new Date();
    const elapsed = now - this._splitTime;
    this._splitTime = now;
    return formatDuration(elapsed);
}

stopwatch.prototype.end = function() {
    const now = new Date();
    const elapsedSinceStart = now - this._startTime;
    this._startTime = NaN;
    this._splitTime = NaN;
    return formatDuration(elapsedSinceStart);
}

const formatDuration = (ms) => {
    const formatString = 'h[h] m[m] s[s]';
    return moment.duration(ms, 'ms').format(formatString);
}

module.exports = stopwatch;