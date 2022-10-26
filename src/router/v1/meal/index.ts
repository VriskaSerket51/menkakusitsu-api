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
                path: "/:when",
                // authType: "access",
                controller: Meal.onGetMeal,
            },
        ];
    }

    static async onGetMeal(req: Request, res: Response) {
        try {
            const getMealRequest: v1.GetMealRequest = req.params as any;
            if (!getMealRequest.when) {
                throw new HttpException(400);
            }

            const today = dayjs(getMealRequest.when);
            const tomorrow = today.add(1, "day");

            const parseHtml = async (resp: FetchResponse) => {
                const data = await resp.text();
                const html = parse(data);
                const dd = html
                    .querySelector(".ulType_food")!
                    .querySelectorAll("li")[1]
                    .querySelector("dd")!;
                const meals: string[] = dd.innerHTML.split("<br>");
                const result: v1.MealInfo = {
                    meals: meals,
                };
                return result;
            };

            const breakfast = await parseHtml(
                await fetch(
                    `http://jeju-s.jje.hs.kr/jeju-s/food/${tomorrow.year()}/${
                        tomorrow.month() + 1
                    }/${tomorrow.date()}/breakfast`
                )
            );
            const lunch = await parseHtml(
                await fetch(
                    `http://jeju-s.jje.hs.kr/jeju-s/food/${today.year()}/${
                        today.month() + 1
                    }/${today.date()}/lunch`
                )
            );
            const dinner = await parseHtml(
                await fetch(
                    `http://jeju-s.jje.hs.kr/jeju-s/food/${today.year()}/${
                        today.month() + 1
                    }/${today.date()}/dinner`
                )
            );

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
