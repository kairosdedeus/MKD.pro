/**
 * Logger seguro para produção
 *
 * - Em desenvolvimento: loga normalmente no console
 * - Em produção: suprime logs para evitar vazamento de dados sensíveis
 *
 * NUNCA logar: senhas, tokens, auth_user_id, dados PII completos
 */

const isDev = import.meta.env.DEV;

/**
 * Sanitiza o objeto de erro removendo campos sensíveis antes de logar
 */
function sanitizeError(error: unknown): unknown {
  if (!error || typeof error !== "object") return error;

  const sanitized = { ...(error as Record<string, unknown>) };

  // Remover campos que podem conter dados sensíveis
  const sensitiveKeys = [
    "password",
    "senha",
    "token",
    "access_token",
    "refresh_token",
    "encrypted_password",
    "recovery_token",
    "auth_user_id",
    "p_password",
    "p_new_password",
  ];

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized;
}

export const logger = {
  /** Log de erro — apenas em desenvolvimento */
  error(message: string, error?: unknown): void {
    if (isDev) {
      console.error(`[ERROR] ${message}`, error ? sanitizeError(error) : "");
    }
  },

  /** Log de aviso — apenas em desenvolvimento */
  warn(message: string, detail?: unknown): void {
    if (isDev) {
      console.warn(`[WARN] ${message}`, detail ? sanitizeError(detail) : "");
    }
  },

  /** Log de info — apenas em desenvolvimento */
  info(message: string, detail?: unknown): void {
    if (isDev) {
      console.info(`[INFO] ${message}`, detail ?? "");
    }
  },
};
