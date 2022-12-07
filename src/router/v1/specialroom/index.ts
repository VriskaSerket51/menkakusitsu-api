import { Request, Response } from "express";
import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import V1 from "..";
import { execute, query } from "../../../mysql";
import { ResponseException, HttpException } from "../../../exceptions";
import { defaultErrorHandler } from "../../../utils/ErrorHandler";
import {
    escapeUserName,
    getJwtPayload,
    getStudentInfo,
    getTeacherInfo,
    getUserInfo,
} from "../../../utils/Utility";
import { SpecialroomInfo } from "@common-jshs/menkakusitsu-lib/v1";
import fs from "fs";
import path from "path";

class Specialroom extends V1 {
    constructor() {
        super();
        this.setPath("/specialroom");
        this.models = [
            {
                method: "get",
                path: "/apply",
                authType: "access",
                controller: Specialroom.onGetApply,
            },
            {
                method: "post",
                path: "/apply",
                authType: "access",
                controller: Specialroom.onPostApply,
            },
            {
                method: "delete",
                path: "/apply",
                authType: "access",
                controller: Specialroom.onDeleteApply,
            },
            {
                method: "get",
                path: "/attendance/info",
                authType: "access",
                controller: Specialroom.onGetAttendanceInfo,
            },
            {
                method: "get",
                path: "/attendance/list",
                authType: "access",
                controller: Specialroom.onGetAttendanceList,
            },
            {
                method: "get",
                path: "/info",
                authType: "optional",
                controller: Specialroom.onGetSpecialroomInfo,
            },
            {
                method: "put",
                path: "/info",
                authType: "access",
                controller: Specialroom.onPutSpecialroomInfo,
            },
            {
                method: "get",
                path: "/info/manager/:when",
                authType: "access",
                controller: Specialroom.onGetManagerInfo,
            },
            {
                method: "get",
                path: "/info/location",
                authType: "access",
                controller: Specialroom.onGetLocationInfo,
            },
            {
                method: "get",
                path: "/info/purpose",
                authType: "access",
                controller: Specialroom.onGetPurposeInfo,
            },
            {
                method: "get",
                path: "/info/student",
                authType: "access",
                controller: Specialroom.onGetStudentInfo,
            },
            {
                method: "get",
                path: "/info/teacher",
                authType: "access",
                controller: Specialroom.onGetTeacherInfo,
            },
        ];
    }

    static async getInformation(isAuthed: boolean) {
        const selectInformationQuery = await query(
            "SELECT * FROM (SELECT apply_ID, GROUP_CONCAT(name) AS applicants FROM (SELECT specialroom_apply_student.apply_ID, user.name FROM specialroom_apply_student, user WHERE specialroom_apply_student.student_UID = user.UID) AS A GROUP BY A.apply_ID) AS B, specialroom_apply WHERE B.apply_ID = specialroom_apply.apply_ID",
            []
        );
        const information: SpecialroomInfo[] = [];

        const userInfo = await getUserInfo();
        const findUser = (uid: number) => {
            for (const info of userInfo) {
                if (info.uid === uid) {
                    return info;
                }
            }
            return null;
        };

        for (const selectInformation of selectInformationQuery as any[]) {
            const master = findUser(selectInformation.master_UID);
            if (!master) {
                throw new HttpException(500);
            }
            master.value = "";

            const teacher = findUser(selectInformation.teacher_UID);
            if (!teacher) {
                throw new HttpException(500);
            }
            teacher.value = "";

            if (!isAuthed) {
                master.name = escapeUserName(master.name);
                teacher.name = escapeUserName(teacher.name);
                selectInformation.applicants = (
                    selectInformation.applicants as string
                )
                    .split(",")
                    .map((name) => escapeUserName(name))
                    .join(",");
            }
            selectInformation.master = master;
            selectInformation.teacher = teacher;

            information.push({
                applyId: selectInformation.apply_ID,
                state: selectInformation.approved_flag,
                master: selectInformation.master,
                teacher: selectInformation.teacher,
                applicants: selectInformation.applicants,
                location: selectInformation.location,
                purpose: selectInformation.purpose,
                when: selectInformation.when,
            });
        }
        return information;
    }

    static async getSpecialroomInfo(when: number, applicantUid: number) {
        const getApplyIdQuery = await query(
            "SELECT apply_ID FROM specialroom_apply_student WHERE student_UID=?",
            [applicantUid]
        );
        if (!getApplyIdQuery || getApplyIdQuery.length === 0) {
            return null;
        }
        const applyId = getApplyIdQuery[0].apply_ID;
        const getApplyQuery = await query(
            "SELECT teacher_UID, master_UID, purpose, location, GROUP_CONCAT(name) AS applicants, `when`, approved_flag FROM user, specialroom_apply WHERE user.UID = ANY(SELECT student_UID FROM specialroom_apply_student WHERE apply_ID=? GROUP BY student_UID) AND specialroom_apply.apply_ID=? AND `when`=? GROUP BY teacher_UID, master_UID, purpose, location, `when`, approved_flag",
            [applyId, applyId, when]
        );
        if (!getApplyQuery || getApplyQuery.length === 0) {
            return null;
        }
        const master = await getStudentInfo(getApplyQuery[0].master_UID);
        if (!master) {
            throw new HttpException(500);
        }
        const teacher = await getTeacherInfo(getApplyQuery[0].teacher_UID);
        if (!teacher) {
            throw new HttpException(500);
        }
        return {
            applyId: applyId,
            state: getApplyQuery[0].approved_flag,
            master: master,
            teacher: teacher,
            applicants: getApplyQuery[0].applicants,
            location: getApplyQuery[0].location,
            purpose: getApplyQuery[0].purpose,
            when: getApplyQuery[0].when,
        };
    }

    static async onGetApply(req: Request, res: Response) {
        try {
            const getApplyRequest: v1.GetApplyRequest = req.query as any;
            if (getApplyRequest.when === undefined) {
                throw new HttpException(400);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            const specialroomInfo = await Specialroom.getSpecialroomInfo(
                getApplyRequest.when,
                payload.uid
            );
            if (!specialroomInfo) {
                throw new ResponseException(
                    1,
                    `${getApplyRequest.when}차 때 신청한 특별실이 없습니다.`
                );
            }
            const getApplyResponse: v1.GetApplyResponse = {
                status: 0,
                message: "",
                specialroomInfo: specialroomInfo,
            };
            res.status(200).json(getApplyResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPostApply(req: Request, res: Response) {
        try {
            const postApplyRequest: v1.PostApplyRequest = req.body;
            if (
                postApplyRequest.when === undefined ||
                !postApplyRequest.location ||
                !postApplyRequest.purpose ||
                !postApplyRequest.teacherUid ||
                !postApplyRequest.applicants
            ) {
                throw new HttpException(400);
            }
            for (const applicant of postApplyRequest.applicants) {
                const specialroomInfo = await Specialroom.getSpecialroomInfo(
                    postApplyRequest.when,
                    applicant.uid
                );
                if (specialroomInfo) {
                    throw new ResponseException(
                        -1,
                        `${applicant.value} 학생은 ${postApplyRequest.when}차 특별실을 이미 신청했습니다! (중복 신청 방지)`
                    );
                }
            }
            const payload = getJwtPayload(req.headers.authorization!);
            // if (payload.isTeacher) {
            // postApplyRequest.purpose += "(선생님이 신청)";
            // }
            const insertApply = await execute(
                "INSERT INTO specialroom_apply(teacher_UID, master_UID, location, purpose, `when`, approved_flag) VALUE(?, ?, ?, ?, ?, ?)",
                [
                    postApplyRequest.teacherUid,
                    payload.uid,
                    postApplyRequest.location,
                    postApplyRequest.purpose,
                    postApplyRequest.when,
                    payload.isTeacher,
                ]
            );
            const applyId = insertApply.insertId;
            postApplyRequest.applicants.forEach((applicant) => {
                execute(
                    "INSERT INTO specialroom_apply_student(apply_ID, student_UID) VALUE(?, ?)",
                    [applyId, applicant.uid]
                );
            });
            /*const specialroomInfo = await Specialroom.getSpecialroomInfo(
                postApplyRequest.when,
                payload.uid
            );
            if (!specialroomInfo) {
                throw new HttpException(500);
            }*/
            const postApplyResponse: v1.PostApplyResponse = {
                status: 0,
                message: "",
                // specialroomInfo: specialroomInfo,
            };
            res.status(200).json(postApplyResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onDeleteApply(req: Request, res: Response) {
        try {
            const deleteApplyRequest: v1.DeleteApplyRequest = req.body;
            if (deleteApplyRequest.when === undefined) {
                throw new HttpException(400);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            const specialroomInfo = await Specialroom.getSpecialroomInfo(
                deleteApplyRequest.when,
                payload.uid
            );
            if (!specialroomInfo) {
                throw new ResponseException(
                    -1,
                    `${deleteApplyRequest.when}차 때 특별실을 신청하지 않으셨습니다.`
                );
            }
            await execute("DELETE FROM specialroom_apply WHERE apply_ID=?", [
                specialroomInfo.applyId,
            ]);
            const deleteApplyResponse: v1.DeleteApplyResponse = {
                status: 0,
                message: "",
                // specialroomInfo: specialroomInfo,
            };
            res.status(200).json(deleteApplyResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetAttendanceInfo(req: Request, res: Response) {
        try {
            const getAttendanceInfoRequest: v1.GetAttendanceInfoRequest =
                req.query as any;
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetAttendanceList(req: Request, res: Response) {
        try {
            const getAttendanceListRequest: v1.GetAttendanceListRequest =
                req.query as any;
            if (getAttendanceListRequest.when === undefined) {
                throw new HttpException(400);
            }
            const information = await query(
                "SELECT B.name, B.apply_ID, specialroom_apply.approved_flag FROM (SELECT A.name, specialroom_apply_student.apply_ID FROM (SELECT name, UID FROM user) AS A, specialroom_apply_student WHERE A.UID = specialroom_apply_student.student_UID) AS B, specialroom_apply WHERE B.apply_ID=specialroom_apply.apply_ID AND specialroom_apply.when=?",
                [getAttendanceListRequest.when]
            );
            const getSpecialroom = (studentName: string) => {
                for (const specialroom of information) {
                    if (specialroom.name === studentName) {
                        return specialroom;
                    }
                }
            };
            const parseAttendanceList = (path: string): string[][] => {
                const csv = fs.readFileSync(path, "utf-8");
                const rows = csv.split("\n");
                const result: string[][] = [];
                for (let i = 0; i < rows.length; i++) {
                    const columns = rows[i].split(",");
                    for (let j = 0; j < columns.length; j++) {
                        if (columns[j].trim() == "data") {
                            const upperColums = rows[i - 1].split(",");
                            const studentName = upperColums[j];
                            const data = getSpecialroom(studentName);
                            if (!data) {
                                columns[j] = "　";
                            } else if (data["approved_flag"]) {
                                columns[j] = data["apply_ID"];
                            } else {
                                columns[j] = `${data["apply_ID"]}(X)`;
                            }
                        }
                    }
                    result.push(columns);
                }
                return result;
            };
            const getAttendanceListResponse: v1.GetAttendanceListResponse = {
                status: 0,
                message: "",
                list: {
                    big: parseAttendanceList(
                        path.join(
                            __dirname,
                            "..",
                            "..",
                            "..",
                            "files",
                            "attendance_list_big.csv"
                        )
                    ),
                    small: parseAttendanceList(
                        path.join(
                            __dirname,
                            "..",
                            "..",
                            "..",
                            "files",
                            "attendance_list_small.csv"
                        )
                    ),
                },
            };
            res.status(200).json(getAttendanceListResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetSpecialroomInfo(req: Request, res: Response) {
        try {
            const getInfoRequest: v1.GetInfoRequest = req.query as any;
            const isAuthed =
                Boolean(req.headers.authorization) &&
                req.headers.authorization!.startsWith("Bearer ");
            const information = await Specialroom.getInformation(isAuthed);
            const getInfoResponse: v1.GetInfoResponse = {
                status: 0,
                message: "",
                information: information,
            };
            res.status(200).json(getInfoResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPutSpecialroomInfo(req: Request, res: Response) {
        try {
            const putInfoRequest: v1.PutInfoRequest = req.body;
            if (!putInfoRequest.information) {
                throw new HttpException(400);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            if (!payload.isTeacher) {
                throw new HttpException(403);
            }
            for (const specialroomInfo of putInfoRequest.information) {
                await execute(
                    "UPDATE specialroom_apply SET approved_flag=? WHERE apply_ID=?",
                    [specialroomInfo.state, specialroomInfo.applyId]
                );
            }
            const putInfoResponse: v1.PutInfoResponse = {
                status: 0,
                message: "",
                information: await Specialroom.getInformation(true),
            };
            res.status(200).json(putInfoResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetManagerInfo(req: Request, res: Response) {
        try {
            const request: v1.GetManagerRequest = req.params as any;
            const getManagerQuery = await query(
                "SELECT * FROM specialroom_manager WHERE `when`=?",
                [request.when]
            );
            if (!getManagerQuery || getManagerQuery.length === 0) {
                throw new ResponseException(
                    -1,
                    "해당 날짜에 등록된 생활 지도 선생님이 없습니다."
                );
            }
            const manager = await getTeacherInfo(getManagerQuery[0].teacherUid);
            if (!manager) {
                throw new HttpException(500);
            }
            const response: v1.GetManagerResponse = {
                status: 0,
                message: "",
                manager: manager,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetLocationInfo(req: Request, res: Response) {
        try {
            const getLocationInfoRequest: v1.GetLocationInfoRequest =
                req.query as any;
            const locationInfo: v1.LocationInfo[] = [
                {
                    id: 0,
                    value: "1학년 1반",
                },
                {
                    id: 1,
                    value: "1학년 2반",
                },
                {
                    id: 2,
                    value: "2학년 1반",
                },
                {
                    id: 3,
                    value: "2학년 2반",
                },
                {
                    id: 4,
                    value: "3학년 1반",
                },
                {
                    id: 5,
                    value: "3학년 2반",
                },
                {
                    id: 6,
                    value: "VR체험실",
                },
                {
                    id: 7,
                    value: "멀티미디어실",
                },
                {
                    id: 8,
                    value: "회의실",
                },
                {
                    id: 9,
                    value: "도서관",
                },
                {
                    id: 10,
                    value: "도서관 스터디룸",
                },
                {
                    id: 11,
                    value: "전문 기자재실",
                },
                {
                    id: 12,
                    value: "어학실",
                },
                {
                    id: 13,
                    value: "실용음악부실",
                },
                {
                    id: 14,
                    value: "체력단련실",
                },
                {
                    id: 15,
                    value: "무한상상실",
                },
                {
                    id: 16,
                    value: "수학실",
                },
                {
                    id: 17,
                    value: "물리실험실(연구동)",
                },
                {
                    id: 18,
                    value: "화학실험실(연구동)",
                },
                {
                    id: 19,
                    value: "생물실험실(연구동)",
                },
                {
                    id: 20,
                    value: "지구과학실(연구동)",
                },
                {
                    id: -1,
                    value: "기타",
                },
            ];
            const getLocationInfoResponse: v1.GetLocationInfoResponse = {
                status: 0,
                message: "",
                locationInfo: locationInfo,
            };
            res.status(200).json(getLocationInfoResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetPurposeInfo(req: Request, res: Response) {
        try {
            const getPurposeInfoRequest: v1.GetPurposeInfoRequest =
                req.query as any;
            const purposeInfo: v1.PurposeInfo[] = [
                {
                    id: 100,
                    value: "R&E",
                },
                {
                    id: 101,
                    value: "과제 연구",
                },
                {
                    id: 102,
                    value: "개인 연구",
                },
                {
                    id: 103,
                    value: "연구 활동",
                },
                {
                    id: 200,
                    value: "브릿지 수업",
                },
                {
                    id: 201,
                    value: "심층 면접",
                },
                {
                    id: 300,
                    value: "자기소개서 작성",
                },
                {
                    id: 400,
                    value: "자연탐사",
                },
                {
                    id: 401,
                    value: "무한상상 STEAM",
                },
                {
                    id: 500,
                    value: "그룹 스터디",
                },
                {
                    id: -1,
                    value: "기타",
                },
            ];
            const getPurposeInfoResponse: v1.GetPurposeInfoResponse = {
                status: 0,
                message: "",
                purposeInfo: purposeInfo,
            };
            res.status(200).json(getPurposeInfoResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetStudentInfo(req: Request, res: Response) {
        try {
            const getStudentInfoRequest: v1.GetStudentInfoRequest =
                req.query as any;
            const studentInfo: v1.UserInfo[] = (await query(
                "SELECT UID as uid, name, CONCAT(student_ID, ' ', name) AS value FROM user WHERE teacher_flag=0",
                []
            )) as any;
            const getStudentInfoResponse: v1.GetStudentInfoResponse = {
                status: 0,
                message: "",
                studentInfo: studentInfo,
            };
            res.status(200).json(getStudentInfoResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetTeacherInfo(req: Request, res: Response) {
        try {
            const getTeacherInfoRequest: v1.GetTeacherInfoRequest =
                req.query as any;
            const teacherInfo: v1.UserInfo[] = (await query(
                "SELECT UID as uid, name, CONCAT(name, ' 선생님') AS value FROM user WHERE teacher_flag=1",
                []
            )) as any;
            const getTeacherInfoResponse: v1.GetTeacherInfoResponse = {
                status: 0,
                message: "",
                teacherInfo: teacherInfo,
            };
            res.status(200).json(getTeacherInfoResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }
}

export default Specialroom;
