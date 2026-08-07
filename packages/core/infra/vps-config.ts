import { readFileSync } from "node:fs";
import { z } from "zod";

export const VpsConfig = z.object({
  host: z.string().min(1),
  port: z.number().int().positive().default(22),
  username: z.string().min(1).default("root"),
  password: z.string().optional(),
  privateKey: z.string().optional(),
});

export type VpsConfig = z.infer<typeof VpsConfig>;

/** Lit la config VPS depuis les variables d'env (voir .env.example). Ne logge jamais la valeur des secrets. */
export function loadVpsConfigFromEnv(env: NodeJS.ProcessEnv = process.env): VpsConfig {
  return VpsConfig.parse({
    host: env.VPS_HOST,
    port: env.VPS_PORT ? Number(env.VPS_PORT) : undefined,
    username: env.VPS_USER || undefined,
    password: env.VPS_PASSWORD || undefined,
    privateKey: env.VPS_SSH_KEY_PATH ? readFileSync(env.VPS_SSH_KEY_PATH, "utf8") : undefined,
  });
}
