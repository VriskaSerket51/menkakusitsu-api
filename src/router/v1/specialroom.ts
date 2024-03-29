import CommonApi from "@ireves/common-api";
import { v1, Permission } from "@common-jshs/menkakusitsu-lib";
import { Request, Response } from "express";

import V1 from "@/router/v1";
import { Api, Utility, Sanitizer } from "@/utils";

class Specialroom extends V1 {
  constructor() {
    super();
    this.setPath("/specialroom");
    this.models = [
      {
        method: "get",
        path: "/apply",
        authType: "access",
        controller: this.onGetApply,
      },
      {
        method: "post",
        path: "/apply",
        authType: "access",
        controller: this.onPostApply,
      },
      {
        method: "delete",
        path: "/apply",
        authType: "access",
        controller: this.onDeleteApply,
      },
      {
        method: "get",
        path: "/attendance/info",
        authType: "access",
        controller: this.onGetAttendanceInfo,
      },
      {
        method: "get",
        path: "/attendance/list",
        authType: "access",
        controller: this.onGetAttendanceList,
      },
      {
        method: "get",
        path: "/info",
        authType: "optional",
        controller: this.onGetSpecialroomInfo,
      },
      {
        method: "put",
        path: "/info",
        authType: "access",
        permission: Permission.Teacher,
        controller: this.onPutSpecialroomInfo,
      },
      {
        method: "get",
        path: "/info/manager/:when",
        authType: "access",
        controller: this.onGetManagerInfo,
      },
      {
        method: "get",
        path: "/info/location",
        authType: "access",
        controller: this.onGetLocationInfo,
      },
      {
        method: "get",
        path: "/info/purpose",
        authType: "access",
        controller: this.onGetPurposeInfo,
      },
      {
        method: "get",
        path: "/info/student",
        authType: "access",
        controller: this.onGetStudentInfo,
      },
      {
        method: "get",
        path: "/info/teacher",
        authType: "access",
        controller: this.onGetTeacherInfo,
      },
    ];
  }

  async onGetApply(req: Request, res: Response) {
    const request: v1.GetApplyRequest = req.query as any;
    if (!Sanitizer.sanitizeRequest(request, "GetApplyRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const payload = Utility.getJwtPayload(req.headers.authorization!);
    const specialroomInfo = await Api.getSpecialroomInfo(
      request.when,
      payload.uid
    );
    if (!specialroomInfo) {
      throw new CommonApi.ResponseException(
        1,
        `${request.when}차 때 신청한 특별실이 없습니다.`
      );
    }
    const response: v1.GetApplyResponse = {
      status: 0,
      message: "",
      specialroomInfo: specialroomInfo,
    };
    res.status(200).json(response);
  }

  async onPostApply(req: Request, res: Response) {
    const request: v1.PostApplyRequest = req.body;
    if (!Sanitizer.sanitizeRequest(request, "PostApplyRequest")) {
      throw new CommonApi.HttpException(400);
    }

    for (const applicant of request.applicants) {
      const specialroomInfo = await Api.getSpecialroomInfo(
        request.when,
        applicant.uid
      );
      if (specialroomInfo) {
        throw new CommonApi.ResponseException(
          -1,
          `${applicant.value} 학생은 ${request.when}차 특별실을 이미 신청했습니다! (중복 신청 방지)`
        );
      }
    }
    const payload = Utility.getJwtPayload(req.headers.authorization!);
    // if (payload.hasPermission(Permission.Teacher)) {
    // postApplyRequest.purpose += "(선생님이 신청)";
    // }
    const insertApply = await CommonApi.runAsync(
      "INSERT INTO specialroom_apply(teacherUid, masterUid, location, purpose, `when`, isApproved) VALUE(?, ?, ?, ?, ?, ?)",
      [
        request.teacherUid,
        payload.uid,
        request.location,
        request.purpose,
        request.when,
        payload.hasPermission(Permission.Teacher),
      ]
    );
    const applyId = insertApply.insertId;
    request.applicants.forEach((applicant) => {
      CommonApi.runAsync(
        "INSERT INTO specialroom_apply_student(applyId, studentUid) VALUE(?, ?)",
        [applyId, applicant.uid]
      );
    });
    /*const specialroomInfo = await Specialroom.Api.getSpecialroomInfo(
                postApplyRequest.when,
                payload.uid
            );
            if (!specialroomInfo) {
                throw new CommonApi.HttpException(500);
            }*/
    const response: v1.PostApplyResponse = {
      status: 0,
      message: "",
      // specialroomInfo: specialroomInfo,
    };
    res.status(200).json(response);
  }

  async onDeleteApply(req: Request, res: Response) {
    const request: v1.DeleteApplyRequest = req.body;
    if (!Sanitizer.sanitizeRequest(request, "DeleteApplyRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const payload = Utility.getJwtPayload(req.headers.authorization!);
    const specialroomInfo = await Api.getSpecialroomInfo(
      request.when,
      payload.uid
    );
    if (!specialroomInfo) {
      throw new CommonApi.ResponseException(
        -1,
        `${request.when}차 때 특별실을 신청하지 않으셨습니다.`
      );
    }
    await CommonApi.runAsync("DELETE FROM specialroom_apply WHERE applyId=?", [
      specialroomInfo.applyId,
    ]);
    const response: v1.DeleteApplyResponse = {
      status: 0,
      message: "",
      // specialroomInfo: specialroomInfo,
    };
    res.status(200).json(response);
  }

  async onGetAttendanceInfo(req: Request, res: Response) {
    const request: v1.GetAttendanceInfoRequest = req.query as any;
    if (!Sanitizer.sanitizeRequest(request, "GetAttendanceInfoRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const info = [
      "출석부 학생 배치는 면학실 자리 배치와 같습니다.",
      "출석부 최하단에 일일 특별실 신청 명단이 있습니다.",
      "학생이 특별실을 신청한 경우 학생 이름 아래에 번호가 적힙니다. 학생 이름 아래에 적힌 번호는 특별실 신청 번호이며, 출석부 최하단의 일일 특별실 신청 명단에서 세부 내용을 확인할 수 있습니다.",
      "학생이 특별실을 신청했으나 선생님이 신청을 거부했거나 승인하지 않은 경우, 학생 이름 아래에 '번호(X)'가 적힙니다.",
      "대부분의 경우 1차 면학 출석부를 다운받으시면 됩니다.",
    ];
    const response: v1.GetAttendanceInfoResponse = {
      status: 0,
      message: "",
      info: info,
    };
    res.status(200).json(response);
  }

  async onGetAttendanceList(req: Request, res: Response) {
    const request: v1.GetAttendanceListRequest = req.query as any;
    if (!Sanitizer.sanitizeRequest(request, "GetAttendanceListRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const information = await CommonApi.getAllAsync(
      "SELECT B.name, B.applyId, specialroom_apply.isApproved FROM (SELECT A.name, specialroom_apply_student.applyId FROM (SELECT name, uid FROM user) AS A, specialroom_apply_student WHERE A.uid = specialroom_apply_student.studentUid) AS B, specialroom_apply WHERE B.applyId=specialroom_apply.applyId AND specialroom_apply.when=?",
      [request.when]
    );
    const getSpecialroom = (studentName: string) => {
      for (const specialroom of information) {
        if (specialroom.name === studentName) {
          return specialroom;
        }
      }
    };
    const parseAttendanceList = (fileName: string): string[][] => {
      const csv = Utility.readFromFileFolder(fileName);
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
            } else if (data["isApproved"]) {
              columns[j] = data["applyId"];
            } else {
              columns[j] = `${data["applyId"]}(X)`;
            }
          }
        }
        result.push(columns);
      }
      return result;
    };
    const response: v1.GetAttendanceListResponse = {
      status: 0,
      message: "",
      list: {
        big: parseAttendanceList("attendance_list_big.csv"),
        small: parseAttendanceList("attendance_list_small.csv"),
      },
    };
    res.status(200).json(response);
  }

  async onGetSpecialroomInfo(req: Request, res: Response) {
    const request: v1.GetInfoRequest = req.query as any;
    if (!Sanitizer.sanitizeRequest(request, "GetInfoRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const isAuthed = await Utility.checkAuthAsync(
      String(req.headers.authorization)
    );

    const information = await Api.getSpecialrooms(isAuthed);
    const response: v1.GetInfoResponse = {
      status: 0,
      message: "",
      information: information,
    };
    res.status(200).json(response);
  }

  async onPutSpecialroomInfo(req: Request, res: Response) {
    const request: v1.PutInfoRequest = req.body;
    if (!Sanitizer.sanitizeRequest(request, "PutInfoRequest")) {
      throw new CommonApi.HttpException(400);
    }

    for (const specialroomInfo of request.information) {
      await CommonApi.runAsync(
        "UPDATE specialroom_apply SET isApproved=? WHERE applyId=?",
        [specialroomInfo.state, specialroomInfo.applyId]
      );
    }
    const response: v1.PutInfoResponse = {
      status: 0,
      message: "",
      information: await Api.getSpecialrooms(true),
    };
    res.status(200).json(response);
  }

  async onGetManagerInfo(req: Request, res: Response) {
    const request: v1.GetManagerRequest = req.params as any;
    if (!Sanitizer.sanitizeRequest(request, "GetManagerRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const specialroom_manager = await CommonApi.getFirstAsync(
      "SELECT * FROM specialroom_manager WHERE `when`=?",
      [request.when]
    );
    if (!specialroom_manager) {
      throw new CommonApi.ResponseException(
        -1,
        "해당 날짜에 등록된 생활 지도 선생님이 없습니다."
      );
    }
    const manager = await Api.getTeacherInfo(specialroom_manager.teacherUid);
    const response: v1.GetManagerResponse = {
      status: 0,
      message: "",
      manager: manager,
    };
    res.status(200).json(response);
  }

  async onGetLocationInfo(req: Request, res: Response) {
    const request: v1.GetLocationInfoRequest = req.query as any;
    if (!Sanitizer.sanitizeRequest(request, "GetLocationInfoRequest")) {
      throw new CommonApi.HttpException(400);
    }

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
    const response: v1.GetLocationInfoResponse = {
      status: 0,
      message: "",
      locationInfo: locationInfo,
    };
    res.status(200).json(response);
  }

  async onGetPurposeInfo(req: Request, res: Response) {
    const request: v1.GetPurposeInfoRequest = req.query as any;
    if (!Sanitizer.sanitizeRequest(request, "GetPurposeInfoRequest")) {
      throw new CommonApi.HttpException(400);
    }

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
    const response: v1.GetPurposeInfoResponse = {
      status: 0,
      message: "",
      purposeInfo: purposeInfo,
    };
    res.status(200).json(response);
  }

  async onGetStudentInfo(req: Request, res: Response) {
    const request: v1.GetStudentInfoRequest = req.query as any;
    if (!Sanitizer.sanitizeRequest(request, "GetStudentInfoRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const studentInfo: v1.UserInfo[] = (await CommonApi.getAllAsync(
      "SELECT uid, name, CONCAT(sid, ' ', name) AS value FROM user WHERE state=1 AND permission=1 ORDER BY sid"
    )) as any;
    const response: v1.GetStudentInfoResponse = {
      status: 0,
      message: "",
      studentInfo: studentInfo,
    };
    res.status(200).json(response);
  }

  async onGetTeacherInfo(req: Request, res: Response) {
    const request: v1.GetTeacherInfoRequest = req.query as any;
    if (!Sanitizer.sanitizeRequest(request, "GetTeacherInfoRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const teacherInfo: v1.UserInfo[] = (await CommonApi.getAllAsync(
      "SELECT uid, name, CONCAT(name, ' 선생님') AS value FROM user WHERE state=1 AND permission=2"
    )) as any;
    const response: v1.GetTeacherInfoResponse = {
      status: 0,
      message: "",
      teacherInfo: teacherInfo,
    };
    res.status(200).json(response);
  }
}

export default Specialroom;
