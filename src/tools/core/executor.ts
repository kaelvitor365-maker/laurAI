import type { ToolContext, ToolResult } from "./tool.js";
import { ToolRegistry } from "./registry.js";
import { PermissionManager } from "../security/permissions.js";
import { ApprovalManager } from "../security/approvals.js";

export class ToolExecutor {
    constructor(
        private readonly registry: ToolRegistry,
        private readonly permissions: PermissionManager,
        private readonly approvals: ApprovalManager
    ) {}


    async execute(
        name: string,
        input: unknown,
        context: ToolContext = {}
    ): Promise<ToolResult> {
        const tool = this.registry.get(name);

        const permission = this.permissions.get(name);

        if(permission === "denied")
            return {
            success: false,
            error: `Permissão negada para executar "${name}`
            }

        if(permission === "approval_required"){
            const approval = this.approvals.create(name, input);

            return {
                success: false,
                error: `A ferramenta "${name}" exige aprovação`,
                approval
            }
        }

        const validation = tool.parameters.safeParse(input);

        if(!validation.success)
            return {
                success: false,
                error: validation.error.message
            };

        try{
            return await tool.execute(validation.data, context);
        } catch(error: unknown) {
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : String(error)
            };
        }
    }

    async executeApproved(
    approvalId: string,
    context: ToolContext = {}
    ): Promise<ToolResult> {
        try {
            const approval = this.approvals.consumeApproved(approvalId);

            const tool = this.registry.get(approval.tool);

            const validation = tool.parameters.safeParse(approval.input);

            if (!validation.success) {
                return {
                    success: false,
                    error: validation.error.message
                };
            }

            return await tool.execute(validation.data, context);
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : String(error)
            };
        }
    }
}