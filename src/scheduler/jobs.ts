import CommonApi from "@ireves/common-api";
import fetch, { Response as FetchResponse } from "node-fetch";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import { URLSearchParams } from "url";

export const mealUpdate = async () => {
  await CommonApi.runAsync("DELETE FROM meal");

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

  await CommonApi.runAsync(
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
  CommonApi.readAllFiles(path.join(__dirname, "..", "..", "tmp"), tempFiles);
  for (const tempFile of tempFiles) {
    fs.unlinkSync(tempFile);
  }
};

export const flushSpecialroom = async () => {
  try {
    const specialrooms = await CommonApi.getAllAsync(
      "SELECT * FROM (SELECT applyId, GROUP_CONCAT(name) as students FROM (SELECT specialroom_apply_student.applyId, user.name FROM specialroom_apply_student, user WHERE specialroom_apply_student.studentUid = user.uid) AS A GROUP BY A.applyId) AS B, specialroom_apply WHERE B.applyId = specialroom_apply.applyId",
      []
    );
    for (const specialroom of specialrooms) {
      await CommonApi.runAsync(
        "INSERT INTO specialroom_cache (applyId, teacherUid, location, purpose, students, createdDate) VALUES (?, ?, ?, ?, ?, CURDATE())",
        [
          specialroom.applyId,
          specialroom.teacherUid,
          specialroom.location,
          specialroom.purpose,
          specialroom.students,
        ]
      );
    }
  } catch (err) {
    CommonApi.logger.error(err);
  }

  await CommonApi.runAsync("DELETE FROM specialroom_apply");
  await CommonApi.runAsync("ALTER TABLE specialroom_apply AUTO_INCREMENT=1");
  await CommonApi.runAsync(
    "ALTER TABLE specialroom_apply_student AUTO_INCREMENT=1"
  );
};

export const flushDeletedBbsContent = async () => {
  await CommonApi.runAsync(
    "DELETE FROM bbs_post WHERE deletedDate >= NOW() - INTERVAL 3 MONTH"
  );
  await CommonApi.runAsync(
    "DELETE FROM bbs_comment WHERE deletedDate >= NOW() - INTERVAL 3 MONTH"
  );
  await CommonApi.runAsync(
    "DELETE FROM bbs_file WHERE deletedDate >= NOW() - INTERVAL 3 MONTH"
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
  await CommonApi.runAsync("DELETE FROM meal");
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

  await CommonApi.runAsync(
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
