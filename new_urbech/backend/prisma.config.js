const path = require('node:path')
const { defineConfig, env } = require('prisma/config')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

module.exports = defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(__dirname, 'prisma', 'migrations'),
  },
  datasource: {
    provider: 'postgresql',
    url: env('DATABASE_URL'),
  },
})
