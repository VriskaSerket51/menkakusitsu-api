import { Request, Response } from "express";
import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import V1 from "..";
import { execute, query } from "../../../mysql";
import { ResponseException, HttpException } from "../../../exceptions";
import { defaultErrorHandler } from "../../../utils/ErrorHandler";
import {
    escapeUserName,
    getJwtPayload,
    getStudentInfo,
    getTeacherInfo,
    getUserInfo,
} from "../../../utils/Utility";
import fs from "fs";
import path from "path";
import fetch, { Response as FetchResponse } from "node-fetch";
import dayjs from "dayjs";
import { parse } from "node-html-parser";

class Meal extends V1 {
    constructor() {
        super();
        this.setPath("/meal");
        this.models = [
            {
                method: "get",
                path: "/now",
                // authType: "access",
                controller: Meal.onGetMeal,
            },
        ];
    }

    static async onGetMeal(req: Request, res: Response) {
        try {
            const getMealRequest: v1.GetMealRequest = req.params as any;
            // if (!getMealRequest.when) {
                // throw new HttpException(400);
            // }

            const today = dayjs(getMealRequest.when);
            const tomorrow = today.add(1, "day");

            const todayMeal = await query(
                "SELECT lunch, dinner FROM meal WHERE `when`=?",
                [today.format("YYYY-MM-DD")]
            );
            if (!today || todayMeal.length == 0) {
                throw new HttpException(500);
            }
            const tomorrowMeal = await query(
                "SELECT breakfast FROM meal WHERE `when`=?",
                [tomorrow.format("YYYY-MM-DD")]
            );
            if (!tomorrowMeal || tomorrowMeal.length == 0) {
                throw new HttpException(500);
            }

            const breakfast: v1.MealInfo = {
                meals: (tomorrowMeal[0].breakfast as string).split(","),
            };
            const lunch = await {
                meals: (todayMeal[0].lunch as string).split(","),
            };
            const dinner = await {
                meals: (todayMeal[0].dinner as string).split(","),
            };

            const getMealResponse: v1.GetMealResponse = {
                status: 0,
                message: "",
                lunch: lunch,
                dinner: dinner,
                breakfast: breakfast,
            };
            res.status(200).json(getMealResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPutTimetable(req: Request, res: Response) {
        try {
            const putTimetableRequest: v1.PutTimetableRequest = req.body;
            putTimetableRequest.when = req.params.when;
            if (
                !putTimetableRequest.when ||
                !putTimetableRequest.timetableInfo
            ) {
                throw new HttpException(400);
            }

            for (const timetableCell of putTimetableRequest.timetableInfo) {
                if (!timetableCell.key) {
                    continue;
                }
                await execute(
                    "UPDATE timetable SET `value`=? WHERE `when`=? AND `key`=?",
                    [
                        timetableCell.value,
                        putTimetableRequest.when,
                        timetableCell.key,
                    ]
                );
            }

            const putTimetableResponse: v1.PutTimetableResponse = {
                status: 0,
                message: "",
                timetable: {
                    timetableInfo: [],
                },
            };
            res.status(200).json(putTimetableResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }
}

export default Meal;
