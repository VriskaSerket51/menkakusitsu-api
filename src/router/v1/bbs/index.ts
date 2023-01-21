import { Request, Response } from "express";
import { v1 } from "@common-jshs/menkakusitsu-lib";
import V1 from "..";
import { execute, query } from "../../../mysql";
import { ResponseException, HttpException } from "../../../exceptions";
import { getJwtPayload } from "../../../utils";
import config from "../../../config";
import {
    getUserInfoList,
    sendPushToUser,
    getBbsPost,
    getBbsComment,
    findUserByUid,
    getUserInfo,
    handleFiles,
} from "../../../utils/Api";
import { Permission } from "@common-jshs/menkakusitsu-lib";

class Bbs extends V1 {
    constructor() {
        super();
        this.setPath("/bbs");
        this.models = [
            {
                method: "get",
                path: "/post/list",
                authType: "access",
                controller: this.onGetBbsPostList,
            },
            {
                method: "get",
                path: "/post",
                authType: "access",
                controller: this.onGetBbsPost,
            },
            {
                method: "post",
                path: "/post",
                authType: "access",
                controller: this.onPostBbsPost,
            },
            {
                method: "put",
                path: "/post",
                authType: "access",
                controller: this.onPutBbsPost,
            },
            {
                method: "delete",
                path: "/post",
                authType: "access",
                controller: this.onDeleteBbsPost,
            },
            {
                method: "get",
                path: "/post/headers",
                authType: "access",
                controller: this.onGetBbsPostHeaders,
            },
            {
                method: "get",
                path: "/comment/list",
                authType: "access",
                controller: this.onGetBbsCommentList,
            },
            {
                method: "post",
                path: "/comment",
                authType: "access",
                controller: this.onPostBbsComment,
            },
            {
                method: "delete",
                path: "/comment",
                authType: "access",
                controller: this.onDeleteBbsComment,
            },
        ];
    }

    async onGetBbsPostList(req: Request, res: Response) {
        const request: v1.GetBbsPostListRequest = req.query as any;
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

        const userInfo = await getUserInfoList();

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
            const owner = findUserByUid(userInfo, postData.ownerUid);
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
    }

    async onGetBbsPost(req: Request, res: Response) {
        const request: v1.GetBbsPostRequest = req.query as any;
        if (!request.board || request.postId === undefined) {
            throw new HttpException(400);
        }
        const getbbsPostQuery = await getBbsPost(request.board, request.postId);
        const postData = getbbsPostQuery[0];
        const owner = await getUserInfo(postData.ownerUid);
        const payload = getJwtPayload(req.headers.authorization!);
        if (
            !postData.isPublic &&
            owner.uid != payload.uid &&
            !payload.hasPermission(Permission.Dev)
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
                    isImage: (attachment.mimeType as string).startsWith(
                        "image"
                    ),
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
    }

    async onPostBbsPost(req: Request, res: Response) {
        // throw new ResponseException(-1, "현재 글을 작성하실 수 없습니다.");
        const props = req.body.props;
        if (!props) {
            throw new HttpException(400);
        }
        const request: v1.PostBbsPostRequest = JSON.parse(props);
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
        const postId = result.insertId;
        const response: v1.PostBbsPostResponse = {
            status: 0,
            message: "",
            postId: postId,
        };
        if (req.files && req.files.data) {
            const data = req.files.data;
            const files = Array.isArray(data) ? data : [data];
            await handleFiles(files, payload.uid, postId);
        }
        res.status(200).json(response);
    }

    async onPutBbsPost(req: Request, res: Response) {
        // throw new ResponseException(-1, "현재 글을 작성하실 수 없습니다.");
        const request: v1.PutBbsPostRequest = req.body;
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
        const getbbsPostQuery = await getBbsPost(request.board, request.postId);
        const payload = getJwtPayload(req.headers.authorization!);
        if (
            payload.uid != getbbsPostQuery[0].ownerUid &&
            !payload.hasPermission(Permission.Dev)
        ) {
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
    }

    async onDeleteBbsPost(req: Request, res: Response) {
        const request: v1.DeleteBbsPostRequest = req.body;
        if (!request.board || request.postId === undefined) {
            throw new HttpException(400);
        }
        const payload = getJwtPayload(req.headers.authorization!);
        const getbbsPostQuery = await getBbsPost(request.board, request.postId);
        if (
            getbbsPostQuery[0].ownerUid !== payload.uid &&
            !payload.hasPermission(Permission.Dev)
        ) {
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
        await execute("UPDATE bbs_file SET deletedDate=NOW() WHERE postId=?", [
            request.postId,
        ]);
        const response: v1.DeleteBbsPostResponse = {
            status: 0,
            message: "",
        };
        res.status(200).json(response);
    }

    async onGetBbsPostHeaders(req: Request, res: Response) {
        const request: v1.GetBbsPostHeaderRequest = req.query as any;
        const headers = [];
        const payload = getJwtPayload(req.headers.authorization!);
        switch (request.board) {
            case "feedback":
                headers.push("[버그 제보]", "[기능 추가]");
                if (payload.hasPermission(Permission.Dev)) {
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
    }

    async onGetBbsCommentList(req: Request, res: Response) {
        const request: v1.GetBbsCommentListRequest = req.query as any;
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

        const userInfo = await getUserInfoList();

        const comments: v1.BbsComment[] = [];

        for (const commentData of getCommentListQuery) {
            const owner = findUserByUid(userInfo, commentData.ownerUid);
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
    }

    async onPostBbsComment(req: Request, res: Response) {
        const request: v1.PostBbsCommentRequest = req.body;
        if (request.postId === undefined || !request.content) {
            throw new HttpException(400);
        }
        if (request.content.length > 300) {
            request.content.substring(0, 300);
        }
        const getbbsPostQuery = await getBbsPost(request.board, request.postId);
        const payload = getJwtPayload(req.headers.authorization!);
        const result = await execute(
            "INSERT INTO bbs_comment(ownerUid, postId, content, createdDate) VALUE(?, ?, ?, NOW())",
            [payload.uid, request.postId, request.content]
        );
        sendPushToUser(
            getbbsPostQuery[0].ownerUid,
            `댓글이 달렸습니다!`,
            request.content,
            `${config.webPrefix}/bbs/${request.board}/${request.postId}`
        );
        const response: v1.PostBbsCommentResponse = {
            status: 0,
            message: "",
            commentId: result.insertId,
        };
        res.status(200).json(response);
    }

    async onDeleteBbsComment(req: Request, res: Response) {
        const request: v1.DeleteBbsCommentRequest = req.body;
        if (!request.board || request.postId === undefined) {
            throw new HttpException(400);
        }
        const payload = getJwtPayload(req.headers.authorization!);
        const getbbsCommentQuery = await getBbsComment(
            request.board,
            request.postId,
            request.commentId
        );
        if (
            getbbsCommentQuery[0].ownerUid !== payload.uid &&
            !payload.hasPermission(Permission.Dev)
        ) {
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
    }
}

export default Bbs;
