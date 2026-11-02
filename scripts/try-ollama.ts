import {OllamaProvider } from "../src/models/ollama-provider.js"

const main = async (): Promise<void> => {
    const provider = new OllamaProvider();

    try{
        const response = await provider.generate({
            model: "qwen3:8b",
            messages: [
                {
                    role: 'user',
                    content: "Diga olá em uma frase."
                }
            ]
        });

        console.log(`resposta: ${response.message.content}\ntempo (ms): ${response.durationMs}\ntokens gerados: ${response.completionTokens}`)
    } catch (error) {
        console.log(error);
    }
}
main();