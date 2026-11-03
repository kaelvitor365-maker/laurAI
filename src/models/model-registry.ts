import type { ModelProvider } from "./model-gateway.js";

export class ModelRegistry {
    private readonly providers = new Map<string, ModelProvider>();

    register(provider: ModelProvider): void {
        if(this.providers.has(provider.name))
            throw new Error(`Provedor "${provider.name}" já está registrado`);

        this.providers.set(provider.name, provider);
    }

    get(name: string): ModelProvider {
        const provider = this.providers.get(name);

        if(!provider)
            throw new Error(`Provedor "${name}" não encontrado.`);

        return provider;
    }

    has(name: string): boolean {
        return this.providers.has(name);
    }
}