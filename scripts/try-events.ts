import { AgentRuntime } from "../src/agent/runtime.js";

const orchestrator = {
    async send() {
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            message: {
                content: "Teste concluído"
            }
        };
    }
};

const runtime = new AgentRuntime(orchestrator as any);

const events: string[] = [];

const unsubscribe = runtime.subscribe(event => {
    events.push(event.type);
    console.log("Evento recebido:", event.type);
});

unsubscribe();

console.log("Iniciando execução...\n");

const result = await runtime.send({
    conversationId: "test-events",
    content: "Olá, LaurAI!"
});

// Aguarda os listeners assíncronos terminarem.
await new Promise(resolve => setTimeout(resolve, 0));

console.log("\nResultado:", result.message.content);
console.log("Eventos recebidos:", events);
console.log("Estado final:", runtime.findRun(result.run.runId)?.status);