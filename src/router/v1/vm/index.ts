import { Request, Response } from "express";
import { v1 } from "@common-jshs/menkakusitsu-lib";
import V1 from "..";
import { HttpException, ResponseException } from "common-api-ts";
import { execute, query } from "common-api-ts";
import { sendPush } from "../../../firebase";
import {
    aes256Decrypt,
    aes256Encrypt,
    getJwtPayload,
} from "../../../utils";
import { sendPushToUser } from "../../../utils/Api";
import fs from 'fs';
import path from 'path';
import { NodeSSH } from 'node-ssh';



class Vm extends V1 {

    constructor() {
        super();
        this.setPath("/vm");
        this.models = [
            {
                method: "post",
                path: "/create",
                authType: "access",
                controller: this.onPostCreate,
            },
        ]
    }
    async onPostCreate(req: Request, res: Response) {
        const request: v1.PostCreateVmRequest = req.body;
        // if (
        //     !request.notification ||
        //     request.targetUid === undefined
        // ) {
        //     throw new HttpException(400);
        // }
        const nodeSsh = new NodeSSH()
        const ssh = await nodeSsh.connect({
            host: "192.168.137.1",
            username: "root",
            password: ""
        })
        
        const result = await ssh.execCommand('pvesh get /cluster/nextid', { cwd: '/' })
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)
        const nextVmId = result.stdout;
        let command = `qm create ${nextVmId} --bios ${request.config.required.bios} --cores ${request.config.required.core} --memory ${request.config.required.ramSize} --sata 0`
        "qm create " + nextVmId;
        request.config.required.diskSize

        const response: v1.PostCreateVmResponse = {
            status: 0,
            message: "",
            vmId: 
        };
        res.status(200).json(response);
    }
}
export default Vm;