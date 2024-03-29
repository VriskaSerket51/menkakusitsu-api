import CommonApi from "@ireves/common-api";
import {
  flushDeletedBbsContent,
  flushSpecialroom,
  flushTempFolder,
  newMealUpdate,
} from "@/scheduler/jobs";

export const schedules: CommonApi.Schedule[] = [
  {
    name: "newMealUpdate",
    cron: "00 00 00 * * *",
    job: newMealUpdate,
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
