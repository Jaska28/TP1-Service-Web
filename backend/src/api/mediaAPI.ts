import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const anilist = axios.create({
    baseURL: process.env.ANIME_API || 'https://graphql.anilist.co',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

export enum MediaType {
    ANIME = 'ANIME',
    MANGA = 'MANGA',
}

export enum MediaFormat {
    TV = 'TV',
    TV_SHORT = 'TV_SHORT',
    MOVIE = 'MOVIE',
    SPECIAL = 'SPECIAL',
    OVA = 'OVA',
    ONA = 'ONA',
    MUSIC = 'MUSIC',
    MANGA = 'MANGA',
    NOVEL = 'NOVEL',
    ONE_SHOT = 'ONE_SHOT',
}

export type Media = {
    id: number;
    title: { english: string | null; };
    format: MediaFormat | null;
    description: string;
    coverImage: string;
    genres: string[];
    averageScore: number;
};

/**
 * Generates a GraphQL query string for fetching media data from AniList.
 * @param searchField - The field to search by ('id' or 'search').
 * @param searchFieldType - The GraphQL type of the search field ('Int' or 'String').
 * @param mediaType - The media type, either MediaType.ANIME or MediaType.MANGA.
 * @returns A GraphQL query string.
 */
function getMediaQuery(
    searchField: string,
    searchFieldType: string,
    mediaType: MediaType): string {

    return `query ($${searchField}: ${searchFieldType}) {
        Media(${searchField}: $${searchField}, type: ${mediaType}) {
        id
        title {english}
        format
        description
        coverImage{large}
        status
        genres
        averageScore
       }
    }`;
}

/**
 * Retreives a Anime or Manga from AniList API by ID or search term.
 * @param value - The ID (number) or search (string) to query.
 * @param searchField - Whether to search by 'id' or 'search' (default: 'id').
 * @param type - The media type, either MediaType.ANIME or MediaType.MANGA.
 * @returns A Promise resolving to the Media object.
 */
// GraphQL requests use POST with { query, variables }.
export async function getDataAnilist(
    /// TODO - add a way to have a list of searched name. Exemple, there is multiple Dragon Ball series. Will be used so user select witch one with front end.
    value: number | string,
    searchField: 'id' | 'search' = 'id',
    type: MediaType,
) : Promise<Media | null> {
    try {
        const {data} = await anilist.post('', {
            query: getMediaQuery(
                searchField,
                searchField === 'id' ? 'Int' : 'String',
                type
            ),
            variables: {[searchField]: value},
        });

        const media = data.data.Media;
        return {
            id: media.id,
            title: {english: media.title.english},
            format: media.format ?? null,
            description: media.description ?? "",
            coverImage: media.coverImage?.large ?? "",
            // If is an array, assign the genre from API, else empty array
            genres: Array.isArray(media.genres) ? media.genres : [],
            averageScore: media.averageScore,
        }

    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Status HTTP: ", error.response.status);
        } else {
            console.log("Network Error or timeout");
        }
        return null;
    }
}