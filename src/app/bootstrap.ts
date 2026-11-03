import { createDatabase } from "../database/connection.js";
import { prisma } from "../database/prisma.js";
import { ConversationService } from "../conversation/conversation-services.js";
import { MessageService } from "../messages/message-service.js";
import { ContextBuilder } from "../agent/context-builder.js";
import { Orchestrator } from "../agent/orchestrator.js";
import { AgentRuntime } from "../agent/runtime.js";
import { OllamaProvider } from "../models/ollama-provider.js";
import { ModelRegistry } from "../models/model-registry.js";
import { ToolRegistry } from "../tools/core/registry.js";
import { ToolExecutor } from "../tools/core/executor.js";
import { ShellTool } from "../tools/built-in/system/shell.js";
import { PermissionManager } from "../tools/security/permissions.js";
import { ApprovalManager } from "../tools/security/approvals.js";

export type AppContext = {
    db: ReturnType<typeof createDatabase>;
    prisma: typeof prisma;
    conversations: ConversationService;
    messages: MessageService;
    contextBuilder: ContextBuilder;
    modelRegistry: ModelRegistry;
    orchestrator: Orchestrator;
    runtime: AgentRuntime;
    toolRegistry: ToolRegistry;
    toolExecutor: ToolExecutor;
    permissions: PermissionManager;
};

export const bootstrap = async (): Promise<AppContext> => {
    console.log("starting my ai");

    const db = createDatabase();

    try {
        const result = db
            .prepare("SELECT vec_version() AS version")
            .get() as { version: string };

        console.log(`sqlite conectado; sqlite-vec ${result.version}`);

        await prisma.$connect();

        // Modelos
        const ollama = new OllamaProvider();

        const modelRegistry = new ModelRegistry();
        modelRegistry.register(ollama);

        // Serviços
        const conversations = new ConversationService(prisma);
        const messages = new MessageService(prisma);
        const contextBuilder = new ContextBuilder(conversations, messages);

        // Agente
        const orchestrator = new Orchestrator(
            messages,
            contextBuilder,
            modelRegistry,
            conversations
        );
        const toolRegistry = new ToolRegistry();
        toolRegistry.register(new ShellTool());

        const permissions = new PermissionManager();
        const approvals = new ApprovalManager();
        const toolExecutor = new ToolExecutor(
            toolRegistry,
            permissions,
            approvals
        );

        const runtime = new AgentRuntime(orchestrator);

        console.log("prisma conectado");

        return {
            db,
            prisma,
            conversations,
            messages,
            contextBuilder,
            modelRegistry,
            orchestrator,
            runtime,
            toolExecutor,
            toolRegistry,
            permissions
        };
    } catch (error: unknown) {
        db.close();
        await prisma.$disconnect();
        throw error;
    }
};