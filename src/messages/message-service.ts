import type { PrismaClient, MessageRole} from "../generated/prisma/client.js";
import { Prisma } from "../generated/prisma/client.js";

export type CreateMessageInput = {
    conversationId: string;
    role: MessageRole;
    content: string;
    metadata?: Prisma.InputJsonValue | null;
}

export class MessageService {
    constructor(
        private readonly prisma: PrismaClient
    ) {}

    async create(input: CreateMessageInput) {
        return this.prisma.$transaction(async (tx) => {
            const lastMessage = await tx.message.findFirst({
                where: {
                    conversationId: input.conversationId
                },
                orderBy: {
                    sequence: "desc"
                },
                select: {
                    sequence: true
                }
            });

            const sequence = (lastMessage?.sequence ?? 0) + 1;

            return tx.message.create({
                data: {
                    conversationId: input.conversationId,
                    role: input.role,
                    content: input.content,
                    metadata: input.metadata ?? Prisma.DbNull,
                    sequence
                }
            });
        });
    }
}