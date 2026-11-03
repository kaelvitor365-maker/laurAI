import { executeShell } from "../src/tools/built-in/system/shell.js";

const normal = await executeShell("echo normal");

const timeout = await executeShell(
    "sleep 10",
    { timeout: 1000 }
);

const controller = new AbortController();

setTimeout(() => controller.abort(), 1000);

const cancelled = await executeShell(
    "sleep 10",
    { signal: controller.signal }
);

console.log({ normal, timeout, cancelled });