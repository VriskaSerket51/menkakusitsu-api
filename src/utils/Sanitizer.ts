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

export const sanitizeRequest = (request: unknown, type: RequestType): boolean => {
    switch (type) {
        case "PostRegisterRequest":
            return sanitizePostRegisterRequest(request as v1.PostRegisterRequest);
        case "DeleteSecessionRequest":
            return sanitizeDeleteSecessionRequest(
                request as v1.DeleteSecessionRequest
            );
        case "PostLoginRequest":
            return sanitizePostLoginRequest(request as v1.PostLoginRequest);
        case "DeleteLogoutRequest":
            return sanitizeDeleteLogoutRequest(request as v1.DeleteLogoutRequest);
        case "PostRefreshRequest":
            return sanitizePostRefreshRequest(request as v1.PostRefreshRequest);
        case "PutForgotPasswordRequest":
            return sanitizePutForgotPasswordRequest(
                request as v1.PutForgotPasswordRequest
            );
        case "GetBbsPostListRequest":
            return sanitizeGetBbsPostListRequest(
                request as v1.GetBbsPostListRequest
            );
        case "GetBbsPostRequest":
            return sanitizeGetBbsPostRequest(request as v1.GetBbsPostRequest);
        case "PostBbsPostRequest":
            return sanitizePostBbsPostRequest(request as v1.PostBbsPostRequest);
        case "PutBbsPostRequest":
            return sanitizePutBbsPostRequest(request as v1.PutBbsPostRequest);
        case "DeleteBbsPostRequest":
            return sanitizeDeleteBbsPostRequest(
                request as v1.DeleteBbsPostRequest
            );
        case "GetBbsPostHeaderRequest":
            return sanitizeGetBbsPostHeaderRequest(
                request as v1.GetBbsPostHeaderRequest
            );
        case "GetBbsCommentListRequest":
            return sanitizeGetBbsCommentListRequest(
                request as v1.GetBbsCommentListRequest
            );
        case "PostBbsCommentRequest":
            return sanitizePostBbsCommentRequest(
                request as v1.PostBbsCommentRequest
            );
        case "DeleteBbsCommentRequest":
            return sanitizeDeleteBbsCommentRequest(
                request as v1.DeleteBbsCommentRequest
            );
        case "GetSubjectListRequest":
            return sanitizeGetSubjectListRequest(
                request as v1.GetSubjectListRequest
            );
        case "GetIdbotChatRequest":
            return sanitizeGetIdbotChatRequest(request as v1.GetIdbotChatRequest);
        case "GetMealRequest":
            return sanitizeGetMealRequest(request as v1.GetMealRequest);
        case "PutMealRequest":
            return sanitizePutMealRequest(request as v1.PutMealRequest);
        case "GetApplyRequest":
            return sanitizeGetApplyRequest(request as v1.GetApplyRequest);
        case "PostApplyRequest":
            return sanitizePostApplyRequest(request as v1.PostApplyRequest);
        case "DeleteApplyRequest":
            return sanitizeDeleteApplyRequest(request as v1.DeleteApplyRequest);
        case "GetAttendanceInfoRequest":
            return sanitizeGetAttendanceInfoRequest(
                request as v1.GetAttendanceInfoRequest
            );
        case "GetAttendanceListRequest":
            return sanitizeGetAttendanceListRequest(
                request as v1.GetAttendanceListRequest
            );
        case "GetInfoRequest":
            return sanitizeGetInfoRequest(request as v1.GetInfoRequest);
        case "PutInfoRequest":
            return sanitizePutInfoRequest(request as v1.PutInfoRequest);
        case "GetManagerRequest":
            return sanitizeGetManagerRequest(request as v1.GetManagerRequest);
        case "GetLocationInfoRequest":
            return sanitizeGetLocationInfoRequest(
                request as v1.GetLocationInfoRequest
            );
        case "GetPurposeInfoRequest":
            return sanitizeGetPurposeInfoRequest(
                request as v1.GetPurposeInfoRequest
            );
        case "GetStudentInfoRequest":
            return sanitizeGetStudentInfoRequest(
                request as v1.GetStudentInfoRequest
            );
        case "GetTeacherInfoRequest":
            return sanitizeGetTeacherInfoRequest(
                request as v1.GetTeacherInfoRequest
            );
        case "GetOuterStudentInfoRequest":
            return sanitizeGetOuterStudentInfoRequest(
                request as v1.GetOuterStudentInfoRequest
            );
        case "PostOuterStudentInfoRequest":
            return sanitizePostOuterStudentInfoRequest(
                request as v1.PostOuterStudentInfoRequest
            );
        case "DeleteOuterStudentInfoRequest":
            return sanitizeDeleteOuterStudentInfoRequest(
                request as v1.DeleteOuterStudentInfoRequest
            );
        case "GetTimetableRequest":
            return sanitizeGetTimetableRequest(request as v1.GetTimetableRequest);
        case "PutTimetableRequest":
            return sanitizePutTimetableRequest(request as v1.PutTimetableRequest);
        case "GetMyPrivateInfoRequest":
            return sanitizeGetMyPrivateInfoRequest(
                request as v1.GetMyPrivateInfoRequest
            );
        case "PutEmailRequest":
            return sanitizePutEmailRequest(request as v1.PutEmailRequest);
        case "PutPasswordRequest":
            return sanitizePutPasswordRequest(request as v1.PutPasswordRequest);
        case "PostPushRequest":
            return sanitizePostPushRequest(request as v1.PostPushRequest);
        case "PutPushRequest":
            return sanitizePutPushRequest(request as v1.PutPushRequest);
        case "DeletePushRequest":
            return sanitizeDeletePushRequest(request as v1.DeletePushRequest);
    }
    return false;
};

const sanitizePostRegisterRequest = (request: v1.PostRegisterRequest): boolean => {
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

const sanitizeDeleteSecessionRequest = (
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

const sanitizePostLoginRequest = (request: v1.PostLoginRequest): boolean => {
    if (typeof request.id != "string" || typeof request.password != "string") {
        return false;
    }
    return true;
};

const sanitizeDeleteLogoutRequest = (request: v1.DeleteLogoutRequest): boolean => {
    return true;
};

const sanitizePostRefreshRequest = (request: v1.PostRefreshRequest): boolean => {
    return true;
};

const sanitizePutForgotPasswordRequest = (
    request: v1.PutForgotPasswordRequest
): boolean => {
    if (typeof request.id != "string" || typeof request.email != "string") {
        return false;
    }
    return true;
};

const sanitizeGetBbsPostListRequest = (
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

const sanitizeGetBbsPostRequest = (request: v1.GetBbsPostRequest): boolean => {
    if (typeof request.board != "string" || typeof request.postId != "number") {
        return false;
    }
    return true;
};

const sanitizePostBbsPostRequest = (request: v1.PostBbsPostRequest): boolean => {
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

const sanitizePutBbsPostRequest = (request: v1.PutBbsPostRequest): boolean => {
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

const sanitizeDeleteBbsPostRequest = (
    request: v1.DeleteBbsPostRequest
): boolean => {
    if (typeof request.board != "string" || typeof request.postId != "number") {
        return false;
    }
    return true;
};

const sanitizeGetBbsPostHeaderRequest = (
    request: v1.GetBbsPostHeaderRequest
): boolean => {
    if (typeof request.board != "string") {
        return false;
    }
    return true;
};

const sanitizeGetBbsCommentListRequest = (
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

const sanitizePostBbsCommentRequest = (
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

const sanitizeDeleteBbsCommentRequest = (
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

const sanitizeGetSubjectListRequest = (
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

const sanitizeGetIdbotChatRequest = (request: v1.GetIdbotChatRequest): boolean => {
    if (typeof request.chatInput != "string") {
        return false;
    }
    return true;
};

const sanitizeGetMealRequest = (request: v1.GetMealRequest): boolean => {
    if (typeof request.when != "string") {
        return false;
    }
    return true;
};

const sanitizeMealInfo = (data: v1.MealInfo): boolean => {
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

const sanitizePutMealRequest = (request: v1.PutMealRequest): boolean => {
    return (
        sanitizeMealInfo(request.breakfast) &&
        sanitizeMealInfo(request.lunch) &&
        sanitizeMealInfo(request.dinner)
    );
};

const sanitizeGetApplyRequest = (request: v1.GetApplyRequest): boolean => {
    if (typeof request.when != "number") {
        return false;
    }
    return true;
};

const sanitizeUserInfo = (userInfo: v1.UserInfo) => {
    if (
        typeof userInfo.uid != "number" ||
        typeof userInfo.value != "string" ||
        typeof userInfo.name != "string"
    ) {
        return false;
    }
    return true;
};

const sanitizeUserInfoArray = (userInfoArray: v1.UserInfo[]) => {
    if (!Array.isArray(userInfoArray)) {
        return false;
    }

    for (const userInfo of userInfoArray) {
        if (!sanitizeUserInfo(userInfo)) {
            return false;
        }
    }
    return true;
};

const sanitizePostApplyRequest = (request: v1.PostApplyRequest): boolean => {
    if (
        typeof request.teacherUid != "number" ||
        !sanitizeUserInfoArray(request.applicants) ||
        typeof request.location != "string" ||
        typeof request.purpose != "string" ||
        typeof request.when != "number"
    ) {
        return false;
    }
    return true;
};

const sanitizeDeleteApplyRequest = (request: v1.DeleteApplyRequest): boolean => {
    if (typeof request.when != "number") {
        return false;
    }
    return true;
};

const sanitizeGetAttendanceInfoRequest = (
    request: v1.GetAttendanceInfoRequest
): boolean => {
    return true;
};

const sanitizeGetAttendanceListRequest = (
    request: v1.GetAttendanceListRequest
): boolean => {
    if (typeof request.when != "number") {
        return false;
    }
    return true;
};

const sanitizeGetInfoRequest = (request: v1.GetInfoRequest): boolean => {
    return true;
};

const sanitizeSpecialroomInfo = (specialroomInfo: v1.SpecialroomInfo) => {
    if (
        typeof specialroomInfo.applyId != "number" ||
        typeof specialroomInfo.state != "number" ||
        !sanitizeUserInfo(specialroomInfo.master) ||
        !sanitizeUserInfo(specialroomInfo.teacher) ||
        typeof specialroomInfo.applicants != "string" ||
        typeof specialroomInfo.location != "string" ||
        typeof specialroomInfo.purpose != "string" ||
        typeof specialroomInfo.when != "number"
    ) {
        return false;
    }
    return true;
};

const sanitizeSpecialroomInfoArray = (
    specialroomInfoArray: v1.SpecialroomInfo[]
) => {
    if (!Array.isArray(specialroomInfoArray)) {
        return false;
    }
    for (const specialroomInfo of specialroomInfoArray) {
        if (!sanitizeSpecialroomInfo(specialroomInfo)) {
            return false;
        }
    }
    return true;
};

const sanitizePutInfoRequest = (request: v1.PutInfoRequest): boolean => {
    if (!sanitizeSpecialroomInfoArray(request.information)) {
        return false;
    }
    return true;
};

const sanitizeGetManagerRequest = (request: v1.GetManagerRequest): boolean => {
    if (typeof request.when != "string") {
        return false;
    }
    return true;
};

const sanitizeGetLocationInfoRequest = (
    request: v1.GetLocationInfoRequest
): boolean => {
    return true;
};

const sanitizeGetPurposeInfoRequest = (
    request: v1.GetPurposeInfoRequest
): boolean => {
    return true;
};

const sanitizeGetStudentInfoRequest = (
    request: v1.GetStudentInfoRequest
): boolean => {
    return true;
};

const sanitizeGetTeacherInfoRequest = (
    request: v1.GetTeacherInfoRequest
): boolean => {
    return true;
};

const sanitizeGetOuterStudentInfoRequest = (
    request: v1.GetOuterStudentInfoRequest
): boolean => {
    return true;
};

const sanitizeOuterStudentInfo = (
    outerStudentInfo: v1.OuterStudentInfo
): boolean => {
    if (
        !sanitizeUserInfo(outerStudentInfo.student) ||
        typeof outerStudentInfo.reason != "string" ||
        (outerStudentInfo.until != undefined &&
            typeof outerStudentInfo.until != "string")
    ) {
        return false;
    }
    return true;
};

const sanitizePostOuterStudentInfoRequest = (
    request: v1.PostOuterStudentInfoRequest
): boolean => {
    if (!sanitizeOuterStudentInfo(request.outerStudentInfo)) {
        return false;
    }
    return true;
};

const sanitizeDeleteOuterStudentInfoRequest = (
    request: v1.DeleteOuterStudentInfoRequest
): boolean => {
    if (typeof request.studentUid != "number") {
        return false;
    }
    return true;
};

const sanitizeGetTimetableRequest = (request: v1.GetTimetableRequest): boolean => {
    if (typeof request.when != "string") {
        return false;
    }
    return true;
};

const sanitizeTimetableCell = (timetableCell: v1.TimetableCell) => {
    if (
        typeof timetableCell.key != "string" ||
        typeof timetableCell.value != "string"
    ) {
        return false;
    }
    return true;
};

const sanitizeTimetableCellArray = (timetableCellArray: v1.TimetableCell[]) => {
    if (!Array.isArray(timetableCellArray)) {
        return false;
    }
    for (const specialroomInfo of timetableCellArray) {
        if (!sanitizeTimetableCell(specialroomInfo)) {
            return false;
        }
    }
    return true;
};

const sanitizePutTimetableRequest = (request: v1.PutTimetableRequest): boolean => {
    if (
        typeof request.when != "string" ||
        !sanitizeTimetableCellArray(request.timetableInfo)
    ) {
        return false;
    }
    return true;
};

const sanitizeGetMyPrivateInfoRequest = (
    request: v1.GetMyPrivateInfoRequest
): boolean => {
    return true;
};

const sanitizePutEmailRequest = (request: v1.PutEmailRequest): boolean => {
    if (
        typeof request.oldEmail != "string" ||
        typeof request.newEmail != "string"
    ) {
        return false;
    }
    return true;
};

const sanitizePutPasswordRequest = (request: v1.PutPasswordRequest): boolean => {
    if (
        typeof request.oldPassword != "string" ||
        typeof request.newPassword != "string"
    ) {
        return false;
    }
    return true;
};

const sanitizeNotification = (notification: any): boolean => {
    if (
        typeof notification.title != "string" ||
        typeof notification.body != "string" ||
        (notification.link != undefined && typeof notification.link != "string")
    ) {
        return false;
    }
    return true;
};

const sanitizePostPushRequest = (request: v1.PostPushRequest): boolean => {
    if (
        typeof request.targetUid != "number" ||
        !sanitizeNotification(request.notification)
    ) {
        return false;
    }
    return true;
};

const sanitizePutPushRequest = (request: v1.PutPushRequest): boolean => {
    if (
        typeof request.pushToken != "string" ||
        typeof request.deviceId != "string"
    ) {
        return false;
    }
    return true;
};

const sanitizeDeletePushRequest = (request: v1.DeletePushRequest): boolean => {
    if (typeof request.devcieId != "string") {
        return false;
    }
    return true;
};
