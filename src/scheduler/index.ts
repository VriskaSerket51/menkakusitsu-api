import scheduler from "node-schedule";
import { execute, query } from "../mysql";
import { logger } from "../utils/Logger";
import fetch, { Response as FetchResponse } from "node-fetch";
import dayjs from "dayjs";
import { parse } from "node-html-parser";
import fs from "fs";
import path from "path";
import { readAllFiles } from "../utils/Utility";
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
    {
        name: "flushTempFolder",
        cron: "00 30 04 * * *",
        job: async () => {
            const tempFiles: string[] = [];
            readAllFiles(path.join(__dirname, "..", "..", "tmp"), tempFiles);
            for (const tempFile of tempFiles) {
                fs.unlinkSync(tempFile);
            }
        },
    },
    {
        name: "flushSpecialroom",
        cron: "00 00 00 * * *",
        job: async () => {
            try {
                const now = dayjs().format("YYYY-MM-DD");
                const getSpecialroomsQuery = await query(
                    "SELECT * FROM (SELECT apply_ID, GROUP_CONCAT(name) FROM (SELECT specialroom_apply_student.apply_ID, user.name FROM specialroom_apply_student, user WHERE specialroom_apply_student.student_UID = user.UID) AS A GROUP BY A.apply_ID) AS B, specialroom_apply WHERE B.apply_ID = specialroom_apply.apply_ID",
                    []
                );
                for (const specialroom of getSpecialroomsQuery) {
                    await query(
                        "INSERT INTO specialroom_cache (apply_ID, teacher_UID, location, purpose, students, created_date) VALUES (?, ?, ?, ?, ?, ?)",
                        [
                            specialroom.apply_ID,
                            specialroom.teacher_UID,
                            specialroom.location,
                            specialroom.purpose,
                            specialroom.students,
                            now,
                        ]
                    );
                }
                await query("UPDATE today SET now_date=?", [now]);
                await query("DELETE FROM specialroom_apply", []);
                await query(
                    "ALTER TABLE specialroom_apply AUTO_INCREMENT = 1",
                    []
                );
                await query(
                    "ALTER TABLE specialroom_apply_student AUTO_INCREMENT = 1",
                    []
                );
            } catch (err) {
                logger.error(err);
            }
        },
    },
];

export const initializeScheduler = () => {
    schedules.forEach((schedule) => {
        scheduler.scheduleJob(schedule.cron, (fireDate) => {
            const now = new Date();
            if (fireDate.setHours(0, 0, 0, 0) !== now.setHours(0, 0, 0, 0)) {
                logger.info(
                    `${schedule.name} was supposed to run at ${fireDate}, but actually ran at ${now}`
                );
            }
            schedule.job();
        });
        schedule.job();
    });
};
