const constants = require('./constants');
const got = require('got');

// stores cookie -> Session objects
const sessions = {};

class Session {

  
  constructor(cookie, access_token = null, refresh_token = null) {
      this.access_token = access_token;
      this.refresh_token = refresh_token;
      if (sessions[cookie]) {
        throw Error("Duplicate session cookie!");
      }
      sessions[cookie] = this;
  }

  async init() {
    const { body } = await got(constants.BASE_URL + "/me/", {
      headers: { 'Authorization': 'Bearer ' + this.access_token },
      responseType: 'json'
    });
    this.name = body.display_name;
    this.image = body.images[0].url;
  }
  
  async refreshAccessToken() {
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        grant_type: 'refresh_token',
        refresh_token: this.refresh_token
      },
      headers: constants.CLIENT_AUTH_HEADER,
      responseType: 'json'
    };
    const { body } = await got.post(authOptions);
    this.access_token = body.access_token;
  }
};
               
module.exports = {
  sessions,
  Session
};
            

  
  
