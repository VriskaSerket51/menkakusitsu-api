import { Request, Response, Router } from "express";
import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export interface ServerToClientEvents {
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
}

export interface ClientToServerEvents {
    hello: () => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketModelBase {
    authType?: "access" | "optional";
    // controller: (socket) => any;
}

export class SocketRouterBase {
    path: string = "";
    models: SocketModelBase[] = [];
    io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

    constructor(
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents
        >,
        path: string
    ) {
        this.io = io;
        this.path += path;
        this.io.on("connection", (socket) => {
        });
    }
}
