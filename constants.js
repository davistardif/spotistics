const PORT = 1337;
const CLIENT_ID = process.env.SPOTISTICS_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTISTICS_SECRET;
const REDIRECT_PATH = "/callback";
const REDIRECT_URI = "http://localhost:" + PORT + REDIRECT_PATH;
const BASE_URL = "https://api.spotify.com/v1";
const CLIENT_AUTH_HEADER = {
  'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
};


module.exports = {
  PORT,
  CLIENT_ID,
  REDIRECT_PATH,
  REDIRECT_URI, 
  BASE_URL,
  CLIENT_SECRET,
  CLIENT_AUTH_HEADER
};
