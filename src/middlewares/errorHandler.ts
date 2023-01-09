import { NextFunction, Request, Response } from "express";
import {
    Exception,
    HttpException,
    MySqlException,
    ResponseException,
} from "../exceptions";
import { logger } from "../utils/Logger";

const errorHandler = (
    error: Exception,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof ResponseException) {
        res.status(200).json({
            status: error.status,
            message: error.message,
        });
        return;
    } else if (error instanceof HttpException) {
        res.sendStatus(error.status);
        return;
    } else if (error instanceof MySqlException) {
        res.sendStatus(500);
    } else {
        throw error;
    }
    logger.error(error);
};

export default errorHandler;
