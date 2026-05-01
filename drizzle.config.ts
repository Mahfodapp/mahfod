/** @type { import("drizzle-kit").Config } */
export default {
    dialect: 'sqlite',
    driver: 'expo',
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
};
