import { Request, Response } from "express";
import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import V1 from "..";
import { execute, query } from "../../../mysql";
import { ResponseException, HttpException } from "../../../exceptions";
import { defaultErrorHandler } from "../../../utils/ErrorHandler";
import {
    getJwtPayload,
    getStudentInfo,
    getUserInfo,
    sendPushToUser,
} from "../../../utils/Utility";
import config from "../../../config";

class Bbs extends V1 {
    constructor() {
        super();
        this.setPath("/bbs");
        this.models = [
            {
                method: "get",
                path: "/:board/list",
                authType: "access",
                controller: Bbs.onGetBbsPostList,
            },
            {
                method: "get",
                path: "/:board/:postId(\\d+)",
                authType: "access",
                controller: Bbs.onGetBbsPost,
            },
            {
                method: "post",
                path: "/:board",
                authType: "access",
                controller: Bbs.onPostBbsPost,
            },
            {
                method: "put",
                path: "/:board/:postId(\\d+)",
                authType: "access",
                controller: Bbs.onPutBbsPost,
            },
            {
                method: "delete",
                path: "/:board/:postId(\\d+)",
                authType: "access",
                controller: Bbs.onDeleteBbsPost,
            },
            {
                method: "get",
                path: "/:board/headers",
                authType: "access",
                controller: Bbs.onGetBbsPostHeaders,
            },
            {
                method: "get",
                path: "/:board/:postId(\\d+)/list",
                authType: "access",
                controller: Bbs.onGetBbsCommentList,
            },
            {
                method: "post",
                path: "/:board/:postId(\\d+)",
                authType: "access",
                controller: Bbs.onPostBbsComment,
            },
            {
                method: "delete",
                path: "/:board/:postId(\\d+)/:commentId(\\d+)",
                authType: "access",
                controller: Bbs.onDeleteBbsComment,
            },
        ];
    }

    static async getBbsPost(board: string, postId: number) {
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
    }

    static async onGetBbsPostList(req: Request, res: Response) {
        try {
            const request: v1.GetBbsPostListRequest = Object.assign(
                req.query as any,
                req.params
            );
            if (
                !request.board ||
                request.postListSize === undefined ||
                request.postPage === undefined
            ) {
                throw new HttpException(400);
            }
            const getPostsCountQuery = await query(
                "SELECT COUNT(*) as cnt FROM bbs_post WHERE deletedDate IS NULL AND board=? ",
                [request.board]
            );
            const postsCount: number = getPostsCountQuery[0].cnt;
            const offset = (request.postPage - 1) * request.postListSize;
            const getPostListQuery = await query(
                "SELECT * FROM bbs_post WHERE deletedDate IS NULL AND board=? ORDER BY `type` ASC, id DESC LIMIT ?, ?",
                [request.board, offset, Number(request.postListSize)]
            );

            const userInfo = await getUserInfo();
            const findUser = (uid: number) => {
                for (const info of userInfo) {
                    if (info.uid === uid) {
                        return info;
                    }
                }
                return null;
            };

            const getCommentCountQuery = await query(
                "SELECT postId, COUNT(id) as cnt FROM bbs_comment WHERE deletedDate IS NULL AND board=? group by postId",
                [request.board]
            );
            const getCommentCount = (postId: number) => {
                for (const commentCountQuery of getCommentCountQuery) {
                    if (commentCountQuery.postId == postId) {
                        return Number(commentCountQuery.cnt);
                    }
                }
                return 0;
            };

            const posts: v1.BbsPost[] = [];

            for (const postData of getPostListQuery) {
                const owner = findUser(postData.ownerUid);
                if (!owner) {
                    throw new HttpException(500);
                }
                posts.push({
                    id: postData.id,
                    owner: owner,
                    title: postData.title,
                    content: "",
                    header: postData.header,
                    board: postData.board,
                    postType: postData.type,
                    commentCount: getCommentCount(postData.id),
                    isPublic: postData.isPublic == 1,
                    createdDate: postData.createdDate,
                });
            }

            const response: v1.GetBbsPostListResponse = {
                status: 0,
                message: "",
                list: posts,
                postCount: postsCount,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetBbsPost(req: Request, res: Response) {
        try {
            const request: v1.GetBbsPostRequest = Object.assign(
                req.query as any,
                req.params
            );
            if (!request.board || request.postId === undefined) {
                throw new HttpException(400);
            }
            const getbbsPostQuery = await Bbs.getBbsPost(
                request.board,
                request.postId
            );
            const postData = getbbsPostQuery[0];
            const owner = await getStudentInfo(postData.ownerUid);
            if (!owner) {
                throw new HttpException(500);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            if (
                !postData.isPublic &&
                owner.uid != payload.uid &&
                !payload.isDev
            ) {
                throw new ResponseException(
                    -2,
                    "관리자나 작성자 본인만 확인할 수 있습니다."
                );
            }
            const getCommentCountQuery = await query(
                "SELECT COUNT(*) as cnt FROM bbs_comment WHERE deletedDate IS NULL AND board=? AND postId=?",
                [postData.board, postData.id]
            );

            if (!getCommentCountQuery || getCommentCountQuery.length === 0) {
                throw new HttpException(500);
            }

            const getAttachmentsQuery = await query(
                "SELECT * FROM bbs_file WHERE postId=?",
                request.postId
            );

            const post: v1.BbsPost = {
                id: postData.id,
                owner: owner,
                title: postData.title,
                content: postData.content,
                header: postData.header,
                board: postData.board,
                postType: postData.type,
                commentCount: getCommentCountQuery[0].cnt,
                isPublic: postData.isPublic == 1,
                createdDate: postData.createdDate,
            };

            const attactments: v1.FileInfo[] = [];

            if (getAttachmentsQuery && getAttachmentsQuery.length > 0) {
                for (const attachment of getAttachmentsQuery) {
                    attactments.push({
                        fileName: attachment.fileName,
                        downloadLink: attachment.downloadLink,
                        isImage: attachment.isImage == 1,
                        owne: {
                            uid: payload.uid,
                            name: "",
                            value: "",
                        },
                    });
                }
            }

            const response: v1.GetBbsPostResponse = {
                status: 0,
                message: "",
                post: post,
                attachments: attactments,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPostBbsPost(req: Request, res: Response) {
        try {
            // throw new ResponseException(-1, "현재 글을 작성하실 수 없습니다.");
            const request: v1.PostBbsPostRequest = Object.assign(
                req.body,
                req.params
            );
            if (
                !request.title ||
                !request.content ||
                !request.header ||
                !request.board
            ) {
                throw new HttpException(400);
            }
            if (request.title.length > 20) {
                request.title.substring(0, 30);
            }
            if (request.content.length > 500) {
                request.content.substring(0, 500);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            const result = await execute(
                "INSERT INTO bbs_post(ownerUid, title, content, header, board, isPublic, createdDate) VALUE(?, ?, ?, ?, ?, ?, NOW())",
                [
                    payload.uid,
                    request.title,
                    request.content,
                    request.header,
                    request.board,
                    request.isPublic,
                ]
            );
            const response: v1.PostBbsPostResponse = {
                status: 0,
                message: "",
                postId: result.insertId,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPutBbsPost(req: Request, res: Response) {
        try {
            // throw new ResponseException(-1, "현재 글을 작성하실 수 없습니다.");
            const request: v1.PutBbsPostRequest = Object.assign(
                req.body,
                req.params
            );
            if (
                request.postId === undefined ||
                !request.board ||
                !request.title ||
                !request.content ||
                !request.header ||
                request.isPublic === undefined
            ) {
                throw new HttpException(400);
            }
            if (request.title.length > 20) {
                request.title.substring(0, 30);
            }
            if (request.content.length > 500) {
                request.content.substring(0, 500);
            }
            const getbbsPostQuery = await Bbs.getBbsPost(
                request.board,
                request.postId
            );
            const payload = getJwtPayload(req.headers.authorization!);
            if (payload.uid != getbbsPostQuery[0].ownerUid && !payload.isDev) {
                throw new HttpException(403);
            }
            await execute(
                "UPDATE bbs_post SET title=?, content=?, header=?, isPublic=? WHERE board=? AND id=?",
                [
                    request.title,
                    request.content,
                    request.header,
                    request.isPublic,
                    request.board,
                    request.postId,
                ]
            );
            const response: v1.PutBbsPostResponse = {
                status: 0,
                message: "",
                // post: post,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onDeleteBbsPost(req: Request, res: Response) {
        try {
            const request: v1.DeleteBbsPostRequest = Object.assign(
                req.body,
                req.params
            );
            if (!request.board || request.postId === undefined) {
                throw new HttpException(400);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            const getbbsPostQuery = await Bbs.getBbsPost(
                request.board,
                request.postId
            );
            if (getbbsPostQuery[0].ownerUid !== payload.uid && !payload.isDev) {
                throw new HttpException(403);
            }
            await execute(
                "UPDATE bbs_post SET deletedDate=NOW() WHERE board=? AND id=?",
                [request.board, request.postId]
            );
            await execute(
                "UPDATE bbs_comment SET deletedDate=NOW() WHERE board=? AND postId=?",
                [request.board, request.postId]
            );
            const response: v1.DeleteBbsPostResponse = {
                status: 0,
                message: "",
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetBbsPostHeaders(req: Request, res: Response) {
        try {
            const request: v1.GetBbsPostHeaderRequest = Object.assign(
                req.query as any,
                req.params
            );
            const headers = [];
            const payload = getJwtPayload(req.headers.authorization!);
            switch (request.board) {
                case "feedback":
                    headers.push("[버그 제보]", "[기능 추가]");
                    if (payload.isDev) {
                        headers.push(
                            "[공지 사항]",
                            "[수정 예정]",
                            "[수정 불가]",
                            "[수정 계획 없음]",
                            "[수정 완료]",
                            "[추가 예정]",
                            "[추가 불가]",
                            "[추가 계획 없음]",
                            "[추가 완료]"
                        );
                    }
                    break;
            }
            const response: v1.GetBbsPostHeaderResponse = {
                status: 0,
                message: "",
                headers: headers,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetBbsCommentList(req: Request, res: Response) {
        try {
            const request: v1.GetBbsCommentListRequest = Object.assign(
                req.query as any,
                req.params
            );
            if (
                request.postId === undefined ||
                !request.board ||
                request.commentListSize === undefined ||
                request.commentPage === undefined
            ) {
                throw new HttpException(400);
            }
            const getPostsCountQuery = await query(
                "SELECT COUNT(*) as cnt FROM bbs_comment WHERE deletedDate IS NULL AND board=? AND postId=?",
                [request.board, request.postId]
            );
            const commentCount: number = getPostsCountQuery[0].cnt;
            const offset = (request.commentPage - 1) * request.commentListSize;
            const getCommentListQuery = await query(
                "SELECT * FROM bbs_comment WHERE deletedDate IS NULL AND board=? AND postId=? ORDER BY id DESC LIMIT ?, ?",
                [
                    request.board,
                    request.postId,
                    offset,
                    Number(request.commentListSize),
                ]
            );

            const userInfo = await getUserInfo();
            const findUser = (uid: number) => {
                for (const info of userInfo) {
                    if (info.uid === uid) {
                        return info;
                    }
                }
                return null;
            };

            const comments: v1.BbsComment[] = [];

            for (const commentData of getCommentListQuery) {
                const owner = findUser(commentData.ownerUid);
                if (!owner) {
                    throw new HttpException(500);
                }
                comments.push({
                    id: commentData.id,
                    owner: owner,
                    content: commentData.content,
                    createdDate: commentData.createdDate,
                });
            }

            const response: v1.GetBbsCommentListResponse = {
                status: 0,
                message: "",
                list: comments,
                commentCount: commentCount,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPostBbsComment(req: Request, res: Response) {
        try {
            const request: v1.PostBbsCommentRequest = Object.assign(
                req.body,
                req.params
            );
            if (request.postId === undefined || !request.content) {
                throw new HttpException(400);
            }
            if (request.content.length > 300) {
                request.content.substring(0, 300);
            }
            const getbbsPostQuery = await Bbs.getBbsPost(
                request.board,
                request.postId
            );
            const payload = getJwtPayload(req.headers.authorization!);
            const result = await execute(
                "INSERT INTO bbs_comment(ownerUid, postId, content, createdDate) VALUE(?, ?, ?, NOW())",
                [payload.uid, request.postId, request.content]
            );
            sendPushToUser(
                getbbsPostQuery[0].ownerUid,
                `댓글이 달렸습니다!`,
                request.content,
                `${config.webPrefix}/bbs/post/${request.postId}`
            );
            const response: v1.PostBbsCommentResponse = {
                status: 0,
                message: "",
                commentId: result.insertId,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onDeleteBbsComment(req: Request, res: Response) {
        try {
            const request: v1.DeleteBbsCommentRequest = Object.assign(
                req.body,
                req.params
            );
            if (!request.board || request.postId === undefined) {
                throw new HttpException(400);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            const getbbsPostQuery = await Bbs.getBbsPost(
                request.board,
                request.postId
            );
            if (getbbsPostQuery[0].ownerUid !== payload.uid && !payload.isDev) {
                throw new HttpException(403);
            }
            await execute(
                "UPDATE bbs_comment SET deletedDate=NOW() WHERE board=? AND postId=? AND id=?",
                [request.board, request.postId, request.commentId]
            );
            const response: v1.DeleteBbsCommentResponse = {
                status: 0,
                message: "",
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }
}

export default Bbs;
