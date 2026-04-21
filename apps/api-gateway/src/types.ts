export interface AppContext {
  Variables: {
    authToken?: string;
    userId?: string;
    rawBody?: string;
  };
  Bindings: {
    DB: D1Database;
    RATE_LIMIT_KV: KVNamespace;
    BACKEND_URL: string;
    WHATSAPP_APP_SECRET: string;
    WHATSAPP_VERIFY_TOKEN: string;
    TELEGRAM_BOT_TOKEN: string;
    SLACK_SIGNING_SECRET: string;
    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;
  };
}
