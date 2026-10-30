import type { PrismaClient } from "../generated/prisma/client.js";

export type CreateConversationInput = {
    title?: string | null;
    modelProvider?: string;
    model?: string;
    systemPrompt?: string | null;
};

export class ConversationService {
    constructor(
        private readonly prisma: PrismaClient
    ) {}

    async create(input: CreateConversationInput = {}) {
        return this.prisma.conversation.create({
            data: {
                title: input.title,
                modelProvider: input.modelProvider,
                model: input.model,
                systemPrompt: input.systemPrompt
            }
        });
    }
}