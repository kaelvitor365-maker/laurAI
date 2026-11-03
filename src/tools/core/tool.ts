import { z } from "zod";
import type { ApprovalRequest } from "../security/approvals.js";

export interface Tool {
    readonly name: string;
    readonly description: string;
    readonly parameters: z.ZodType;

    execute(
        input: unknown,
        context: ToolContext
    ): Promise<ToolResult>;
}

export interface ToolContext {
    signal?: AbortSignal;
}

export interface ToolResult {
    success: boolean;
    output?: unknown;
    error?: string;
    approval?: ApprovalRequest;
}