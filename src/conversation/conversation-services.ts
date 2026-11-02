import type { PrismaClient} from "../generated/prisma/client.js";
import { Prisma } from "../generated/prisma/client.js";

export type CreateConversationInput = {
    title?: string | null;
    modelProvider?: string;
    model?: string;
    systemPrompt?: string | null;
};

export type UpdateConversationInput = {
    title?: string | null;
    modelProvider?: string;
    model?: string;
    systemPrompt?: string | null;
};

export class ConversationNotFoundError extends Error {
    constructor(id: string){
        super(`Conversation with id "${id}" was not found`);

        this.name = "ConversationNotFoundError";
    }
}
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
    async findById(id: string) {
        return this.prisma.conversation.findUnique({
            where: {
                id
            }
        });
    }

    async findAll(limit: number = 20) {
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) 
            throw new RangeError("Limit must be between 1 and 100");
        
        return this.prisma.conversation.findMany({
            where: {
                archivedAt: null
            },
            orderBy: {
                updatedAt: "desc"
            },
            take: limit,
            select: {
                id: true,
                title: true,
                modelProvider: true,
                model: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }

    async update(id: string, input: UpdateConversationInput){
        try {
            return await this.prisma.conversation.update({
                where: {
                    id
                },
                data: input
            });
        } catch (error: unknown) {
            if(
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025"
            )
                throw new ConversationNotFoundError(id);
            throw error;
        }
    }
    async delete(id: string){
        try{
            return await this.prisma.conversation.delete({
                where: {
                    id
                }
            });
        } catch(error: unknown){
            if(
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025"
            )
                throw new ConversationNotFoundError(id);
            throw error;
        }
    }
    async archive(id: string){
        try{
            return await this.prisma.conversation.update({
                where: {
                    id
                },
                data: {
                    archivedAt: new Date()
                }
            });
        } catch(error: unknown){
            if(
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025"
            )
                throw new ConversationNotFoundError(id);
            throw error;
        }
    }
    async restore(id: string){
        try{
            return await this.prisma.conversation.update({
                where: {
                    id
                },
                data: {
                    archivedAt: null
                }
            });
        } catch(error: unknown){
            if(
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025"
            )
                throw new ConversationNotFoundError(id);
            throw error;
        }
    }
}