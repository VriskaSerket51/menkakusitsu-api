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
                path: "/post/list",
                authType: "access",
                controller: Bbs.onGetBbsPostList,
            },
            {
                method: "get",
                path: "/post",
                authType: "access",
                controller: Bbs.onGetBbsPost,
            },
            {
                method: "post",
                path: "/post",
                authType: "access",
                controller: Bbs.onPostBbsPost,
            },
            {
                method: "delete",
                path: "/post",
                authType: "access",
                controller: Bbs.onDeleteBbsPost,
            },
            {
                method: "get",
                path: "/post/headers",
                authType: "access",
                controller: Bbs.onGetBbsPostHeaders,
            },
            {
                method: "get",
                path: "/comment/list",
                authType: "access",
                controller: Bbs.onGetBbsCommentList,
            },
            {
                method: "post",
                path: "/comment",
                authType: "access",
                controller: Bbs.onPostBbsComment,
            },
            {
                method: "delete",
                path: "/comment",
                authType: "access",
                controller: Bbs.onDeleteBbsComment,
            },
        ];
    }

    static async onGetBbsPostList(req: Request, res: Response) {
        try {
            const request: v1.GetBbsPostListRequest = req.query as any;
            if (
                request.postListSize === undefined ||
                request.postPage === undefined
            ) {
                throw new HttpException(400);
            }
            const getPostsCountQuery = await query(
                "SELECT COUNT(*) as cnt FROM bbs_post WHERE deletedDate IS NULL",
                []
            );
            const postsCount: number = getPostsCountQuery[0].cnt;
            const offset = (request.postPage - 1) * request.postListSize;
            const getPostListQuery = await query(
                "SELECT * FROM bbs_post WHERE deletedDate IS NULL ORDER BY `type` ASC, id DESC LIMIT ?, ?",
                [offset, Number(request.postListSize)]
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
                "SELECT postId, COUNT(id) as cnt FROM bbs_comment WHERE deletedDate IS NULL group by postId",
                []
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
                    postType: postData.type,
                    commentCount: getCommentCount(postData.id),
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
            const request: v1.GetBbsPostRequest = req.query as any;
            if (request.id === undefined) {
                throw new HttpException(400);
            }
            const getbbsPostQuery = await query(
                "SELECT * FROM bbs_post WHERE id=? AND deletedDate IS NULL",
                [request.id]
            );
            if (!getbbsPostQuery || getbbsPostQuery.length === 0) {
                throw new ResponseException(
                    -1,
                    "삭제됐거나 존재하지 않는 게시글입니다."
                );
            }
            const postData = getbbsPostQuery[0];
            const owner = await getStudentInfo(postData.ownerUid);
            if (!owner) {
                throw new HttpException(500);
            }

            const getCommentCountQuery = await query(
                "SELECT COUNT(*) as cnt FROM bbs_comment WHERE deletedDate IS NULL AND postId=?",
                [postData.id]
            );

            if (!getCommentCountQuery || getCommentCountQuery.length === 0) {
                throw new HttpException(500);
            }

            const post: v1.BbsPost = {
                id: postData.id,
                owner: owner,
                title: postData.title,
                content: postData.content,
                header: postData.header,
                postType: postData.type,
                commentCount: getCommentCountQuery[0].cnt,
                createdDate: postData.createdDate,
            };
            const response: v1.GetBbsPostResponse = {
                status: 0,
                message: "",
                post: post,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPostBbsPost(req: Request, res: Response) {
        try {
            // throw new ResponseException(-1, "현재 글을 작성하실 수 없습니다.");
            const request: v1.PostBbsPostRequest = req.body;
            if (!request.title || !request.content) {
                throw new HttpException(400);
            }
            if (request.title.length > 20) {
                request.title.substring(0, 20);
            }
            if (request.content.length > 500) {
                request.content.substring(0, 500);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            await execute(
                "INSERT INTO bbs_post(ownerUid, title, content, createdDate) VALUE(?, ?, ?, NOW())",
                [payload.uid, request.title, request.content]
            );
            const response: v1.PostBbsPostResponse = {
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
            const request: v1.DeleteBbsPostRequest = req.body;
            if (request.id === undefined) {
                throw new HttpException(400);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            const getbbsPostQuery = await query(
                "SELECT * FROM bbs_post WHERE id=? AND deletedDate IS NULL",
                [request.id]
            );
            if (!getbbsPostQuery || getbbsPostQuery.length === 0) {
                throw new ResponseException(
                    -1,
                    "삭제됐거나 존재하지 않는 게시글입니다."
                );
            }
            if (getbbsPostQuery[0].ownerUid !== payload.uid && !payload.isDev) {
                throw new HttpException(403);
            }
            await execute("UPDATE bbs_post SET deletedDate=NOW() WHERE id=?", [
                request.id,
            ]);
            await execute(
                "UPDATE bbs_comment SET deletedDate=NOW() WHERE postId=?",
                [request.id]
            );
            const response: v1.DeleteBbsPostResponse = {
                status: 0,
                message: "",
                // post: post,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetBbsPostHeaders(req: Request, res: Response) {
        try {
            const request: v1.GetBbsPostHeaderRequest = req.query as any;
            const response: v1.GetBbsPostHeaderResponse = {
                status: 0,
                message: "",
                headers: [
                    "[버그 제보]",
                    "[기능 추가]",
                    "[수정 예정]",
                    "[수정 불가]",
                    "[추가 예정]",
                    "[추가 불가]",
                ],
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetBbsCommentList(req: Request, res: Response) {
        try {
            const request: v1.GetBbsCommentListRequest = req.query as any;
            if (
                request.postId === undefined ||
                request.commentListSize === undefined ||
                request.commentPage === undefined
            ) {
                throw new HttpException(400);
            }
            const getPostsCountQuery = await query(
                "SELECT COUNT(*) as cnt FROM bbs_comment WHERE postId=? AND deletedDate IS NULL",
                [request.postId]
            );
            const commentCount: number = getPostsCountQuery[0].cnt;
            const offset = (request.commentPage - 1) * request.commentListSize;
            const getCommentListQuery = await query(
                "SELECT * FROM bbs_comment WHERE postId=? AND deletedDate IS NULL ORDER BY id DESC LIMIT ?, ?",
                [request.postId, offset, Number(request.commentListSize)]
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
            const request: v1.PostBbsCommentRequest = req.body;
            if (request.postId === undefined || !request.content) {
                throw new HttpException(400);
            }
            if (request.content.length > 300) {
                request.content.substring(0, 300);
            }
            const getbbsPostQuery = await query(
                "SELECT * FROM bbs_post WHERE id=? AND deletedDate IS NULL",
                [request.postId]
            );
            if (!getbbsPostQuery || getbbsPostQuery.length === 0) {
                throw new ResponseException(
                    -1,
                    "삭제됐거나 존재하지 않는 게시글입니다."
                );
            }
            const payload = getJwtPayload(req.headers.authorization!);
            await execute(
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
                // post: post,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onDeleteBbsComment(req: Request, res: Response) {
        try {
            const request: v1.DeleteBbsCommentRequest = req.body;
            if (request.id === undefined) {
                throw new HttpException(400);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            const getbbsPostQuery = await query(
                "SELECT * FROM bbs_comment WHERE id=? AND deletedDate IS NULL",
                [request.id]
            );
            if (!getbbsPostQuery || getbbsPostQuery.length === 0) {
                throw new ResponseException(
                    -1,
                    "삭제됐거나 존재하지 않는 게시글입니다."
                );
            }
            if (getbbsPostQuery[0].ownerUid !== payload.uid && !payload.isDev) {
                throw new HttpException(403);
            }
            await execute(
                "UPDATE bbs_comment SET deletedDate=NOW() WHERE id=?",
                [request.id]
            );
            const response: v1.DeleteBbsCommentResponse = {
                status: 0,
                message: "",
                // post: post,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }
}

export default Bbs;
