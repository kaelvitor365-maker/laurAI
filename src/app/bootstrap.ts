import { createDatabase } from "../database/connection.js";


export type AppContext = {
    db: ReturnType<typeof createDatabase>
};

export const bootstrap = async (): Promise<AppContext> => {
    console.log('starting my ai');

    const db = createDatabase()

    try {
        const result = db
            .prepare("SELECT vec_version() AS version")
            .get() as {version: string};


        console.log(`sqlite conectado; sqlite-vec ${result.version}`);

        return { db };
    } catch (error: unknown) {
        db.close();
        throw error;
    }
};