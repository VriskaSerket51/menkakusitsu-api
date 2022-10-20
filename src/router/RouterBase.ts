import { Request, Response, Router } from "express";

export interface ModelBase {
    method: "get" | "post" | "put" | "patch" | "delete";
    path: string;
    authType?: "access" | "refresh" | "optional";
    controller: (req: Request, res: Response) => any;
}

export class RouterBase {
    path: string = "";
    models: ModelBase[] = [];

    constructor() {}

    setPath(path: string) {
        this.path += path;
    }
}
