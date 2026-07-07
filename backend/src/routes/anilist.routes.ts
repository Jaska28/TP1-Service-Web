import {Router, type Response, type Request} from "express";
import {AxiosError} from 'axios';
import {Prisma} from "../../generated/prisma/client.js";
import {getDataAnilist, MediaType} from '../api/mediaAPI.js';
import prisma from '../../utils/prisma.js'

export const HTTP_STATUS_CODES = {
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;

const routerMedia = Router();

async function runDemo() {
    try {
        const anime = await getDataAnilist("dragon ball", "search", MediaType.MANGA);
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

// Register a media to the database.
/// TODO - Add user authentication and authorization to restrict access.
routerMedia.post("", async (req: Request, res: Response) => {
    const data = await getDataAnilist(req.body.value, req.body.searchField, req.body.type);

    if (!data) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json("No data found!");
    }

    try {
        const media = await prisma.media.create({data: data});
        res.status(HTTP_STATUS_CODES.CREATED).json(`Your media ${media.name} has been added successfully!`);
    } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({error: "Media already exists!"});
        }

        console.error(e);
        res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({error: "Error creating media"});
    }
});


routerMedia.patch("", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const media = await prisma.media.update({
      where: {id},
      data: req.body,
    });
  } catch (e) {
    return res.status(HTTP_STATUS_CODES.NOT_FOUND).json("No data found!")
  }
})

routerMedia.get("", async (req: Request, res: Response) => {
    const data = await prisma.media.findMany({
        orderBy: "id",
    });
    res.json(data);
})


export default routerMedia;