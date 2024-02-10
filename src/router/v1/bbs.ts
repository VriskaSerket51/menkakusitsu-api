import CommonApi from "@ireves/common-api";
import { v1, Permission } from "@common-jshs/menkakusitsu-lib";
import { Request, Response } from "express";

import config from "@/config";
import V1 from "@/router/v1";
import { Api, Sanitizer, Utility } from "@/utils";

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
    if (!Sanitizer.sanitizeRequest(request, "GetBbsPostListRequest")) {
      throw new CommonApi.HttpException(400);
    }
    const bbs_post_cnt = await CommonApi.getFirstAsync(
      "SELECT COUNT(*) as cnt FROM bbs_post WHERE deletedDate IS NULL AND board=? ",
      [request.board]
    );
    if (!bbs_post_cnt) {
      throw new CommonApi.HttpException(500);
    }

    const postsCount = Number(bbs_post_cnt.cnt);
    const offset = (request.postPage - 1) * request.postListSize;
    const postDataList = await CommonApi.getAllAsync(
      "SELECT * FROM bbs_post WHERE deletedDate IS NULL AND board=? ORDER BY `type` ASC, id DESC LIMIT ?, ?",
      [request.board, String(offset), String(request.postListSize)]
    );

    const userInfo = await Api.getUserInfoList();

    const commentCountList = await CommonApi.getAllAsync(
      "SELECT postId, COUNT(id) as cnt FROM bbs_comment WHERE deletedDate IS NULL AND board=? group by postId",
      [request.board]
    );
    const getCommentCount = (postId: number) => {
      for (const commentCountQuery of commentCountList) {
        if (commentCountQuery.postId == postId) {
          return Number(commentCountQuery.cnt);
        }
      }
      return 0;
    };

    const posts: v1.BbsPost[] = [];

    for (const postData of postDataList) {
      const owner = Api.findUserByUid(userInfo, postData.ownerUid);
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
    if (!Sanitizer.sanitizeRequest(request, "GetBbsPostRequest")) {
      throw new CommonApi.HttpException(400);
    }
    const postData = await Api.getBbsPost(request.board, request.postId);
    const owner = await Api.getUserInfo(postData.ownerUid);
    const payload = Utility.getJwtPayload(req.headers.authorization!);
    if (
      !postData.isPublic &&
      owner.uid != payload.uid &&
      !payload.hasPermission(Permission.Dev)
    ) {
      throw new CommonApi.ResponseException(
        -2,
        "관리자나 작성자 본인만 확인할 수 있습니다."
      );
    }
    const commentCount = await CommonApi.getFirstAsync(
      "SELECT COUNT(*) as cnt FROM bbs_comment WHERE deletedDate IS NULL AND board=? AND postId=?",
      [postData.board, postData.id]
    );

    if (!commentCount) {
      throw new CommonApi.HttpException(500);
    }

    const attachments = await CommonApi.getAllAsync(
      "SELECT * FROM bbs_file WHERE postId=?",
      [request.postId]
    );

    const post: v1.BbsPost = {
      id: postData.id,
      owner: owner,
      title: postData.title,
      content: postData.content,
      header: postData.header,
      board: postData.board,
      postType: postData.type,
      commentCount: commentCount.cnt,
      isPublic: postData.isPublic == 1,
      createdDate: postData.createdDate,
    };

    const files: v1.FileInfo[] = [];

    if (attachments.length > 0) {
      for (const attachment of attachments) {
        files.push({
          fileName: attachment.fileName,
          downloadLink: attachment.downloadLink,
          mimeType: attachment.mimeType,
          owner: {
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
      attachments: files,
    };
    res.status(200).json(response);
  }

  async onPostBbsPost(req: Request, res: Response) {
    const props = req.body.props;
    if (!props) {
      throw new CommonApi.HttpException(400);
    }
    const request: v1.PostBbsPostRequest = JSON.parse(props);
    if (!Sanitizer.sanitizeRequest(request, "PostBbsPostRequest")) {
      throw new CommonApi.HttpException(400);
    }

    if (request.title.length > 30) {
      request.title.substring(0, 30);
    }
    if (request.content.length > 500) {
      request.content.substring(0, 500);
    }
    const payload = Utility.getJwtPayload(req.headers.authorization!);
    const result = await CommonApi.runAsync(
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
      await Api.handleFiles(files, payload.uid, request.board, postId);
    }
    res.status(200).json(response);
  }

  async onPutBbsPost(req: Request, res: Response) {
    const request: v1.PutBbsPostRequest = req.body;
    if (!Sanitizer.sanitizeRequest(request, "PutBbsPostRequest")) {
      throw new CommonApi.HttpException(400);
    }

    if (request.title && request.title.length > 30) {
      request.title.substring(0, 30);
    }
    if (request.content && request.content.length > 500) {
      request.content.substring(0, 500);
    }
    const postData = await Api.getBbsPost(request.board, request.postId);
    const payload = Utility.getJwtPayload(req.headers.authorization!);
    if (
      payload.uid != postData.ownerUid &&
      !payload.hasPermission(Permission.Dev)
    ) {
      throw new CommonApi.HttpException(403);
    }
    await CommonApi.runAsync(
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
    if (!Sanitizer.sanitizeRequest(request, "DeleteBbsPostRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const payload = Utility.getJwtPayload(req.headers.authorization!);
    const postData = await Api.getBbsPost(request.board, request.postId);
    if (
      postData.ownerUid !== payload.uid &&
      !payload.hasPermission(Permission.Dev)
    ) {
      throw new CommonApi.HttpException(403);
    }
    await CommonApi.runAsync(
      "UPDATE bbs_post SET deletedDate=NOW() WHERE board=? AND id=?",
      [request.board, request.postId]
    );
    await CommonApi.runAsync(
      "UPDATE bbs_comment SET deletedDate=NOW() WHERE board=? AND postId=?",
      [request.board, request.postId]
    );
    await CommonApi.runAsync(
      "UPDATE bbs_file SET deletedDate=NOW() WHERE board=? AND postId=?",
      [request.board, request.postId]
    );
    const response: v1.DeleteBbsPostResponse = {
      status: 0,
      message: "",
    };
    res.status(200).json(response);
  }

  async onGetBbsPostHeaders(req: Request, res: Response) {
    const request: v1.GetBbsPostHeaderRequest = req.query as any;
    if (!Sanitizer.sanitizeRequest(request, "GetBbsPostHeaderRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const headers = [];
    const payload = Utility.getJwtPayload(req.headers.authorization!);
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
    if (!Sanitizer.sanitizeRequest(request, "GetBbsCommentListRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const bbs_comment_count = await CommonApi.getFirstAsync(
      "SELECT COUNT(*) as cnt FROM bbs_comment WHERE deletedDate IS NULL AND board=? AND postId=?",
      [request.board, request.postId]
    );
    if (!bbs_comment_count) {
      throw new CommonApi.HttpException(500);
    }

    const commentCount = Number(bbs_comment_count.cnt);
    const offset = (request.commentPage - 1) * request.commentListSize;
    const commentList = await CommonApi.getAllAsync(
      "SELECT * FROM bbs_comment WHERE deletedDate IS NULL AND board=? AND postId=? ORDER BY id DESC LIMIT ?, ?",
      [
        request.board,
        request.postId,
        String(offset),
        String(request.commentListSize),
      ]
    );

    const userInfo = await Api.getUserInfoList();

    const comments: v1.BbsComment[] = [];

    for (const commentData of commentList) {
      const owner = Api.findUserByUid(userInfo, commentData.ownerUid);
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
    if (!Sanitizer.sanitizeRequest(request, "PostBbsCommentRequest")) {
      throw new CommonApi.HttpException(400);
    }

    if (request.content.length > 300) {
      request.content.substring(0, 300);
    }
    const postData = await Api.getBbsPost(request.board, request.postId);
    const payload = Utility.getJwtPayload(req.headers.authorization!);
    const result = await CommonApi.runAsync(
      "INSERT INTO bbs_comment(ownerUid, postId, content, createdDate) VALUE(?, ?, ?, NOW())",
      [payload.uid, request.postId, request.content]
    );
    Api.sendPushToUser(
      postData.ownerUid,
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
    if (!Sanitizer.sanitizeRequest(request, "DeleteBbsCommentRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const payload = Utility.getJwtPayload(req.headers.authorization!);
    const commentData = await Api.getBbsComment(
      request.board,
      request.postId,
      request.commentId
    );
    if (
      commentData.ownerUid !== payload.uid &&
      !payload.hasPermission(Permission.Dev)
    ) {
      throw new CommonApi.HttpException(403);
    }
    await CommonApi.runAsync(
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
