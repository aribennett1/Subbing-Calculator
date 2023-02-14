class Time {
  constructor(timeStr) {
  this.timeStr = timeStr;
  this.setHours();
  this.setMinutes();
  this.setTime();
  this.setFormTime();
  }

  toString() {
  return `${this.timeStr.substring(0, this.timeStr.lastIndexOf(":"))} ${this.timeStr.substring(this.timeStr.indexOf(" ") + 1)}`;
  }
  setHours() {
  var hr = parseInt(this.timeStr.substring(0, this.timeStr.indexOf(":")));
  var amPm = this.timeStr.substring(this.timeStr.indexOf(" ") + 1);
  if (amPm == "AM" && hr == 12) {hr = "00";}
  if (amPm == "PM") {hr = (12 + (hr % 12));}
    this.hr = hr;
  }
  setMinutes() {
    var min = this.timeStr.substring(this.timeStr.indexOf(":") + 1);
    this.min = parseInt(min.substring(0, min.indexOf(":")));
  }
  setTime() {
  this.time = (this.getHours() * 60) + this.getMinutes();
  }
  setFormTime() {
    this.formTime = `${Time.addLeadingZeroIfNone(this.getHours())}:${Time.addLeadingZeroIfNone(this.getMinutes())}`;
  }
  getHours() {
    return this.hr;
  }
  getMinutes() {
    return this.min;
  }
  getTime() {
  return this.time;
  }
  getFormTime() {
    return this.formTime;
  }
  static addLeadingZeroIfNone(num) {
  if (num.toString().length == 1) {
    num = "0" + num;
  }
  return num;
}
}
