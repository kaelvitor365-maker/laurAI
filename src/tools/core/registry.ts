import type { Tool } from "./tool.js";

export class ToolRegistry {
    private readonly tools = new Map<string, Tool>();

    register(tool: Tool): void {
        if (this.tools.has(tool.name)) {
            throw new Error(`Ferramenta "${tool.name}" já registrada.`);
        }

        this.tools.set(tool.name, tool);
    }

    get(name: string): Tool {
        const tool = this.tools.get(name);

        if (!tool) {
            throw new Error(`Ferramenta "${name}" não encontrada.`);
        }

        return tool;
    }

    has(name: string): boolean {
        return this.tools.has(name);
    }
}