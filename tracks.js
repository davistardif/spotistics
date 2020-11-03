const querystring = require('querystring');
const got = require('got');
const constants = require('./constants');
const utils = require('./utils');

async function getPlaylistTracks(playlistId, accessToken, numTracks) {
  const tracks = [];
  var reqUrl = constants.BASE_URL + '/playlists/' + playlistId + '/tracks';
  const promises = [];
  const batchSize = 100;
  for (let offset = 0; offset < numTracks; offset += batchSize) {
    const promise = got(reqUrl + "?" + querystring.stringify({
      limit: batchSize,
      offset
    }), {
      headers: { 'Authorization': 'Bearer ' + accessToken },
      responseType: 'json'
    }).then(({ body }) => {
      let recvd_tracks = body.items.map(item => {
        item.track["added_at"] = item["added_at"];
        item.track["release_date"] = item.track.album["release_date"];
        item.track.album = item.track.album.name;
      item.track.artists = item.track.artists.map(obj => obj.name).join(", ");
        item.track.duration = utils.toHMSstring(item.track["duration_ms"]);
        return item.track;
      });
      tracks.push(...recvd_tracks);
    });
    promises.push(promise);
  }
  await Promise.all(promises)
  return tracks;
}

module.exports = {
  getPlaylistTracks
};
