const express = require('express');
const got = require('got');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const { sessions, Session } = require('./session');
const constants = require('./constants');

const app = express();
app.use(cookieParser());
app.set('view engine', 'ejs'); // render views in /views subdir with ejs

// cookie keys
const stateKey = 'spotify_auth_state';
const authKey = 'spotify_auth';

function randomString(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  const charsLen = chars.length;
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLen));
  }
  return result;
}

// lookup spotify access_token from authKey cookie, returns false if not found
function get_token(cookies) {
  if (cookies && cookies[authKey] && sessions[cookies[authKey]])
    return sessions[cookies[authKey]].access_token; // TODO: check for expired token and refresh it
  else
    return false;
}

// homepage
app.get("/", (req, res) => {
  res.render("index.ejs", { session: sessions[req.cookies[authKey]] });
});

// login to spotify
app.get('/login', (req, res) => {
  const state = randomString(20);
  res.cookie(stateKey, state)
  const scope = 'playlist-read-private user-library-read user-read-recently-played';
  res.redirect('https://accounts.spotify.com/authorize?' +
               querystring.stringify({
                 response_type: 'code',
                 client_id: constants.CLIENT_ID,
                 scope,
                 redirect_uri: constants.REDIRECT_URI,
                 state
               })
              );
});

// called by spotify upon login
app.get(constants.REDIRECT_PATH, async (req, res) => {
  if (req.query.error) {
    res.send("An error occurred: " + req.query.error)
  }
  if (req.query.state != (req.cookies ? req.cookies[stateKey] : null)) {
    res.send("State mismatch error!")
  }
  res.clearCookie(stateKey);
  const { body } = await got.post('https://accounts.spotify.com/api/token',
                                  {
                                    form: {
                                      code: req.query.code || null,
                                      redirect_uri: constants.REDIRECT_URI,
                                      grant_type: 'authorization_code'
                                    },
                                    headers: constants.CLIENT_AUTH_HEADER,
                                    responseType: 'json'
                                  });
  const authCookie = randomString(35);
  res.cookie(authKey, authCookie);
  const s = new Session(authCookie, body.access_token, body.refresh_token);
  await s.init();
  res.redirect("/"); 
});

// Logout -- clears our cookie, doesn't log user out of spotify
app.get('/logout', (req, res) => {
  delete sessions[req.cookies[authKey]];
  res.clearCookie(authKey);
  res.redirect('/');
});

// show a list of users playlists TODO: add pagination
app.get('/playlists', async (req, res) => {
  const access_token = get_token(req.cookies);
  if (!access_token) {
    res.send("Unauthorized!");
  }
  const { body } = await got(constants.BASE_URL + '/me/playlists', {
    headers: { 'Authorization': 'Bearer ' + access_token },
    responseType: 'json'
  });
  res.render('playlists', { session: sessions[req.cookies[authKey]], playlists: body });
});

// Show tracks in a given playlist
app.get('/playlist/:playlistId/tracks', async (req, res) => {
  const playlistId = req.params.playlistId;
  const access_token = get_token(req.cookies);
  if (!access_token) {
    res.send("Unauthorized!");
  }
  const tracks = []
  var nextUrl = constants.BASE_URL + '/playlists/' + playlistId + '/tracks'
  while (nextUrl) {
    const { body } = await got(nextUrl, {
      headers: { 'Authorization': 'Bearer ' + access_token },
      responseType: 'json'
    });
    let recvd_tracks = body.items.map(item => {
      item.track["added_at"] = item["added_at"];
      return item.track;
    });
    tracks.push(...recvd_tracks);
    nextUrl = body.next;
  }
  res.render("tracks", { tracks });
});

console.log("Listening on port " + constants.PORT);
app.listen(constants.PORT);
