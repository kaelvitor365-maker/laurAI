import { bootstrap } from "../src/app/bootstrap.js";

const main = async (): Promise<void> => {
    const app = await bootstrap();

    try {
        const conversation = await app.conversations.create({
            title: "Teste do Orchestrator"
        });

        const response = await app.orchestrator.send({
            conversationId: conversation.id,
            content: "Olá! Qual é o seu nome?"
        });

        console.log("\nLaurAI:", response.message.content);
        console.log("Modelo:", response.model);
        console.log("Tempo:", response.durationMs, "ms");
        console.log("Tokens:", response.completionTokens);

    } finally {
        app.db.close();
        await app.prisma.$disconnect();
    }
};

main().catch(console.error);