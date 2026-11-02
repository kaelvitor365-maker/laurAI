import { bootstrap } from "../src/app/bootstrap.js";

const main = async (): Promise<void> => {
    const app = await bootstrap();

    try {
        const conversation = await app.conversations.create({
            title: "Teste de cancelamento"
        });

        console.log("Iniciando execução...\n");

        const execution = app.runtime.send({
            conversationId: conversation.id,
            content: "Explique detalhadamente como funciona a arquitetura de um sistema operacional."
        });

        // Aguarda a execução aparecer no Runtime.
        const run = app.runtime.findRuns().find(
            run => run.conversationId === conversation.id
                && run.status === "running"
        );

        if (!run) {
            throw new Error("Execução não encontrada.");
        }

        console.log("Run ID:", run.runId);

        // Dá tempo para o Ollama iniciar a geração.
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("\nSolicitando cancelamento...");

        const cancelled = app.runtime.cancelRun(run.runId);

        console.log("Cancelamento solicitado:", cancelled);

        try {
            await execution;
            console.log("A execução terminou antes do cancelamento.");
        } catch (error: unknown) {
            console.log(
                "Erro da execução:",
                error instanceof Error ? error.name : String(error)
            );
        }

        console.log("\nEstado final:");
        console.log(app.runtime.findRun(run.runId));

    } finally {
        app.db.close();
        await app.prisma.$disconnect();
    }
};

main().catch(console.error);