import {AxiosError} from 'axios';
import {getDataAnilist, MediaType} from '../api/animeAPI.js';

async function runDemo() {
  try {
    const anime = await getDataAnilist("Dragon Ball","search",MediaType.ANIME);
    console.log(anime);
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('AniList request failed:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

void runDemo();
