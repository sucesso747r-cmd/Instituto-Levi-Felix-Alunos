import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupAuth } from './auth.js';
import { registerRoutes } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('trust proxy', 1);
app.use(express.json());

setupAuth(app);
registerRoutes(app);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  const distPublic = path.resolve(__dirname, '../dist/public');
  app.use(express.static(distPublic));
  app.get('*path', (_req, res) => {
    res.sendFile(path.join(distPublic, 'index.html'));
  });
  app.listen(PORT, () => {
    console.log(`[prod] Server running on port ${PORT}`);
  });
} else {
  // Development: embed Vite as middleware so HMR works on the same port
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  app.listen(PORT, () => {
    console.log(`[dev] Server running on port ${PORT}`);
  });
}
