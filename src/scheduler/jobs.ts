import fetch, { Response as FetchResponse } from "node-fetch";
import dayjs from "dayjs";
import { parse } from "node-html-parser";
import fs from "fs";
import path from "path";
import { execute, logger, query, readAllFiles } from "common-api-ts";

export const mealUpdate = async () => {
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
