import {type Request, type Response, type NextFunction} from "express"
import dotenv from "dotenv"
import HTTP_STATUS_CODES from "../routes/anilist.routes.js"

dotenv.config()
import jwt from "jsonwebtoken"

export function authentify (req: Request, res: Response, next: NextFunction) {
    const headers = req.headers.authorization;
    if (!headers?.startsWith("Bearer ")) {
        return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).send({})
    }
}