import { v1 } from "@common-jshs/menkakusitsu-lib";
import { UploadedFile } from "express-fileupload";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { escapeUserName } from ".";
import { sendPush } from "../firebase";
import { DeletedUser } from "./Constant";
import config from "../config";
import { Exception, execute, query, ResponseException } from "common-api-ts";

export interface FileData {
    name: string;
    endpoint: string;
}

export const handleFiles = async (
    files: UploadedFile[],
    uploaderUid: number,
    board?: string,
    postId?: number
) => {
    const fileDatas: FileData[] = [];
    for (const file of files) {
        const filePath = file.tempFilePath;
        const fileDir = path.dirname(filePath);
        const newFileName = `${uuidv4()}${path.extname(file.name)}`;
        const newPath = path.join(fileDir, newFileName);
        const fileEndPoint = `${config.fileServerUri}/${newFileName}`;
        fs.renameSync(filePath, newPath);

        const formData = new FormData();
        formData.append("data", fs.createReadStream(newPath));

        const response = await fetch(`${config.fileServerUriInner}/files/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.fileServerAuthKey}`,
            },
            body: formData as any,
        });
        if (!response.ok) {
            throw new Exception(response.statusText);
        }
        if (postId && board) {
            await execute(
                "INSERT INTO bbs_file(postId, ownerUid, board, fileName, downloadLink, mimeType, createdDate) VALUE(?, ?, ?, ?, ?, ?, NOW())",
                [
                    postId,
                    uploaderUid,
                    board,
                    file.name,
                    fileEndPoint,
                    file.mimetype,
                ]
            );
        }
        fileDatas.push({ name: file.name, endpoint: fileEndPoint });
    }
    return fileDatas;
};

export const getUserInfoList = async () => {
    const userInfo: v1.UserInfo[] = (await query(
        "SELECT uid, name FROM user WHERE state=1",
        []
    )) as any;
    return userInfo;
};

export const findUserByUid = (userInfo: v1.UserInfo[], uid: number) => {
    for (const info of userInfo) {
        if (info.uid === uid) {
            return info;
        }
    }
    return DeletedUser;
};

export const getUserInfo = async (uid: number): Promise<v1.UserInfo> => {
    const getStudentInfoQuery = await query(
        "SELECT sid, name FROM user WHERE state=1 AND uid=?",
        [uid]
    );
    if (!getStudentInfoQuery || getStudentInfoQuery.length === 0) {
        return DeletedUser;
    }
    return {
        uid: uid,
        name: getStudentInfoQuery[0].name,
        value: getStudentInfoQuery[0].name,
    };
};

export const getStudentInfo = async (uid: number): Promise<v1.UserInfo> => {
    const getStudentInfoQuery = await query(
        "SELECT sid, name FROM user WHERE state=1 AND uid=? AND permission=1",
        [uid]
    );
    if (!getStudentInfoQuery || getStudentInfoQuery.length === 0) {
        return DeletedUser;
    }
    return {
        uid: uid,
        name: getStudentInfoQuery[0].name,
        value: `${getStudentInfoQuery[0].sid} ${getStudentInfoQuery[0].name}`,
    };
};

export const getTeacherInfo = async (uid: number): Promise<v1.UserInfo> => {
    const getTeacherInfoQuery = await query(
        "SELECT sid, name FROM user WHERE state=1 AND uid=? AND permission=2",
        [uid]
    );
    if (!getTeacherInfoQuery || getTeacherInfoQuery.length === 0) {
        return DeletedUser;
    }
    return {
        uid: uid,
        name: getTeacherInfoQuery[0].name,
        value: `${getTeacherInfoQuery[0].name} 선생님`,
    };
};

export const getBbsPost = async (board: string, postId: number) => {
    const getbbsPostQuery = await query(
        "SELECT * FROM bbs_post WHERE deletedDate IS NULL AND board=? AND id=?",
        [board, postId]
    );
    if (!getbbsPostQuery || getbbsPostQuery.length === 0) {
        throw new ResponseException(
            -1,
            "삭제됐거나 존재하지 않는 피드백입니다."
        );
    }
    return getbbsPostQuery;
};

export const getBbsComment = async (
    board: string,
    postId: number,
    commentId: number
) => {
    const getbbsPostQuery = await query(
        "SELECT * FROM bbs_comment WHERE deletedDate IS NULL AND board=? AND postId=? AND id=?",
        [board, postId, commentId]
    );
    if (!getbbsPostQuery || getbbsPostQuery.length === 0) {
        throw new ResponseException(
            -1,
            "이미 삭제됐거나 존재하지 않는 의견입니다."
        );
    }
    return getbbsPostQuery;
};

export const getInformation = async (isAuthed: boolean) => {
    const selectInformationQuery = await query(
        "SELECT * FROM (SELECT applyId, GROUP_CONCAT(name) AS applicants FROM (SELECT specialroom_apply_student.applyId, user.name FROM specialroom_apply_student, user WHERE specialroom_apply_student.studentUid = user.uid) AS A GROUP BY A.applyId) AS B, specialroom_apply WHERE B.applyId = specialroom_apply.applyId",
        []
    );
    const information: v1.SpecialroomInfo[] = [];

    const userInfo = await getUserInfoList();

    for (const selectInformation of selectInformationQuery as any[]) {
        const master = findUserByUid(userInfo, selectInformation.masterUid);
        master.value = "";

        const teacher = findUserByUid(userInfo, selectInformation.teacherUid);
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
            applyId: selectInformation.applyId,
            state: selectInformation.isApproved,
            master: selectInformation.master,
            teacher: selectInformation.teacher,
            applicants: selectInformation.applicants,
            location: selectInformation.location,
            purpose: selectInformation.purpose,
            when: selectInformation.when,
        });
    }
    return information;
};

export const getSpecialroomInfo = async (
    when: number,
    applicantUid: number
) => {
    const getApplyIdQuery = await query(
        "SELECT applyId FROM specialroom_apply_student WHERE studentUid=?",
        [applicantUid]
    );
    if (!getApplyIdQuery || getApplyIdQuery.length === 0) {
        return null;
    }
    for (const getApplyId of getApplyIdQuery) {
        const applyId = getApplyId.applyId;
        const getApplyQuery = await query(
            "SELECT teacherUid, masterUid, purpose, location, GROUP_CONCAT(name) AS applicants, `when`, isApproved FROM user, specialroom_apply WHERE user.uid = ANY(SELECT studentUid FROM specialroom_apply_student WHERE applyId=? GROUP BY studentUid) AND specialroom_apply.applyId=? AND `when`=? GROUP BY teacherUid, masterUid, purpose, location, `when`, isApproved",
            [applyId, applyId, when]
        );
        if (!getApplyQuery || getApplyQuery.length === 0) {
            continue;
        }
        const master = await getStudentInfo(getApplyQuery[0].masterUid);
        const teacher = await getTeacherInfo(getApplyQuery[0].teacherUid);
        return {
            applyId: applyId,
            state: getApplyQuery[0].isApproved,
            master: master,
            teacher: teacher,
            applicants: getApplyQuery[0].applicants,
            location: getApplyQuery[0].location,
            purpose: getApplyQuery[0].purpose,
            when: getApplyQuery[0].when,
        };
    }
    return null;
};

export const sendPushToUser = async (
    targetUid: number,
    title: string,
    body: string,
    link?: string
) => {
    const selectTokenQuery = await query(
        "SELECT token FROM push_token WHERE uid=?",
        [targetUid]
    );
    for (const pushToken of selectTokenQuery) {
        if (pushToken.token) {
            sendPush(pushToken.token, title, body, link);
        }
    }
};
