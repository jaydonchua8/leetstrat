import 'dotenv/config';
import { createApp } from './app';
import { prisma } from './lib/prisma';

const PORT = Number(process.env.PORT ?? 3000);

const server = createApp().listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`LeetStrat engine listening on :${PORT}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
