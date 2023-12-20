import { Request, Response } from "express";
import { v1 } from "@common-jshs/menkakusitsu-lib";
import V1 from "..";
import { execute, query } from "common-api-ts";
import { HttpException } from "common-api-ts";
import fs from "fs";
import path from "path";
import { sanitizeRequest } from "../../../utils/Sanitizer";

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
        const request: v1.GetTimetableRequest = req.params as any;
        if (!sanitizeRequest(request, "GetTimetableRequest")) {
            throw new HttpException(400);
        }

        const timetableQuery: v1.TimetableCell[] = (await query(
            "SELECT `key`, `value` FROM timetable WHERE `when`=?",
            [request.when]
        )) as any;

        const findValue = (key: string) => {
            for (const timetableInfo of timetableQuery) {
                if (timetableInfo.key === key) {
                    return timetableInfo.value;
                }
            }
            execute(
                "INSERT INTO timetable(`key`, `value`, `when`) VALUE(?, ?, ?)",
                [key, "null", request.when]
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
        const request: v1.PutTimetableRequest = req.body;
        if (!sanitizeRequest(request, "PutTimetableRequest")) {
            throw new HttpException(400);
        }

        request.when = req.params.when;
        if (!request.when || !request.timetableInfo) {
            throw new HttpException(400);
        }

        for (const timetableCell of request.timetableInfo) {
            if (!timetableCell.key) {
                continue;
            }
            await execute(
                "UPDATE timetable SET `value`=? WHERE `when`=? AND `key`=?",
                [timetableCell.value, request.when, timetableCell.key]
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
