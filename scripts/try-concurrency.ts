import { AgentRuntime } from "../src/agent/runtime.js";

let active = 0;
let maxActive = 0;

const orchestrator = {
    async send({ signal }: { signal?: AbortSignal }) {
        active++;
        maxActive = Math.max(active, maxActive);

        try {
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(resolve, 2000);

                signal?.addEventListener("abort", () => {
                    clearTimeout(timeout);
                    reject(new Error("Execução interrompida."));
                }, { once: true });
            });

            return {
                message: { content: "Teste concluído" }
            };
        } finally {
            active--;
        }
    }
};

const runtime = new AgentRuntime(orchestrator as any);

const executions = Array.from({ length: 5 }, (_, index) =>
    runtime.send({
        conversationId: `test-${index}`,
        content: `Execução ${index}`
    })
);

await new Promise(resolve => setTimeout(resolve, 200));

const run = runtime.findRuns()[0];

if (!run) {
    throw new Error("Execução não encontrada.");
}

runtime.cancelRun(run.runId);

try {
    await Promise.all(executions);
} catch {
    console.log("Uma execução foi cancelada.");
}

console.log("Execuções ativas:", active);
console.log("Máximo simultâneo:", maxActive);
console.log("Estado da execução cancelada:", runtime.findRun(run.runId)?.status);