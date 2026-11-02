import { bootstrap } from "./app/bootstrap.js";
const main = async (): Promise<void> => {
    const app = await bootstrap();
    try {
        console.log(`database opened: ${app.db.open}`);

        
    } finally {
        if (app.db.open) {
            app.db.close();
        }
        await app.prisma.$disconnect();
        console.log("database connections closed");
    }
};
main().catch((error: unknown) => {
    console.error("Fatal error to start LaurAI:", error);
    process.exitCode = 1;
});