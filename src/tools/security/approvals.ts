import { error } from "node:console";
import { randomUUID } from "node:crypto";

export type ApprovalStatus =
    | "pending"
    | "approved"
    | "rejected";

export interface ApprovalRequest {
    id: string;
    tool: string;
    input: unknown;
    status: ApprovalStatus;
    createdAt: Date;
}

export class ApprovalManager {
    private readonly requests = new Map<string, ApprovalRequest>();

    create(tool: string, input: unknown): ApprovalRequest {
        const request: ApprovalRequest = {
            id: randomUUID(),
            tool,
            input,
            status: "pending",
            createdAt: new Date()
        };

        this.requests.set(request.id, request);

        return request;
    }

    get(id: string): ApprovalRequest | undefined {
        return this.requests.get(id);
    }

    getPending(): ApprovalRequest[] {
        return Array.from(this.requests.values())
            .filter(request => request.status === "pending");
    }

    approve(id: string): ApprovalRequest {
        const request = this.requests.get(id);

        if(!request)
            throw new Error(`Solicitação "${id}" não encontrada.`);

        if(request.status !== "pending")
            throw new Error("Essa solicitação já foi respondida.");

        request.status = "approved";

        return request;
    }

    reject(id: string): ApprovalRequest {
        const request = this.requests.get(id);

        if(!request)
            throw new Error(`Solicitação "${id}" não encontrada.`);

        if(request.status !== "pending")
            throw new Error("Essa solicitação já foi respondida.");

        return (request.status = "rejected", request);
    }

    consumeApproved(id: string): ApprovalRequest {
        const request = this.requests.get(id);

        if(!request)
            throw new Error(`Solicitação "${id}" não encontrada.`);

        if(request.status !== "approved")
            throw new Error("A solicitação não foi aprovada.");

        return (this.requests.delete(id), request);
    }
    
}