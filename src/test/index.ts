import dotenv from "dotenv";
import { initializeConfig } from "common-api-ts";
import config from "../config";
import { mealUpdate } from "../scheduler/jobs";

dotenv.config();

initializeConfig(config);

mealUpdate();