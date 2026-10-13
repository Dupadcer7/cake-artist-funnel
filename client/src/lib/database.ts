import { api } from "../api";
export const database = { bootstrap: api.bootstrapSession, sendMessage: api.sendMessage, admin: api.listAdminConfig } as const;
