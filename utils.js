function randomString(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  const charsLen = chars.length;
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLen));
  }
  return result;
}

function toHMSstring(ms) {
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor(ms / 60000) % 60;
  const secs = Math.floor(ms / 1000) % 60;
  var res = "";
  if (hrs > 0) {
    res += hrs + ":";
  }
  if (hrs > 0 && mins < 10) {
    res += "0" + mins + ":"
  }
  else {
    res += mins + ":";
  }
  if (secs < 10) {
    res += "0" + secs;
  }
  else {
    res += secs;
  }
  return res;
}

module.exports = {
  toHMSstring,
  randomString
};
