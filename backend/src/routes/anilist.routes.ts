import {Router, type Response, type Request} from "express";
import {Prisma, Role} from "../../generated/prisma/client.js";
import {getDataAnilist} from '../api/mediaAPI.js';
import prisma from '../../utils/prisma.js'
import {HTTP_STATUS_CODES} from "../../utils/httpStatusCodes.js";
import {authentify, requestRole} from "../middlewares/auth.js";

const routerMedia = Router();

// Register a media to the database.
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

routerMedia.patch("/:id", authentify, requestRole(Role.ADMIN), async (req: Request, res: Response) => {
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

routerMedia.get("/:id/avg-score", async (req: Request, res: Response) => {
    const mediaId = String(req.params.id);

    const result = await prisma.review.aggregate({
        where: { mediaId },
        _avg: { rating: true },
        _count: { rating: true },
    });

    res.json({
        mediaId,
        avgScore: result._avg.rating,
        reviewCount: result._count.rating,
    });
});

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
