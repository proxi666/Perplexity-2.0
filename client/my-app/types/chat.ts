export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  citations?: string[];
  searchQuery?: string | null;
};

export type Thread = {
  id: string;
  checkpointId: string | null;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};
