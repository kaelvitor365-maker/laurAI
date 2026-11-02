import type { ConversationService } from "../conversation/conversation-services.js";
import type { MessageService } from "../messages/message-service.js";
import type { ModelMessage } from "../models/model-gateway.js";


export interface BuildContextOptions {
    limit?: number;
}

export class ContextBuilder {
    constructor(
        private readonly conversations: ConversationService,
        private readonly messages: MessageService
    ) {}

    async build(
        conversationId: string,
        {limit = 50}: BuildContextOptions = {}
    ): Promise<ModelMessage[]> {

        const conversation = await this.conversations.findById(conversationId);

        if(!conversation)
            throw new Error(`Conversation ${conversationId} not found`);

        const history = await this.messages.findByConversation(
            conversationId,
            {limit}
        );

        const context: ModelMessage[] = [];

        if(conversation.systemPrompt)
            context.push({
                role: "system",
                content: conversation.systemPrompt
            });
        
        for(const message of history.reverse()){
            if(message.role === "tool")
                continue;

            context.push({
                role: message.role,
                content: message.content
            });
        }

        return context;
    }
}