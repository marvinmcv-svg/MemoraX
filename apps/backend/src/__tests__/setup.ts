process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.CLERK_SECRET_KEY = 'test_clerk_secret_key_for_unit_tests';
process.env.GEMINI_API_KEY = '';
process.env.OPENAI_API_KEY = '';
delete process.env.DATABASE_URL;
