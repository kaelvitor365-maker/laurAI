import { spawn } from "node:child_process";
import { kill } from "node:process";
import type { Tool, ToolContext, ToolResult } from "../../core/tool.js";
import { z } from "zod";

export interface ShellOptions {
    cwd?: string;
    timeout?: number;
    signal?: AbortSignal;
}

export interface ShellResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    cancelled: boolean;
}

const shellParameters = z.object({
    command: z.string().min(1),
    cwd: z.string().optional(),
    timeout: z.number().positive().optional()
})

export class ShellTool implements Tool {
    readonly name = "shell.execute";

    readonly description = "Executa comandos Bash no sys linux";

    readonly parameters = shellParameters;

    async execute(
        input: unknown,
        context: ToolContext
    ): Promise<ToolResult> {
        const params = this.parameters.parse(input);

        const result = await executeShell(params.command, {
            cwd: params.cwd,
            timeout: params.timeout,
            signal: context.signal
        });

        return {
            success: result.exitCode === 0 && !result.timedOut && !result.cancelled,
            output: result
        };
    }
}

export const executeShell = (
    command: string,
    options: ShellOptions = {}
): Promise<ShellResult> => {
    return new Promise((resolve, reject) => {
        if (options.signal?.aborted) {
            reject(options.signal.reason);
            return;
        }

        const process = spawn("bash", ["-c", command], {
            cwd: options.cwd,
            stdio: ["ignore", "pipe", "pipe"],
            detached: true
        });

        let stdout = "";
        let stderr = "";

        let cancelled = false;
        let timedOut = false;
        let timeoutId: NodeJS.Timeout | undefined;

        const abortHandler = () => {
            cancelled = true;
            if (process.pid) {
                kill(-process.pid, "SIGTERM");
            }
        };

        const cleanup = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            options.signal?.removeEventListener("abort", abortHandler);
        };

        options.signal?.addEventListener("abort", abortHandler, {
            once: true
        });

        if (options.timeout !== undefined) {
            timeoutId = setTimeout(() => {
                timedOut = true;

                if (process.pid) {
                    kill(-process.pid, "SIGTERM");
                }
            }, options.timeout);
        }

        process.stdout.on("data", (data: Buffer) => {
            stdout += data.toString();
        });

        process.stderr.on("data", (data: Buffer) => {
            stderr += data.toString();
        });

        process.on("error", (error) => {
            cleanup();
            reject(error);
        });

        process.on("close", (exitCode) => {
            cleanup();

            resolve({
                stdout,
                stderr,
                exitCode,
                timedOut,
                cancelled
            });
        });
    });
};