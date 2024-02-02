import CommonApi from "@ireves/common-api";
import { v1 } from "@common-jshs/menkakusitsu-lib";
import { Request, Response } from "express";
import dayjs from "dayjs";

import V1 from ".";
import { Sanitizer } from "../../utils";

class Meal extends V1 {
  constructor() {
    super();
    this.setPath("/meal");
    this.models = [
      {
        method: "get",
        path: "/now",
        controller: this.onGetMeal,
      },
    ];
  }

  async onGetMeal(req: Request, res: Response) {
    const request: v1.GetMealRequest = req.params as any;

    if (!Sanitizer.sanitizeRequest(request, "GetMealRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const today = dayjs(request.when);
    const tomorrow = today.add(1, "day");

    const todayMeal = await CommonApi.getFirstAsync(
      "SELECT lunch, dinner FROM meal WHERE `when`=?",
      [today.format("YYYY-MM-DD")]
    );
    if (!todayMeal) {
      throw new CommonApi.HttpException(500);
    }
    const tomorrowMeal = await CommonApi.getFirstAsync(
      "SELECT breakfast FROM meal WHERE `when`=?",
      [tomorrow.format("YYYY-MM-DD")]
    );
    if (!tomorrowMeal) {
      throw new CommonApi.HttpException(500);
    }

    const breakfast: v1.MealInfo = {
      meals: (tomorrowMeal.breakfast as string).split(","),
    };
    const lunch: v1.MealInfo = {
      meals: (todayMeal.lunch as string).split(","),
    };
    const dinner: v1.MealInfo = {
      meals: (todayMeal.dinner as string).split(","),
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
