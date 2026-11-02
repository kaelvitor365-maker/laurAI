import type {GenerateRequest, GenerateResponse, ModelProvider} from "./model-gateway.js"

interface OllamaChatResponse {
    model: string;
    message: {
        role: "assistant";
        content: string;
        thinking?: string;
    };
    total_duration?: number;
    eval_count?: number;
}

export class OllamaProvider implements ModelProvider {
    readonly name = "ollama";

    constructor(
        private readonly baseUrl: string = "http://localhost:11434"
    ) {}

    async generate({
        model = "qwen3:8b",
        messages,
        think = false,
        temperature,
        signal
    }: GenerateRequest): Promise<GenerateResponse> {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            signal,
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                think,
                options: { temperature},
            }),
        });

        if (!response.ok)
            throw Error(`Ollama respondeu com status ${response.status}`);

        const data = await response.json() as OllamaChatResponse;
        
        return {
            model: data.model,
            message: {role: "assistant", content: data.message.content},
            thinking: data.message.thinking,
            durationMs:
                data.total_duration !== undefined
                    ? Math.round(data.total_duration / 1_000_000)
                    : undefined,
            completionTokens: data.eval_count
        };
    }
}