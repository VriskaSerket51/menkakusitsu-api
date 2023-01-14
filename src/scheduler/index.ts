import scheduler from "node-schedule";
import { logger } from "../utils/Logger";
import {
    flushDeletedBbsContent,
    flushSpecialroom,
    flushTempFolder,
    mealUpdate,
} from "./jobs";
interface Schedule {
    name: string;
    cron: string;
    job: () => void;
}

const schedules: Schedule[] = [
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
];

export const initializeScheduler = () => {
    schedules.forEach((schedule) => {
        scheduler.scheduleJob(schedule.cron, (fireDate) => {
            const now = new Date();
            if (fireDate.setHours(0, 0, 0, 0) !== now.setHours(0, 0, 0, 0)) {
                logger.info(
                    `${schedule.name} was supposed to run at ${fireDate}, but actually ran at ${now}`
                );
            }
            schedule.job();
        });
        // schedule.job();
    });
};
