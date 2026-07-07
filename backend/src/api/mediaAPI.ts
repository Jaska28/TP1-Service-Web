import axios from 'axios';
import dotenv from 'dotenv';
import type {MediaFormat, Prisma} from "../../generated/prisma/client.js";


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

export type MediaAPI = {
    id: number;
    title: string;
    format: MediaFormat;
    description: string;
    coverImage: string;
    genres: string[];
    averageScore: number;
    releaseYear: number;
};

/**
 * Generates a GraphQL query string for fetching media data from AniList.
 * @param searchField - The field to search by ('id' or 'search').
 * @param searchFieldType - The GraphQL type of the search field ('Int' or 'String').
 * @param mediaType - The media type, either MediaType. ANIME or MediaType.MANGA.
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

// Can't use a return of MediaPrisma. It would need the id and all the attributes.
function mediaAnilistToPrisma(media: MediaAPI): Prisma.MediaCreateInput | null {

    if (!media) return null;

    return {
        malId: media.id,
        title: media.title,
        format: media.format,
        description: media.description,
        bannerImgURL: media.coverImage,
        // If is an array, assign the genre from API, else empty array
        genre: Array.isArray(media.genres) ? media.genres : [],
        malAvgScore: media.averageScore,
        releaseYear: media.releaseYear
    }
}

/**
 * Retreives an Anime or Manga from AniList API by ID or search term.
 * @param value - The ID (number) or search (string) to query.
 * @param searchField - Whether to search by 'id' or 'search' (default: 'id').
 * @param type - The media type, either MediaType. ANIME or MediaType.MANGA.
 * @returns A Promise resolving to the Media object.
 */
// GraphQL requests use POST with { query, variables }.
export async function getDataAnilist(
    /// TODO - add a way to have a list of searched name. Exemple, there is multiple Dragon Ball series. Will be used so user select witch one with front end.
    value: number | string,
    searchField: 'id' | 'search' = 'id',
    type: MediaType,
) : Promise<Prisma.MediaCreateInput | null> {
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
        return mediaAnilistToPrisma(media);

    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.log("Status HTTP: ", error.response.status);
        } else {
            console.log("Network Error or timeout");
        }
        return null;
    }
}