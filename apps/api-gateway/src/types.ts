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
    WHATSAPP_ACCESS_TOKEN: string;
    WHATSAPP_PHONE_ID: string;
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_SECRET_TOKEN: string;
    SLACK_SIGNING_SECRET: string;
    SLACK_BOT_TOKEN: string;
    TWILIO_AUTH_TOKEN: string;
    CLERK_SECRET_KEY: string;
    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;
  };
}
