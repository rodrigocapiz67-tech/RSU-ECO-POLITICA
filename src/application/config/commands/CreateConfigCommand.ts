export interface CreateConfigCommand {
  key: string;
  value: Record<string, unknown>;
  scope?: string;
  description?: string;
}
