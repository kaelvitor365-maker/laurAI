

export interface ModelMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface GenerateRequest {
    model: string;
    messages: ModelMessage[];
    temperature?: number;
    think?: boolean;
    signal?: AbortSignal;
}

export interface GenerateResponse {
    model: string;
    message: ModelMessage;
    thinking?: string;
    durationMs?: number;
    completionTokens?: number;
}

export interface ModelProvider {
    readonly name: string;
    generate(request: GenerateRequest): Promise<GenerateResponse>;
}   