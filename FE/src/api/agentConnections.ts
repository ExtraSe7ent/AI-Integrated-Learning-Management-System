import { api } from "./client";
export interface AgentConnection {
  id: string;
  clientName: string;
  scopes: string[];
  createdAt: number;
  expiresAt: number;
}
export interface AgentSettings {
  status: "ready" | "local" | "disabled" | "unavailable";
  message: string;
  mcpUrl: string | null;
  connections: AgentConnection[];
}
export const loadAgentConnections = () => api<AgentSettings>("/api/agent-connections");
export const revokeAgentConnection = (id: string) => api<{revoked: number}>(`/api/agent-connections/${encodeURIComponent(id)}`, {method: "DELETE"});
export const revokeAllAgentConnections = () => api<{revoked: number}>("/api/agent-connections/revoke-all", {method: "POST"});
