import { Schedule } from "common-api-ts";
import {
    flushDeletedAccount,
    flushDeletedBbsContent,
    flushSpecialroom,
    flushTempFolder,
    mealUpdate,
} from "./jobs";

export const schedules: Schedule[] = [
    {
        name: "mealUpdate",
        cron: "00 00 00 * * *",
        job: mealUpdate,
    },
    {
        name: "flushTempFolder",
        cron: "00 30 04 * * *",
        job: flushTempFolder,
    },
    {
        name: "flushSpecialroom",
        cron: "00 00 00 * * *",
        job: flushSpecialroom,
    },
    {
        name: "flushDeletedBbsContent",
        cron: "00 00 00 * * *",
        job: flushDeletedBbsContent,
    },
    {
        name: "flushDeletedAccount",
        cron: "00 00 00 * * *",
        job: flushDeletedAccount,
    },
];
