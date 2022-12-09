import mysql from "mysql";
import { createRequire } from "module";
export async function databaseConnection(){
    const require = createRequire(import.meta.url);
    const env = require("./.env.json");

    const connection = mysql.createConnection({
        host: env.database.host,
        user: env.database.user,
        password: env.database.password,
        database: env.database.database
    });
    connection.connect();

    console.log("Connected to database");
    return connection;
}
