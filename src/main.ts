import process from "node:process";
import { bootstrap }from "./app/bootstrap.js";

const main = async (): Promise<void> => {
    const app = await bootstrap();

    console.log(`database opened: ${app.db.open}`);

    process.once("exit", () => {
        if(app.db.open)
            app.db.close();
    })
};

main().catch((error: unknown) => {
    console.log(`Fatal error to start LauraAI: ${error}`);
    process.exitCode = 1;
});
