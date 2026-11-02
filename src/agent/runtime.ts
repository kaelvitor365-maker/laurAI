

import type { Orchestrator, SendMessageInput } from "./orchestrator.js";
import { randomUUID } from "node:crypto";

const MAX_RUNS = 100;

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

export class AgentRuntime {

    private readonly runs = new Map<string, AgentRun>();
    private readonly controllers = new Map<string, AbortController>();

    constructor(
        private readonly orchestrator: Orchestrator,

    ) {}


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

        try{
            const result = await this.orchestrator.send({
                ...input,
                signal: this.controllers.get(run.runId)?.signal
        });

            run.status = "completed";
            run.finishedAt = new Date();

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

            this.cleanupRuns();
            
            throw error;
        } finally {
            this.controllers.delete(run.runId);
        }
    }
}