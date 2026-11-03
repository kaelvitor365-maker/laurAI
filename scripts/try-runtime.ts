import { bootstrap } from "../src/app/bootstrap.js";

const main = async (): Promise<void> => {
    const app = await bootstrap();

    const unsubscribe = app.runtime.subscribe(event => {
        console.log("Evento recebido:", event.type);
        console.log("Estado:", event.run.status);
    });

    try {
        const conversation = await app.conversations.create({
            title: "Teste do Runtime"
        });

        console.log("Iniciando execução...\n");

        const result = await app.runtime.send({
            conversationId: conversation.id,
            content: "Responda apenas: teste concluído."
        });

        console.log("\nResultado:", result.run.status);
        console.log("Run ID:", result.run.runId);

    } finally {
        unsubscribe();
        app.db.close();
        await app.prisma.$disconnect();
    }
};

main().catch(console.error);