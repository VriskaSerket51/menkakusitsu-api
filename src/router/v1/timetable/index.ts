import { Request, Response } from "express";
import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import V1 from "..";
import { execute, query } from "../../../mysql";
import { HttpException } from "../../../exceptions";
import fs from "fs";
import path from "path";

class Timetable extends V1 {
    constructor() {
        super();
        this.setPath("/timetable");
        this.models = [
            {
                method: "get",
                path: "/:when",
                // authType: "access",
                controller: this.onGetTimetable,
            },
            {
                method: "put",
                path: "/:when",
                // authType: "access",
                controller: this.onPutTimetable,
            },
        ];
    }

    async onGetTimetable(req: Request, res: Response) {
        const getTimetableRequest: v1.GetTimetableRequest = req.params as any;
        if (!getTimetableRequest.when) {
            throw new HttpException(400);
        }

        const timetableQuery: v1.TimetableCell[] = (await query(
            "SELECT `key`, `value` FROM timetable WHERE `when`=?",
            [getTimetableRequest.when]
        )) as any;

        const findValue = (key: string) => {
            for (const timetableInfo of timetableQuery) {
                if (timetableInfo.key === key) {
                    return timetableInfo.value;
                }
            }
            execute(
                "INSERT INTO timetable(`key`, `value`, `when`) VALUE(?, ?, ?)",
                [key, "null", getTimetableRequest.when]
            );
            return "null";
        };

        const parseTimetable = (path: string): v1.TimetableCell[][] => {
            const csv = fs.readFileSync(path, "utf-8");
            const rows = csv.split("\n");
            const result: v1.TimetableCell[][] = [];
            for (let i = 0; i < rows.length; i++) {
                const columns = rows[i].split(",");
                const cellRow: v1.TimetableCell[] = [];
                for (let j = 0; j < columns.length; j++) {
                    if (columns[j].startsWith("data:")) {
                        const key = columns[j].split("data:")[1];
                        cellRow.push({ key: key, value: findValue(key) });
                    } else {
                        cellRow.push({ key: "", value: columns[j] });
                    }
                }
                result.push(cellRow);
            }
            return result;
        };

        const timetableInfo = parseTimetable(
            path.join(
                __dirname,
                "..",
                "..",
                "..",
                "files",
                "timetable_normal.csv"
            )
        );

        const getTimetableResponse: v1.GetTimetableResponse = {
            status: 0,
            message: "",
            timetable: {
                timetableInfo: timetableInfo,
            },
        };
        res.status(200).json(getTimetableResponse);
    }

    async onPutTimetable(req: Request, res: Response) {
        const putTimetableRequest: v1.PutTimetableRequest = req.body;
        putTimetableRequest.when = req.params.when;
        if (!putTimetableRequest.when || !putTimetableRequest.timetableInfo) {
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
    }
}

export default Timetable;
