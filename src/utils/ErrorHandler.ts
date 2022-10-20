import { Response } from "express";
import {
    HttpException,
    MySqlException,
    ResponseException,
} from "../exceptions";
import { logger } from "./Logger";

export const defaultErrorHandler = (res: Response, error: any) => {
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
