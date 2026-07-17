import { type Request, type Response, type NextFunction } from "express";
import dotenv from "dotenv";
import { HTTP_STATUS_CODES } from "../../utils/httpStatusCodes.js";

dotenv.config();
import jwt from "jsonwebtoken";

/**
 * Validates a Bearer token from the Authorization header.
 * If valid, attaches decoded payload to req.user and forwards the request.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next middleware callback.
 * @returns 401 when token is missing/invalid, 500 when JWT secret is not configured.
 */
export function authentifier(req: Request, res: Response, next: NextFunction) {
  const headers = req.headers.authorization;
  if (!headers?.startsWith("Bearer ")) {
    return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).send({});
  }

  const token = headers.split(" ")[1];
  if (!token) {
    return res
      .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: "JWT_SECRET is not configured" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = payload;
    next();
  } catch (e) {
    return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).send({});
  }
}

/**
 * Restricts a route to a specific user role.
 *
 * @param role - Required role to access the protected route.
 * @returns An Express middleware function that checks req.user.role.
 */
export function requestRole(role: String) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).user.role !== role) {
      return res
        .status(HTTP_STATUS_CODES.FORBIDDEN)
        .json({ message: "Access denied" });
    }
    next();
  };
}
