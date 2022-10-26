import scheduler from "node-schedule";
import { execute, query } from "../mysql";
import { logger } from "../utils/Logger";
import fetch, { Response as FetchResponse } from "node-fetch";
import dayjs from "dayjs";
import { parse } from "node-html-parser";

interface Schedule {
    name: string;
    cron: string;
    job: () => void;
}

const schedules: Schedule[] = [
    {
        name: "mealUpdate",
        cron: "00 00 00 * * *",
        job: async () => {
            await execute("DELETE FROM meal", []);

            const today = dayjs();
            const tomorrow = today.add(1, "day");

            const parseHtml = async (resp: FetchResponse) => {
                const data = await resp.text();
                const html = parse(data);
                const dd = html
                    .querySelector(".ulType_food")!
                    .querySelectorAll("li")[1]
                    .querySelector("dd")!;
                const meals: string[] = dd.innerHTML.split("<br>");
                return meals;
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

            await execute(
                "INSERT INTO meal(`when`, breakfast, lunch, dinner) VALUES(?, NULL, ?, ?), (?, ?, NULL, NULL)",
                [
                    today.format("YYYY-MM-DD"),
                    lunch.join(","),
                    dinner.join(","),
                    tomorrow.format("YYYY-MM-DD"),
                    breakfast.join(","),
                ]
            );
        },
    },
];

export const initializeScheduler = () => {
    schedules.forEach((schedule) => {
        scheduler.scheduleJob(schedule.cron, (fireDate) => {
            const now = new Date();
            if (fireDate.setHours(0,0,0,0) !== now.setHours(0,0,0,0)) {
                logger.info(
                    `${schedule.name} was supposed to run at ${fireDate}, but actually ran at ${now}`
                );
            }
            schedule.job();
        });
        schedule.job();
    });
};
