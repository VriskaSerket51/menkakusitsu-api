import { v1 } from "@common-jshs/menkakusitsu-lib";

type RequestType =
    | "PostRegisterRequest"
    | "DeleteSecessionRequest"
    | "PostLoginRequest"
    | "DeleteLogoutRequest"
    | "PostRefreshRequest"
    | "PutForgotPasswordRequest"
    | "GetBbsPostListRequest"
    | "GetBbsPostRequest"
    | "PostBbsPostRequest"
    | "PutBbsPostRequest"
    | "DeleteBbsPostRequest"
    | "GetBbsPostHeaderRequest"
    | "GetBbsCommentListRequest"
    | "PostBbsCommentRequest"
    | "DeleteBbsCommentRequest"
    | "GetSubjectListRequest"
    | "GetIdbotChatRequest"
    | "GetMealRequest"
    | "PutMealRequest"
    | "GetApplyRequest"
    | "PostApplyRequest"
    | "DeleteApplyRequest"
    | "GetAttendanceInfoRequest"
    | "GetAttendanceListRequest"
    | "GetInfoRequest"
    | "PutInfoRequest"
    | "GetManagerRequest"
    | "GetLocationInfoRequest"
    | "GetPurposeInfoRequest"
    | "GetStudentInfoRequest"
    | "GetTeacherInfoRequest"
    | "GetOuterStudentInfoRequest"
    | "PostOuterStudentInfoRequest"
    | "DeleteOuterStudentInfoRequest"
    | "GetTimetableRequest"
    | "PutTimetableRequest"
    | "GetMyPrivateInfoRequest"
    | "PutEmailRequest"
    | "PutPasswordRequest"
    | "PostPushRequest"
    | "PutPushRequest"
    | "DeletePushRequest";

export const checkRequest = (request: unknown, type: RequestType): boolean => {
    switch (type) {
        case "PostRegisterRequest":
            return checkPostRegisterRequest(request as v1.PostRegisterRequest);
        case "DeleteSecessionRequest":
            return checkDeleteSecessionRequest(
                request as v1.DeleteSecessionRequest
            );
        case "PostLoginRequest":
            return checkPostLoginRequest(request as v1.PostLoginRequest);
        case "DeleteLogoutRequest":
            return checkDeleteLogoutRequest(request as v1.DeleteLogoutRequest);
        case "PostRefreshRequest":
            return checkPostRefreshRequest(request as v1.PostRefreshRequest);
        case "PutForgotPasswordRequest":
            return checkPutForgotPasswordRequest(
                request as v1.PutForgotPasswordRequest
            );
        case "GetBbsPostListRequest":
            return checkGetBbsPostListRequest(
                request as v1.GetBbsPostListRequest
            );
        case "GetBbsPostRequest":
            return checkGetBbsPostRequest(request as v1.GetBbsPostRequest);
        case "PostBbsPostRequest":
            return checkPostBbsPostRequest(request as v1.PostBbsPostRequest);
        case "PutBbsPostRequest":
            return checkPutBbsPostRequest(request as v1.PutBbsPostRequest);
        case "DeleteBbsPostRequest":
            return checkDeleteBbsPostRequest(
                request as v1.DeleteBbsPostRequest
            );
        case "GetBbsPostHeaderRequest":
            return checkGetBbsPostHeaderRequest(
                request as v1.GetBbsPostHeaderRequest
            );
        case "GetBbsCommentListRequest":
            return checkGetBbsCommentListRequest(
                request as v1.GetBbsCommentListRequest
            );
        case "PostBbsCommentRequest":
            return checkPostBbsCommentRequest(
                request as v1.PostBbsCommentRequest
            );
        case "DeleteBbsCommentRequest":
            return checkDeleteBbsCommentRequest(
                request as v1.DeleteBbsCommentRequest
            );
        case "GetSubjectListRequest":
            return checkGetSubjectListRequest(
                request as v1.GetSubjectListRequest
            );
        case "GetIdbotChatRequest":
            return checkGetIdbotChatRequest(request as v1.GetIdbotChatRequest);
        case "GetMealRequest":
            return checkGetMealRequest(request as v1.GetMealRequest);
        case "PutMealRequest":
            return checkPutMealRequest(request as v1.PutMealRequest);
        case "GetApplyRequest":
            return checkGetApplyRequest(request as v1.GetApplyRequest);
        case "PostApplyRequest":
            return checkPostApplyRequest(request as v1.PostApplyRequest);
        case "DeleteApplyRequest":
            return checkDeleteApplyRequest(request as v1.DeleteApplyRequest);
        case "GetAttendanceInfoRequest":
            return checkGetAttendanceInfoRequest(
                request as v1.GetAttendanceInfoRequest
            );
        case "GetAttendanceListRequest":
            return checkGetAttendanceListRequest(
                request as v1.GetAttendanceListRequest
            );
        case "GetInfoRequest":
            return checkGetInfoRequest(request as v1.GetInfoRequest);
        case "PutInfoRequest":
            return checkPutInfoRequest(request as v1.PutInfoRequest);
        case "GetManagerRequest":
            return checkGetManagerRequest(request as v1.GetManagerRequest);
        case "GetLocationInfoRequest":
            return checkGetLocationInfoRequest(
                request as v1.GetLocationInfoRequest
            );
        case "GetPurposeInfoRequest":
            return checkGetPurposeInfoRequest(
                request as v1.GetPurposeInfoRequest
            );
        case "GetStudentInfoRequest":
            return checkGetStudentInfoRequest(
                request as v1.GetStudentInfoRequest
            );
        case "GetTeacherInfoRequest":
            return checkGetTeacherInfoRequest(
                request as v1.GetTeacherInfoRequest
            );
        case "GetOuterStudentInfoRequest":
            return checkGetOuterStudentInfoRequest(
                request as v1.GetOuterStudentInfoRequest
            );
        case "PostOuterStudentInfoRequest":
            return checkPostOuterStudentInfoRequest(
                request as v1.PostOuterStudentInfoRequest
            );
        case "DeleteOuterStudentInfoRequest":
            return checkDeleteOuterStudentInfoRequest(
                request as v1.DeleteOuterStudentInfoRequest
            );
        case "GetTimetableRequest":
            return checkGetTimetableRequest(request as v1.GetTimetableRequest);
        case "PutTimetableRequest":
            return checkPutTimetableRequest(request as v1.PutTimetableRequest);
        case "GetMyPrivateInfoRequest":
            return checkGetMyPrivateInfoRequest(
                request as v1.GetMyPrivateInfoRequest
            );
        case "PutEmailRequest":
            return checkPutEmailRequest(request as v1.PutEmailRequest);
        case "PutPasswordRequest":
            return checkPutPasswordRequest(request as v1.PutPasswordRequest);
        case "PostPushRequest":
            return checkPostPushRequest(request as v1.PostPushRequest);
        case "PutPushRequest":
            return checkPutPushRequest(request as v1.PutPushRequest);
        case "DeletePushRequest":
            return checkDeletePushRequest(request as v1.DeletePushRequest);
    }
    return false;
};

const checkPostRegisterRequest = (request: v1.PostRegisterRequest): boolean => {
    if (
        typeof request.id != "string" ||
        typeof request.sid != "number" ||
        typeof request.name != "string" ||
        typeof request.email != "string" ||
        typeof request.password != "string"
    ) {
        return false;
    }
    return true;
};

const checkDeleteSecessionRequest = (
    request: v1.DeleteSecessionRequest
): boolean => {
    if (
        (request.uid != undefined && typeof request.uid != "number") ||
        (request.id != undefined && typeof request.id != "string") ||
        (request.name != undefined && typeof request.name != "string")
    ) {
        return false;
    }
    return true;
};

const checkPostLoginRequest = (request: v1.PostLoginRequest): boolean => {
    if (typeof request.id != "string" || typeof request.password != "string") {
        return false;
    }
    return true;
};

const checkDeleteLogoutRequest = (request: v1.DeleteLogoutRequest): boolean => {
    return true;
};

const checkPostRefreshRequest = (request: v1.PostRefreshRequest): boolean => {
    return true;
};

const checkPutForgotPasswordRequest = (
    request: v1.PutForgotPasswordRequest
): boolean => {
    if (typeof request.id != "string" || typeof request.email != "string") {
        return false;
    }
    return true;
};

const checkGetBbsPostListRequest = (
    request: v1.GetBbsPostListRequest
): boolean => {
    if (
        typeof request.board != "string" ||
        typeof request.postPage != "number" ||
        typeof request.postListSize != "number"
    ) {
        return false;
    }
    return true;
};

const checkGetBbsPostRequest = (request: v1.GetBbsPostRequest): boolean => {
    if (typeof request.board != "string" || typeof request.postId != "number") {
        return false;
    }
    return true;
};

const checkPostBbsPostRequest = (request: v1.PostBbsPostRequest): boolean => {
    if (
        typeof request.title != "string" ||
        typeof request.content != "string" ||
        typeof request.header != "string" ||
        typeof request.board != "string" ||
        typeof request.isPublic != "boolean"
    ) {
        return false;
    }
    return true;
};

const checkPutBbsPostRequest = (request: v1.PutBbsPostRequest): boolean => {
    if (
        typeof request.board != "string" ||
        typeof request.postId != "number" ||
        (request.title != undefined && typeof request.title != "string") ||
        (request.content != undefined && typeof request.content != "string") ||
        (request.header != undefined && typeof request.header != "string") ||
        (request.isPublic != undefined && typeof request.isPublic != "boolean")
    ) {
        return false;
    }
    return true;
};

const checkDeleteBbsPostRequest = (
    request: v1.DeleteBbsPostRequest
): boolean => {
    if (typeof request.board != "string" || typeof request.postId != "number") {
        return false;
    }
    return true;
};

const checkGetBbsPostHeaderRequest = (
    request: v1.GetBbsPostHeaderRequest
): boolean => {
    if (typeof request.board != "string") {
        return false;
    }
    return true;
};

const checkGetBbsCommentListRequest = (
    request: v1.GetBbsCommentListRequest
): boolean => {
    if (
        typeof request.board != "string" ||
        typeof request.postId != "number" ||
        typeof request.commentPage != "number" ||
        typeof request.commentListSize != "number"
    ) {
        return false;
    }
    return true;
};

const checkPostBbsCommentRequest = (
    request: v1.PostBbsCommentRequest
): boolean => {
    if (
        typeof request.board != "string" ||
        typeof request.postId != "number" ||
        typeof request.content != "string"
    ) {
        return false;
    }
    return true;
};

const checkDeleteBbsCommentRequest = (
    request: v1.DeleteBbsCommentRequest
): boolean => {
    if (
        typeof request.board != "string" ||
        typeof request.postId != "number" ||
        typeof request.commentId != "number"
    ) {
        return false;
    }
    return true;
};

const checkGetSubjectListRequest = (
    request: v1.GetSubjectListRequest
): boolean => {
    if (
        typeof request.grade != "number" ||
        typeof request.semester != "number"
    ) {
        return false;
    }
    return true;
};

const checkGetIdbotChatRequest = (request: v1.GetIdbotChatRequest): boolean => {
    if (typeof request.chatInput != "string") {
        return false;
    }
    return true;
};

const checkGetMealRequest = (request: v1.GetMealRequest): boolean => {
    if (typeof request.when != "string") {
        return false;
    }
    return true;
};

const checkMealInfo = (data: v1.MealInfo): boolean => {
    if (!Array.isArray(data.meals)) {
        return false;
    }
    for (const meal of data.meals) {
        if (typeof meal != "string") {
            return false;
        }
    }
    return true;
};

const checkPutMealRequest = (request: v1.PutMealRequest): boolean => {
    return (
        checkMealInfo(request.breakfast) &&
        checkMealInfo(request.lunch) &&
        checkMealInfo(request.dinner)
    );
};

const checkGetApplyRequest = (request: v1.GetApplyRequest): boolean => {
    if (typeof request.when != "number") {
        return false;
    }
    return true;
};

const checkUserInfo = (userInfo: v1.UserInfo) => {
    if (
        typeof userInfo.uid != "number" ||
        typeof userInfo.value != "string" ||
        typeof userInfo.name != "string"
    ) {
        return false;
    }
    return true;
};

const checkUserInfoArray = (userInfoArray: v1.UserInfo[]) => {
    if (!Array.isArray(userInfoArray)) {
        return false;
    }

    for (const userInfo of userInfoArray) {
        if (!checkUserInfo(userInfo)) {
            return false;
        }
    }
    return true;
};

const checkPostApplyRequest = (request: v1.PostApplyRequest): boolean => {
    if (
        typeof request.teacherUid != "number" ||
        !checkUserInfoArray(request.applicants) ||
        typeof request.location != "string" ||
        typeof request.purpose != "string" ||
        typeof request.when != "number"
    ) {
        return false;
    }
    return true;
};

const checkDeleteApplyRequest = (request: v1.DeleteApplyRequest): boolean => {
    if (typeof request.when != "number") {
        return false;
    }
    return true;
};

const checkGetAttendanceInfoRequest = (
    request: v1.GetAttendanceInfoRequest
): boolean => {
    return true;
};

const checkGetAttendanceListRequest = (
    request: v1.GetAttendanceListRequest
): boolean => {
    if (typeof request.when != "number") {
        return false;
    }
    return true;
};

const checkGetInfoRequest = (request: v1.GetInfoRequest): boolean => {
    return true;
};

const checkSpecialroomInfo = (specialroomInfo: v1.SpecialroomInfo) => {
    if (
        typeof specialroomInfo.applyId != "number" ||
        typeof specialroomInfo.state != "number" ||
        !checkUserInfo(specialroomInfo.master) ||
        !checkUserInfo(specialroomInfo.teacher) ||
        typeof specialroomInfo.applicants != "string" ||
        typeof specialroomInfo.location != "string" ||
        typeof specialroomInfo.purpose != "string" ||
        typeof specialroomInfo.when != "number"
    ) {
        return false;
    }
    return true;
};

const checkSpecialroomInfoArray = (
    specialroomInfoArray: v1.SpecialroomInfo[]
) => {
    if (!Array.isArray(specialroomInfoArray)) {
        return false;
    }
    for (const specialroomInfo of specialroomInfoArray) {
        if (!checkSpecialroomInfo(specialroomInfo)) {
            return false;
        }
    }
    return true;
};

const checkPutInfoRequest = (request: v1.PutInfoRequest): boolean => {
    if (!checkSpecialroomInfoArray(request.information)) {
        return false;
    }
    return true;
};

const checkGetManagerRequest = (request: v1.GetManagerRequest): boolean => {
    if (typeof request.when != "string") {
        return false;
    }
    return true;
};

const checkGetLocationInfoRequest = (
    request: v1.GetLocationInfoRequest
): boolean => {
    return true;
};

const checkGetPurposeInfoRequest = (
    request: v1.GetPurposeInfoRequest
): boolean => {
    return true;
};

const checkGetStudentInfoRequest = (
    request: v1.GetStudentInfoRequest
): boolean => {
    return true;
};

const checkGetTeacherInfoRequest = (
    request: v1.GetTeacherInfoRequest
): boolean => {
    return true;
};

const checkGetOuterStudentInfoRequest = (
    request: v1.GetOuterStudentInfoRequest
): boolean => {
    return true;
};

const checkOuterStudentInfo = (
    outerStudentInfo: v1.OuterStudentInfo
): boolean => {
    if (
        !checkUserInfo(outerStudentInfo.student) ||
        typeof outerStudentInfo.reason != "string" ||
        (outerStudentInfo.until != undefined &&
            typeof outerStudentInfo.until != "string")
    ) {
        return false;
    }
    return true;
};

const checkPostOuterStudentInfoRequest = (
    request: v1.PostOuterStudentInfoRequest
): boolean => {
    if (!checkOuterStudentInfo(request.outerStudentInfo)) {
        return false;
    }
    return true;
};

const checkDeleteOuterStudentInfoRequest = (
    request: v1.DeleteOuterStudentInfoRequest
): boolean => {
    if (typeof request.studentUid != "number") {
        return false;
    }
    return true;
};

const checkGetTimetableRequest = (request: v1.GetTimetableRequest): boolean => {
    if (typeof request.when != "string") {
        return false;
    }
    return true;
};

const checkTimetableCell = (timetableCell: v1.TimetableCell) => {
    if (
        typeof timetableCell.key != "string" ||
        typeof timetableCell.value != "string"
    ) {
        return false;
    }
    return true;
};

const checkTimetableCellArray = (timetableCellArray: v1.TimetableCell[]) => {
    if (!Array.isArray(timetableCellArray)) {
        return false;
    }
    for (const specialroomInfo of timetableCellArray) {
        if (!checkTimetableCell(specialroomInfo)) {
            return false;
        }
    }
    return true;
};

const checkPutTimetableRequest = (request: v1.PutTimetableRequest): boolean => {
    if (
        typeof request.when != "string" ||
        !checkTimetableCellArray(request.timetableInfo)
    ) {
        return false;
    }
    return true;
};

const checkGetMyPrivateInfoRequest = (
    request: v1.GetMyPrivateInfoRequest
): boolean => {
    return true;
};

const checkPutEmailRequest = (request: v1.PutEmailRequest): boolean => {
    if (
        typeof request.oldEmail != "string" ||
        typeof request.newEmail != "string"
    ) {
        return false;
    }
    return true;
};

const checkPutPasswordRequest = (request: v1.PutPasswordRequest): boolean => {
    if (
        typeof request.oldPassword != "string" ||
        typeof request.newPassword != "string"
    ) {
        return false;
    }
    return true;
};

const checkNotification = (notification: any): boolean => {
    if (
        typeof notification.title != "string" ||
        typeof notification.body != "string" ||
        (notification.link != undefined && typeof notification.link != "string")
    ) {
        return false;
    }
    return true;
};

const checkPostPushRequest = (request: v1.PostPushRequest): boolean => {
    if (
        typeof request.targetUid != "number" ||
        !checkNotification(request.notification)
    ) {
        return false;
    }
    return true;
};

const checkPutPushRequest = (request: v1.PutPushRequest): boolean => {
    if (
        typeof request.pushToken != "string" ||
        typeof request.deviceId != "string"
    ) {
        return false;
    }
    return true;
};

const checkDeletePushRequest = (request: v1.DeletePushRequest): boolean => {
    if (typeof request.devcieId != "string") {
        return false;
    }
    return true;
};
