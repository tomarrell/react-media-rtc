const mediaDevices = navigator.mediaDevices;

/**
 * Get device's media depending on parameters.
 *
 * @param {{ video, audio }} config
 */
function getMedia(config) {
  return mediaDevices.getUserMedia(config);
}

/**
 * Stops all currently running media.
 *
 * @param {MediaStream} stream
 */
function stopAllMedia(stream) {
  return stream
    .getTracks()
    .forEach((track) => {
      track.stop();
    });
}

module.exports = {
  getMedia,
  stopAllMedia,
};
