import * as mysql from "mysql2/promise";
import config from "../config";
import { MySqlException } from "../exceptions";
import { logger } from "../utils/Logger";

export const connection = async () => {
    try {
        return await mysql.createConnection(config.db);
    } catch (error) {
        logger.error(error);
        throw new MySqlException((error as mysql.QueryError).code);
    }
};

export const query = async (
    sql: string,
    values: any,
    asArray: boolean = false
) => {
    const conn = await connection();
    try {
        const [rows, fields] = await conn.query({
            sql: sql,
            values: values,
            rowsAsArray: asArray,
        });
        const result = rows as mysql.RowDataPacket[];
        return result;
    } catch (error) {
        logger.error(error);
        throw new MySqlException((error as mysql.QueryError).code);
    } finally {
        await conn.end();
    }
};

export const execute = async (sql: string, values: any) => {
    const conn = await connection();
    try {
        const [rows, fields] = await conn.execute(sql, values);
        const result = rows as mysql.OkPacket;
        return result;
    } catch (error) {
        logger.error(error);
        throw new MySqlException((error as mysql.QueryError).code);
    } finally {
        await conn.end();
    }
};
