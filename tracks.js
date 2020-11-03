const querystring = require('querystring');
const got = require('got');
const constants = require('./constants');
const utils = require('./utils');

async function getPlaylistTracks(playlistId, accessToken, numTracks, getAudioFeatures = false) {
  /*
    Get all tracks in a playlist by its id
    accessToken should be a valid api token
    numTracks is needed to send all the api requests concurrently
    if getAudioFeatures is set to true, additional fields will be returned

    Returns an array of track objects
  */
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
    }).then(({ body }) =>
            // reformat track fields to be a bit nicer
            body.items.map(item => {
              item.track["added_at"] = item["added_at"];
              item.track["release_date"] = item.track.album["release_date"];
              item.track.album = item.track.album.name;
              item.track.artists = item.track.artists.map(obj => obj.name).join(", ");
              item.track.duration = utils.toHMSstring(item.track["duration_ms"]);
              return item.track;
            }))
          .then(recvdTracks => {
            if (getAudioFeatures) {
              // send an additional request for audio features by track id
              // note response is in same order as request
              const ids = recvdTracks.map(item => item.id).join(",");
              return got(constants.BASE_URL + "/audio-features?ids=" + ids, {
                headers: { 'Authorization': 'Bearer ' + accessToken },
                responseType: 'json'
              }).then(({ body: audioFeats }) => { 
                const feats = audioFeats.audio_features.map(item => {
                  // prune some useless/duplicate fields
                  delete item.type;
                  delete item.id;
                  delete item.uri;
                  delete item.track_href;
                  delete item.analysis_url;
                  delete item.duration_ms;
                  return item
                })
                // add extra fields to track objects
                for (let i = 0; i < recvdTracks.length; i++) {
                  Object.assign(recvdTracks[i], feats[i]);
                }
                return recvdTracks;
              })
            }
            else {
              // caller doesn't want audio features, just pass through
              return recvdTracks;
            }
          }).then(recvdTracks => {
            tracks.push(...recvdTracks);
          });
    promises.push(promise);
  }
  await Promise.all(promises)
  return tracks;
}

module.exports = {
  getPlaylistTracks
};
