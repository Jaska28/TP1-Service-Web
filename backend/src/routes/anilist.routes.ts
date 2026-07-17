import {Router, type Response, type Request} from "express";
import {MediaType, Prisma, Role} from "../../generated/prisma/client.js";
import {getDataAnilist} from "../api/mediaAPI.js";
import prisma from "../../utils/prisma.js";
import {HTTP_STATUS_CODES} from "../../utils/httpStatusCodes.js";
import {authentifier, requestRole} from "../middlewares/auth.js";

const routerMedia = Router();

// Register a media to the database.
routerMedia.post("/register", async (req: Request, res: Response) => {
    try {
        const mediaCreateData = await getDataAnilist(
            req.body.value,
            req.body.searchField,
            req.body.type,
        );

        if (!mediaCreateData) {
            return res.status(HTTP_STATUS_CODES.NOT_FOUND).json("No data found!");
        }

        const existingMedia = await prisma.media.findFirst({
            where: {
                title: mediaCreateData.title,
            },
        });

        if (existingMedia) {
            return res.status(400).json({
                error: `Media "${mediaCreateData.title}" already exists!`,
            });
        }

        const media = await prisma.media.create({data: mediaCreateData});
        res.status(HTTP_STATUS_CODES.CREATED).json({
            message: `Your media ${media.title} has been added successfully!`,
            id: media.id,
            title: media.title,
        });

    } catch (e: unknown) {
        if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2002"
        ) {
            return res
                .status(HTTP_STATUS_CODES.BAD_REQUEST)
                .json({error: "Media already exists!"});
        }
    }
});

routerMedia.patch("/:id", authentifier, requestRole(Role.ADMIN), async (req: Request, res: Response) => {
        const id = String(req.params.id);

        try {
            const media = await prisma.media.update({
                where: {id},
                data: req.body,
            });
            res.json(media);
        } catch (e) {
            return res.status(HTTP_STATUS_CODES.NOT_FOUND).json("No data found!");
        }
    },
);

// Get all media from the database.
routerMedia.get("", async (req: Request, res: Response) => {
    const requestedType = typeof req.query.type === "string" ? req.query.type.toUpperCase() : undefined;
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;

    if (requestedType && !Object.values(MediaType).includes(requestedType as MediaType)) {
        return res
            .status(HTTP_STATUS_CODES.BAD_REQUEST)
            .json({error: `type must be one of: ${Object.values(MediaType).join(", ")}.`});
    }

    const type = requestedType as MediaType | undefined;

    const data = await prisma.media.findMany({
        ...(type ? {where: {type}} : {}),
        orderBy: sort === "avgScore" ? {avgScore: "desc"} : {id: "asc"},
    });
    res.json(data);
});


routerMedia.get("/:id/avg-score", async (req: Request, res: Response) => {
    const mediaId = String(req.params.id);

    const result = await prisma.review.aggregate({
        where: {mediaId},
        _avg: {rating: true},
        _count: {rating: true},
    });

    res.json({
        mediaId,
        avgScore: result._avg.rating,
        reviewCount: result._count.rating,
    });
});

// Add a review to a media
routerMedia.post("/:id/reviews", authentifier, async (req: Request, res: Response) => {
    const mediaId = String(req.params.id);
    const userId = (req as any).user.sub;
    const rating = Number(req.body.rating);
    const comments = req.body.comments ?? req.body.comment;

    if (Number.isNaN(rating) || rating < 0 || rating > 10) {
        return res
            .status(HTTP_STATUS_CODES.BAD_REQUEST)
            .json({error: "Rating must be a number between 0 and 10."});
    }

    try {
        const media = await prisma.media.findUnique({
            where: {id: mediaId},
            select: {id: true},
        });

        if (!media) {
            return res
                .status(HTTP_STATUS_CODES.NOT_FOUND)
                .json({error: `Media ${mediaId} not found!`});
        }

        const review = await prisma.review.create({
            data: {
                userId,
                mediaId,
                rating,
                comments,
            },
        });

        res.status(HTTP_STATUS_CODES.CREATED).json(review);
    } catch (e) {
        res
            .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
            .json({error: "Error creating review"});
    }
});

// View reviews for a media
routerMedia.get("/:id/check-review", async (req: Request, res: Response) => {
    const mediaId = String(req.params.id);

    try {
        const media = await prisma.media.findUnique({
            where: {id: mediaId},
            select: {id: true, title: true},
        });

        if (!media) {
            return res
                .status(HTTP_STATUS_CODES.NOT_FOUND)
                .json({error: `Media ${mediaId} not found!`});
        }

        const reviews = await prisma.review.findMany({
            where: {mediaId},
            orderBy: {createdAt: "desc"},
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        res.json({
            media,
            reviewCount: reviews.length,
            reviews,
        });
    } catch (e) {
        res
            .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
            .json({error: "Error fetching reviews"});
    }
})

// Update your own review
routerMedia.patch("/reviews/:reviewId", authentifier, async (req: Request, res: Response) => {
    const reviewId = String(req.params.reviewId);
    const userId = (req as any).user.sub;
    const rating = req.body.rating === undefined ? undefined : Number(req.body.rating);
    const comments = req.body.comments ?? req.body.comment;

    if (rating !== undefined && (Number.isNaN(rating) || rating < 0 || rating > 10)) {
        return res
            .status(HTTP_STATUS_CODES.BAD_REQUEST)
            .json({error: "Rating must be a number between 0 and 10."});
    }

    if (rating === undefined && comments === undefined) {
        return res
            .status(HTTP_STATUS_CODES.BAD_REQUEST)
            .json({error: "At least rating or comments is required."});
    }

    try {
        const review = await prisma.review.findUnique({
            where: {id: reviewId},
        });

        if (!review) {
            return res
                .status(HTTP_STATUS_CODES.NOT_FOUND)
                .json({error: `Review ${reviewId} not found!`});
        }

        if (review.userId !== userId) {
            return res
                .status(HTTP_STATUS_CODES.FORBIDDEN)
                .json({error: "You can only update your own review."});
        }

        const data: Prisma.ReviewUpdateInput = {};

        if (rating !== undefined) {
            data.rating = rating;
        }

        if (comments !== undefined) {
            data.comments = comments;
        }

        const updatedReview = await prisma.review.update({
            where: {id: reviewId},
            data,
        });

        res.json(updatedReview);
    } catch (e) {
        res
            .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
            .json({error: "Error updating review"});
    }
});

// Delete own review, or any review as ADMIN
routerMedia.delete("/reviews/:reviewId", authentifier, async (req: Request, res: Response) => {
    const reviewId = String(req.params.reviewId);
    const userId = (req as any).user.sub;
    const role = (req as any).user.role;

    try {
        const review = await prisma.review.findUnique({
            where: {id: reviewId},
        });

        if (!review) {
            return res
                .status(HTTP_STATUS_CODES.NOT_FOUND)
                .json({error: `Review ${reviewId} not found!`});
        }

        if (review.userId !== userId && role !== Role.ADMIN) {
            return res
                .status(HTTP_STATUS_CODES.FORBIDDEN)
                .json({error: "You can only delete your own review."});
        }

        const deletedReview = await prisma.review.delete({
            where: {id: reviewId},
        });

        res.json({message: "Review deleted successfully.", review: deletedReview});
    } catch (e) {
        res
            .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
            .json({error: "Error deleting review"});
    }
});

routerMedia.post("/media-lists", authentifier, async (req: Request, res: Response) => {
    const userId = (req as any).user.sub;
    const {name, description, isPublic} = req.body;

    if (typeof name !== "string" || name.trim() === "") {
        return res
            .status(HTTP_STATUS_CODES.BAD_REQUEST)
            .json({error: "Media list name is required."});
    }

    try {
        const mediaList = await prisma.mediaList.create({
            data: {
                userId,
                name,
                description,
                isPublic,
            },
        });

        res.status(HTTP_STATUS_CODES.CREATED).json(mediaList);
    } catch (e) {
        res
            .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
            .json({error: "Error creating media list"});
    }
});

routerMedia.post("/media-lists/:id/items", authentifier, async (req: Request, res: Response) => {
    const mediaListId = req.params.id;
    const mediaId = req.body.mediaId;

    if (typeof mediaListId !== "string" || typeof mediaId !== "string") {
        return res.status(400).json({error: "mediaListId and mediaId are required."});
    }

    const item = await prisma.mediaListItem.create({
        data: {
            mediaListId,
            mediaId,
        },
    });
    res.status(201).json(item);
});

// Get a media list by ID
routerMedia.get("/media-lists/:id", async (req: Request, res: Response) => {
    const mediaListId = String(req.params.id);

    try {
        const mediaList = await prisma.mediaList.findUnique({
            where: {id: mediaListId},
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                mediaListItems: {
                    orderBy: {addedAt: "desc"},
                    include: {
                        media: true,
                    },
                },
            },
        });

        if (!mediaList) {
            return res
                .status(HTTP_STATUS_CODES.NOT_FOUND)
                .json({error: `Media list ${mediaListId} not found!`});
        }

        res.json(mediaList);
    } catch (e) {
        res
            .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
            .json({error: "Error fetching media list"});
    }
});

routerMedia.delete("/:id/delete", authentifier, requestRole(Role.ADMIN), async (req: Request, res: Response) => {
    const id = String(req.params.id);

    try {
        const media = await prisma.media.delete({where: {id}});
        res.json({message: `media ${media.title} has been deleted!`});
    } catch (e) {
        res
            .status(HTTP_STATUS_CODES.NOT_FOUND)
            .json({error: `Media ${id} not found!`});
    }
})
export default routerMedia;
