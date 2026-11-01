import { createDatabase } from "../database/connection.js";
import { prisma } from "../database/prisma.js";
import { ConversationService } from "../conversation/conversation-services.js";
import { MessageService } from "../messages/message-service.js";


export type AppContext = {
    db: ReturnType<typeof createDatabase>;
    prisma: typeof prisma;
    conversations: ConversationService;
    messages: MessageService;
};

export const bootstrap = async (): Promise<AppContext> => {
    console.log("starting my ai");

    const db = createDatabase();

    try {
        const result = db
            .prepare("SELECT vec_version() AS version")
            .get() as { version: string };

        console.log(`sqlite conectado; sqlite-vec ${result.version}`);

        await prisma.$connect();

        const conversations = new ConversationService(prisma);
        const messages = new MessageService(prisma);

        console.log("prisma conectado");

        return {
            db,
            prisma,
            conversations,
            messages
        };
    } catch (error: unknown) {
        db.close();
        await prisma.$disconnect();
        throw error;
    }
};