import express from 'express';
import cors from 'cors';
import { initDb } from './db';
import studentRoutes from './routes/students';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initDb();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/students', studentRoutes);

// 404 for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

// Central error handler — keeps handlers free of try/catch boilerplate
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL' });
});

app.listen(PORT, () => {
  console.log(`Alcovia API running on http://localhost:${PORT}`);
});
