class TimeSpan {
  value: number;

  constructor(value: number) {
    this.value = value;
  }

  static new(value: number) {
    return new TimeSpan(value);
  }

  static fromMinutes(minutes: number) {
    return TimeSpan.new(minutes * 60 * 1000);
  }

  // If the value is a whole number, return it as an integer
  // If the value has one decimal place, return it as a string with one decimal place
  // If the value has more than one decimal place, return it as a string with two decimal places
  private static toFraction(value: number) {
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

export { TimeSpan };
