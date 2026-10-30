import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";

import { mkdirSync} from "node:fs";
import { dirname, resolve } from "node:path";

const databasePath = resolve(process.cwd(), 'data', 'laurai.db');

export const createDatabase = (): Database.Database => {

    mkdirSync(dirname(databasePath), {recursive: true});

    const db = new Database(databasePath);

    try {
        sqliteVec.load(db);

        db.pragma('foreign_keys = ON');
        db.pragma('journal_mode = WAL');

        return db;
    }
    catch (error: unknown) {
        db.close();
        throw error;
    }
};