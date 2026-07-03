import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const anilist = axios.create({
    baseURL: process.env.ANIME_API || "https://graphql.anilist.co",
    timeout: 10000,
})