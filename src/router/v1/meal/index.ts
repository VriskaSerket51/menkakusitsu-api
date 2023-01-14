import { Request, Response } from "express";
import { v1 } from "@common-jshs/menkakusitsu-lib";
import V1 from "..";
import { query } from "../../../mysql";
import { HttpException } from "../../../exceptions";
import dayjs from "dayjs";

class Meal extends V1 {
    constructor() {
        super();
        this.setPath("/meal");
        this.models = [
            {
                method: "get",
                path: "/now",
                // authType: "access",
                controller: this.onGetMeal,
            },
        ];
    }

    async onGetMeal(req: Request, res: Response) {
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
        const lunch: v1.MealInfo = {
            meals: (todayMeal[0].lunch as string).split(","),
        };
        const dinner: v1.MealInfo = {
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
    }
}

export default Meal;
