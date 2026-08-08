import { ApiError, apiFetch, apiPost } from "@/lib/api";

export type WorkspaceConnection =
  | { type: "vps"; host: string; user: string }
  | { type: "api"; origin: string }
  | null;

export type WorkspaceSetup = {
  id: string;
  email: string;
  workspaceName: string;
  connection: WorkspaceConnection;
  savedAt: number;
};

type WorkspaceApiResponse = {
  user: string;
  workspace: {
    id: string;
    name: string;
    connection: WorkspaceConnection;
    createdAt: number;
    updatedAt: number;
  };
};

function toWorkspaceSetup(response: WorkspaceApiResponse): WorkspaceSetup {
  return {
    id: response.workspace.id,
    email: response.user,
    workspaceName: response.workspace.name,
    connection: response.workspace.connection,
    savedAt: response.workspace.updatedAt,
  };
}

export async function saveWorkspaceSetup(setup: {
  workspaceName: string;
  connection: WorkspaceConnection;
}): Promise<WorkspaceSetup> {
  const response = await apiPost<WorkspaceApiResponse>("/api/workspace", setup);
  return toWorkspaceSetup(response);
}

export async function readWorkspaceSetup(): Promise<WorkspaceSetup | null> {
  try {
    const response = await apiFetch<WorkspaceApiResponse>("/api/workspace");
    return toWorkspaceSetup(response);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) return null;
    throw error;
  }
}
