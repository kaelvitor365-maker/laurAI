export interface ToolPermission {
    tool: string;
    allowed: boolean;
}

export type PermissionLever =
    | "allowed"
    | "approval_required"
    | "denied";

export class PermissionManager {
    private readonly permissions = new Map<string, PermissionLever>();

    set(tool: string, level: PermissionLever): void {
        this.permissions.set(tool, level);
    }

    get(tool: string): PermissionLever {
        return this.permissions.get(tool) ?? "denied";
    }

}