import { createDatabase } from "../database/connection.js";
import { prisma } from "../database/prisma.js";
import { ConversationService } from "../conversation/conversation-services.js";
import { MessageService } from "../messages/message-service.js";
import { ContextBuilder } from "../agent/context-builder.js";
import { Orchestrator } from "../agent/orchestrator.js"
import { OllamaProvider } from "../models/ollama-provider.js";


export type AppContext = {
    db: ReturnType<typeof createDatabase>;
    prisma: typeof prisma;
    conversations: ConversationService;
    messages: MessageService;
    contextBuilder: ContextBuilder;
    orchestrator: Orchestrator;
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


        const ollama = new OllamaProvider();
        const conversations = new ConversationService(prisma);
        const messages = new MessageService(prisma);
        const contextBuilder = new ContextBuilder(conversations, messages);
        const orchestrator = new Orchestrator(
            messages,
            contextBuilder,
            ollama,
            conversations
        )

        console.log("prisma conectado");

        return {
            db,
            prisma,
            conversations,
            messages,
            contextBuilder,
            orchestrator
        };
    } catch (error: unknown) {
        db.close();
        await prisma.$disconnect();
        throw error;
    }
};