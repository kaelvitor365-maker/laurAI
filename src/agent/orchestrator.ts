import type { MessageService } from "../messages/message-service.js";
import type { ContextBuilder } from "./context-builder.js";
import type {ConversationService } from "../conversation/conversation-services.js"
import { ModelRegistry } from "../models/model-registry.js";


export interface SendMessageInput {
    conversationId: string;
    content: string;
    signal?: AbortSignal;
}

export class Orchestrator {
    constructor(
        private readonly messages: MessageService,
        private readonly contextBuilder: ContextBuilder,
        private readonly models: ModelRegistry,
        private readonly conversations: ConversationService
    ) {}

    async send({conversationId, content, signal}: SendMessageInput){
        const conversation = await this.conversations.findById(conversationId);



        if(!conversation)
            throw new Error(`Conversation ${conversationId} not found`);

        const model = this.models.get(conversation.modelProvider);

        if(conversation.modelProvider !== model.name)
            throw new Error(`Provider ${conversation.modelProvider} is not available`)



        await this.messages.create({
            conversationId,
            role: "user",
            content
        });

        const context = await this.contextBuilder.build(conversationId);

        const response = await model.generate({
            model: conversation.model,
            messages: context,
            signal
        });

        const assistantMessage = await this.messages.create({
            conversationId,
            role: "assistant",
            content: response.message.content
        });

        return {
            message: assistantMessage,
            thinking: response.thinking,
            model: response.model,
            durationMs: response.durationMs,
            completionTokens: response.completionTokens
        };
    }
}