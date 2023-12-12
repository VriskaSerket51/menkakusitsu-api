import fetch, { Response as FetchResponse, Response } from "node-fetch";
import dayjs from "dayjs";
import fs from "fs";
import path, { parse } from "path";
import { execute, logger, query, readAllFiles } from "common-api-ts";
import { JSDOM } from "jsdom";
import { ObjectType } from "typescript";
import { DefaultResponse } from "@common-jshs/menkakusitsu-lib";

export const mealUpdate = async () => {
    await execute("DELETE FROM meal", []);

    const today = dayjs();
    const tomorrow = today.add(1, "day");

    const parseHtml = async (resp: FetchResponse) => {
        const data = await resp.text();
        const dom = new JSDOM(data)
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


export const newMeal = async () => {
    await execute("DELETE FROM meal", []);
    const today = dayjs();
    const tomorrow = today.add(1, "day");


    const classTable = await getClass(await fetch(
        "https://school.jje.go.kr/jeju-s/ad/fm/foodmenu/selectFoodMenuView.do",
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'schDt': `${today.date()}`,
            }
        }
    ));
    const fmSeqs = [
        (await classTable).at(0)?.at(tomorrow.day()).toString(),
        (await classTable).at(1)?.at(today.day()).toString(),
        (await classTable).at(2)?.at(today.day()).toString()
    ];
    const breakfast = await getMealFromfmSeq(fmSeqs[0]?.substring(4,10));

    const lunch = await getMealFromfmSeq(fmSeqs[1]?.substring(4,10));

    const dinner = await getMealFromfmSeq(fmSeqs[2]?.substring(4,10));

    console.log("Meals Loaded");
    
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
    

}

export const getClass = async (resp: FetchResponse) => {
    const html = await resp.text();
    const dom = new JSDOM(html);
    
    let table = dom.window.document.querySelector("table");
    let rows = table?.querySelectorAll("tr");
    let rowsArr = Array.prototype.slice.call(rows);
    let data = rowsArr
        .map((row) => {
            return Array.prototype.slice.call(row.querySelectorAll("td"))
                .map((data) => 
                        data.querySelector("a")?.className.toString()
                );
        })
        .slice(1);
    return data;
};

export const getMealFromfmSeq = async (fmSeq : string) => {
    if(fmSeq == undefined) return [];
    const res = await fetch(
        "https://school.jje.go.kr/jeju-s/ad/fm/foodmenu/selectFoodData.do",
        {
            method: "POST",
            headers: {
                "Connection":"keep-alive",
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: new URLSearchParams({
                'fmSeq': `${fmSeq}`
            })
        }
    )
    const json = JSON.parse(await res.text());
    const meals =json["fmCn"].toString().split("<br/>");
    return meals;
}