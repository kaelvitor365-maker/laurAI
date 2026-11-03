

import type { Orchestrator, SendMessageInput } from "./orchestrator.js";
import { randomUUID } from "node:crypto";

const MAX_RUNS = 100;
const MAX_CONCURRENT_RUNS = 5;

export type RunStatus = 
    | "running"
    | "completed"
    | "failed" 
    | "cancelled";


export interface AgentRun {
    runId: string;
    conversationId: string;
    status: RunStatus;
    startedAt: Date;
    finishedAt: Date | null;
    error: string | null;
}

export type RunEvent =
    | {
        type: "run:started";
        run: AgentRun;
    }
    | {
        type: "run:completed";
        run: AgentRun;
    }
    | {
        type: "run:failed";
        run: AgentRun;
    }
    | {
        type: "run:cancelled";
        run: AgentRun;
    };

export class AgentRuntime {

    private readonly runs = new Map<string, AgentRun>();
    private readonly controllers = new Map<string, AbortController>();
    private readonly listeners = new Set<(event: RunEvent) => void>();
    private activeRuns = 0;
    private waitQueue: Array<() => void> = [];

    constructor(
        private readonly orchestrator: Orchestrator,

    ) {}

    private async acquireSlot(signal: AbortSignal): Promise<void> {
        if (signal.aborted) {
            throw new Error("Execução cancelada.");
        }

        if (this.activeRuns < MAX_CONCURRENT_RUNS) {
            this.activeRuns++;
            return;
        }

        await new Promise<void>((resolve, reject) => {
            const onAbort = () => {
                const index = this.waitQueue.indexOf(onResolve);

                if (index !== -1) {
                    this.waitQueue.splice(index, 1);
                }

                reject(new Error("Execução cancelada."));
            };

            const onResolve = () => {
                signal.removeEventListener("abort", onAbort);

                if (signal.aborted) {
                    reject(new Error("Execução cancelada."));
                    return;
                }

                resolve();
            };

            signal.addEventListener("abort", onAbort, { once: true });

            this.waitQueue.push(onResolve);
        });
    }   

    private releaseSlot(): void {
        const next = this.waitQueue.shift();

        if (next) {
            next();
            return;
        }

        this.activeRuns--;
    }

    private cleanupRuns(): void {
        if(this.runs.size <= MAX_RUNS)
            return;

        for(const [runId, run] of this.runs){
            if(this.runs.size <= MAX_RUNS)
                break;

            if(run.status == "running")
                continue;

            this.runs.delete(runId);
        }
    }

    private createRun(conversationId: string): AgentRun {
        const run: AgentRun = {
            runId: randomUUID(),
            conversationId,
            status: "running",
            startedAt: new Date(),
            finishedAt: null,
            error: null,
        };

        this.runs.set(run.runId, run);
        this.controllers.set(run.runId, new AbortController());

        return run;
    }

    private emit(event: RunEvent): void {
    const promises = Array.from(this.listeners, listener =>
        Promise.resolve().then(() => listener(event))
    );

    Promise.allSettled(promises).then(results => {
        for (const result of results) {
            if (result.status === "rejected") {
                console.error("Erro ao notificar listener:", result.reason);
            }
        }
    });
}

    subscribe(listener: (event: RunEvent) => void): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    cancelRun(runId: string): boolean {
        const run = this.runs.get(runId);
        if(!run || run.status !== "running") return false;

        const controller = this.controllers.get(runId);

        return (controller?.abort(), Boolean(controller));
    }

    findRun(runId: string): AgentRun | null {
        const run = this.runs.get(runId);

        if(!run)
            return null;

        return { ...run };
    }

    findRuns(): AgentRun[] {
        return Array.from(this.runs.values())
            .map(run => ({...run}));
    }

    async send(input: SendMessageInput) {
        const run = this.createRun(input.conversationId);

        let slotAcquired = false;

        this.emit({
            type: "run:started",
            run: {...run}
        })

        try{

            await this.acquireSlot(
                this.controllers.get(
                    run.runId
                )!.signal
            );

            slotAcquired = true;

            const result = await this.orchestrator.send({
                ...input,
                signal: this.controllers.get(run.runId)?.signal
            });

            run.status = "completed";
            run.finishedAt = new Date();

            this.emit({
                type: "run:completed",
                run: {...run}
            });

            this.cleanupRuns();

            return {
                ...result,
                run
            }
        } catch(error: unknown){

            const controller = this.controllers.get(run.runId);

            if (controller?.signal.aborted) {
                run.status = "cancelled";
                run.error = null;
            } else {
                run.status = "failed";
                run.error = error instanceof Error ? error.message : String(error);
            }

            run.finishedAt = new Date();

            this.emit({
                type: run.status === "cancelled" ? "run:cancelled" : "run:failed",
                run: {...run}
            });



            this.cleanupRuns();
            
            throw error;
        } finally {
            if (slotAcquired) 
                this.releaseSlot();

            this.controllers.delete(run.runId);
        }
    }
}