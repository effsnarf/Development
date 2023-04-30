"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSpan = void 0;
class TimeSpan {
    constructor(value) {
        this.value = value;
    }
    static new(value) {
        return new TimeSpan(value);
    }
    static fromMinutes(minutes) {
        return TimeSpan.new(minutes * 60 * 1000);
    }
    static toFraction(value) {
        if (value % 1 === 0) return value.toFixed(0);
        if ((value * 10) % 1 === 0) return value.toFixed(1);
        return value.toFixed(2);
    }
    toString() {
        const seconds = this.value / 1000;
        const minutes = seconds / 60;
        const hours = minutes / 60;
        const days = hours / 24;
        const weeks = days / 7;
        const months = days / 30;
        const years = days / 365;
        if (years >= 1)
            return `${TimeSpan.toFraction(years)} year${years >= 2 ? "s" : ""}`;
        if (months >= 1)
            return `${TimeSpan.toFraction(months)} month${months >= 2 ? "s" : ""}`;
        if (weeks >= 1)
            return `${TimeSpan.toFraction(weeks)} week${weeks >= 2 ? "s" : ""}`;
        if (days >= 1)
            return `${TimeSpan.toFraction(days)} day${days >= 2 ? "s" : ""}`;
        if (hours >= 1)
            return `${TimeSpan.toFraction(hours)} hour${hours >= 2 ? "s" : ""}`;
        if (minutes >= 1)
            return `${TimeSpan.toFraction(minutes)} minute${minutes >= 2 ? "s" : ""}`;
        if (seconds >= 1)
            return `${TimeSpan.toFraction(seconds)} second${seconds >= 2 ? "s" : ""}`;
        return `${this.value} ms`;
    }
    toLocaleString() {
        return this.toString();
    }
}
exports.TimeSpan = TimeSpan;
