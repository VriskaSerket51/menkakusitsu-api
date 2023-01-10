import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import { escapeUserName } from ".";
import { HttpException, ResponseException } from "../exceptions";
import { sendPush } from "../firebase";
import { query } from "../mysql";

export const getUserInfo = async () => {
    const userInfo: v1.UserInfo[] = (await query(
        "SELECT uid, name FROM user",
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
    return {
        uid: -1,
        value: "(알 수 없음)",
        name: "(알 수 없음)",
    };
};

export const getStudentInfo = async (
    uid: number
): Promise<v1.UserInfo | null> => {
    const getStudentInfoQuery = await query(
        "SELECT sid, name FROM user WHERE uid=?",
        [uid]
    );
    if (!getStudentInfoQuery || getStudentInfoQuery.length === 0) {
        return null;
    }
    return {
        uid: uid,
        name: getStudentInfoQuery[0].name,
        value: `${getStudentInfoQuery[0].sid} ${getStudentInfoQuery[0].name}`,
    };
};

export const getTeacherInfo = async (
    uid: number
): Promise<v1.UserInfo | null> => {
    const getTeacherInfoQuery = await query(
        "SELECT sid, name FROM user WHERE uid=? AND isTeacher=1",
        [uid]
    );
    if (!getTeacherInfoQuery || getTeacherInfoQuery.length === 0) {
        return null;
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
            "삭제됐거나 존재하지 않는 게시글입니다."
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
            "이미 삭제됐거나 존재하지 않는 댓글입니다."
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

    const userInfo = await getUserInfo();

    for (const selectInformation of selectInformationQuery as any[]) {
        const master = findUserByUid(userInfo, selectInformation.masterUid);
        if (!master) {
            throw new HttpException(500);
        }
        master.value = "";

        const teacher = findUserByUid(userInfo, selectInformation.teacherUid);
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
        if (!master) {
            throw new HttpException(500);
        }
        const teacher = await getTeacherInfo(getApplyQuery[0].teacherUid);
        if (!teacher) {
            throw new HttpException(500);
        }
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
