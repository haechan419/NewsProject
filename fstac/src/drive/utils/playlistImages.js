import interestImage from '../images/playlists/interest.png';
import latestImage from '../images/playlists/latest.png';
import economyImage from '../images/playlists/economy.png';
import politicsSocietyImage from '../images/playlists/politics_society.png';
import itImage from '../images/playlists/it.png';
import hotImage from '../images/playlists/hot.png';
import defaultImage from '../images/playlists/default.png';

export const PLAYLIST_IMAGES = {
  interest: interestImage,
  latest: latestImage,
  economy: economyImage,
  politics_society: politicsSocietyImage,
  it: itImage,
  hot: hotImage,
  default: defaultImage,
};

/**
 * @param {string} playlistId
 * @returns {string}
 */
export function getPlaylistImage(playlistId) {
  return PLAYLIST_IMAGES[playlistId] || PLAYLIST_IMAGES.default;
}
