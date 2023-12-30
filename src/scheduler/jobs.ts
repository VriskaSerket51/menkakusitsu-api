import fetch, { Response as FetchResponse } from "node-fetch";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import { execute, logger, query, readAllFiles } from "common-api-ts";
import { JSDOM } from "jsdom";
import { URLSearchParams } from "url";

export const mealUpdate = async () => {
    await execute("DELETE FROM meal", []);

    const today = dayjs();
    const tomorrow = today.add(1, "day");

    const parseHtml = async (resp: FetchResponse) => {
        const data = await resp.text();
        const dom = new JSDOM(data);
        const dd = dom.window.document
            .querySelector(".ulType_food")!
            .querySelectorAll("li")[1]
            .querySelector("dd")!;
        const meals: string[] = dd.innerHTML.split("<br>");
        // .map((meal) => meal.split(" ")[0]);
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
};

export const flushTempFolder = async () => {
    const tempFiles: string[] = [];
    readAllFiles(path.join(__dirname, "..", "..", "tmp"), tempFiles);
    for (const tempFile of tempFiles) {
        fs.unlinkSync(tempFile);
    }
};

export const flushSpecialroom = async () => {
    try {
        const now = dayjs().format("YYYY-MM-DD");
        const getSpecialroomsQuery = await query(
            "SELECT * FROM (SELECT applyId, GROUP_CONCAT(name) FROM (SELECT specialroom_apply_student.applyId, user.name FROM specialroom_apply_student, user WHERE specialroom_apply_student.studentUid = user.uid) AS A GROUP BY A.applyId) AS B, specialroom_apply WHERE B.applyId = specialroom_apply.applyId",
            []
        );
        for (const specialroom of getSpecialroomsQuery) {
            await query(
                "INSERT INTO specialroom_cache (applyId, teacherUid, location, purpose, students, createdDate) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    specialroom.applyId,
                    specialroom.teacherUid,
                    specialroom.location,
                    specialroom.purpose,
                    specialroom.students,
                    now,
                ]
            );
        }
        await query("DELETE FROM specialroom_apply", []);
        await query("ALTER TABLE specialroom_apply AUTO_INCREMENT = 1", []);
        await query(
            "ALTER TABLE specialroom_apply_student AUTO_INCREMENT = 1",
            []
        );
    } catch (err) {
        logger.error(err);
    }
};

export const flushDeletedBbsContent = async () => {
    await execute(
        "DELETE FROM bbs_post WHERE deletedDate >= NOW() - INTERVAL 3 MONTH",
        []
    );
    await execute(
        "DELETE FROM bbs_comment WHERE deletedDate >= NOW() - INTERVAL 3 MONTH",
        []
    );
    await execute(
        "DELETE FROM bbs_file WHERE deletedDate >= NOW() - INTERVAL 3 MONTH",
        []
    );
};

const getMeal = async (day: dayjs.Dayjs) => {
    const resp = await fetch(
        "https://school.jje.go.kr/jeju-s/ad/fm/foodmenu/selectFoodMenuView.do",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                schDt: `${day.format("YYYY-MM-DD")}`,
            }),
        }
    );

    const text = await resp.text();

    const dom = new JSDOM(text);
    const table = dom.window.document.querySelector("table");

    if (!table) {
        return null;
    }

    return table.querySelectorAll("tbody tr");
};

const pickMeal = (tr: Element, day: number, meal: string[]) => {
    for (const p of tr.querySelectorAll("td").item(day).querySelectorAll("p")) {
        if (p.className == "") {
            p.innerHTML.split("<br>").forEach((data) => meal.push(data));
        }
    }
};

export const newMeal = async () => {
    await execute("DELETE FROM meal", []);
    const today = dayjs();
    const tomorrow = today.add(1, "day");

    const todayMeal = await getMeal(today);
    const tomorrowMeal = await getMeal(tomorrow);

    const breakfast: string[] = [];
    const lunch: string[] = [];
    const dinner: string[] = [];

    if (todayMeal) {
        pickMeal(todayMeal.item(1), today.day(), lunch);
        pickMeal(todayMeal.item(2), today.day(), dinner);
    }
    if (tomorrowMeal) {
        pickMeal(tomorrowMeal.item(0), tomorrow.day(), breakfast);
    }

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
};

