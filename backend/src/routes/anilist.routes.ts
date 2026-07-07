import {Router, type Response, type Request} from "express";
import {Prisma} from "../../generated/prisma/client.js";
import {getDataAnilist} from '../api/mediaAPI.js';
import prisma from '../../utils/prisma.js'

export const HTTP_STATUS_CODES = {
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;

const routerMedia = Router();

// Register a media to the database.
/// TODO - Add user authentication and authorization to restrict access.
routerMedia.post("", async (req: Request, res: Response) => {
    try {
        const mediaCreateData = await getDataAnilist(req.body.value, req.body.searchField, req.body.type);

        if (!mediaCreateData) {
            return res.status(HTTP_STATUS_CODES.NOT_FOUND).json("No data found!");
        }

        const media = await prisma.media.create({data: mediaCreateData});
        res.status(HTTP_STATUS_CODES.CREATED).json(`Your media ${media.title} has been added successfully!`);

    } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({error: "Media already exists!"});
        }

        console.error(e);
        res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({error: "Error creating media"});
    }
});


routerMedia.patch("/:id", async (req: Request, res: Response) => {
    const id = String(req.params.id);

    try {
        const media = await prisma.media.update({
            where: {id},
            data: req.body,
        });
        res.json(media);
    } catch (e) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json("No data found!")
    }
})

routerMedia.get("", async (req: Request, res: Response) => {
    const data = await prisma.media.findMany({
        orderBy: {id: "asc"},
    });
    res.json(data);
})

routerMedia.delete("/:id", async (req: Request, res: Response) => {
    const id = String(req.params.id);

    try {
        const media = await prisma.media.delete({where: {id}})
        res.json({message: `media ${media.title} has been deleted!`});
    } catch (e) {
        res.status(HTTP_STATUS_CODES.NOT_FOUND).json({error: `Media ${id} not found!`});
    }
})

export default routerMedia;