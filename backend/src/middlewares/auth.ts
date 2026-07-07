import {type Request, type Response, type NextFunction} from "express"
import dotenv from "dotenv"
import {HTTP_STATUS_CODES} from "../../utils/httpStatusCodes.js";

dotenv.config()
import jwt from "jsonwebtoken"

export function authentify (req: Request, res: Response, next: NextFunction) {
    const headers = req.headers.authorization;
    if (!headers?.startsWith("Bearer ")) {
        return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).send({})
    }

    const token = process.env.JWT_SECRET;
    if (!token) {
        return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "JWT_SECRET is not configured" })
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!);
        (req as any).user = payload;
        next()
    } catch (e) {
        return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).send({})
    }
}

export function requestRole (role: String) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if ((req as any).user.role !== role) {
    res.status(HTTP_STATUS_CODES.FORBIDDEN).json({message: "Access denied"})
        }
        next();
    }
}