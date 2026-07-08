export {
    archiveSlideAsset,
    createMediaAsset,
    createSlideAsset,
    deleteMediaAsset,
    updateMediaAsset,
} from './mutations/assets';

export {
    createWeatherPlate,
    createYouTubeSlide,
    updateWeatherPlate,
} from './mutations/plates';

export {
    archiveMusicPlaylist,
    createMusicPlaylist,
    readMusicOutputConfig,
    saveMusicOutputConfig,
    saveMusicPlaylistItems,
    updateMusicPlaylist,
} from './mutations/music-playlists';

export { createSignageScreen, updateSignageScreen } from './mutations/screens';

export {
    assignPlaylistToScreen,
    createSignagePlaylist,
    removePlaylistAssignment,
    saveSignagePlaylistItems,
    updateSignagePlaylist,
} from './mutations/content-playlists';
