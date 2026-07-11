// NextGen-CCM backend — API only. The frontend is deployed separately (see frontend/).
import express from 'express';
import { config } from './config.js';
import { api } from './routes.js';
import { seed } from './seed.js';
import { OUT_DIR, ARCHIVE_DIR } from './store.js';
import { logger, setLogLevel } from './logger.js';

setLogLevel(config.logging.level); // initial level from config.xml (runtime-changeable, FR-6.4)
seed(); // load sample applications/themes/templates/hooks on first run

const app = express();
app.use(express.json({ limit: '5mb' }));

// CORS — the frontend is served from a different origin (config.xml <server><corsOrigin>)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', config.server.corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/api/v1', api);
app.use('/out', express.static(OUT_DIR));         // generated documents (PDFs, reports, gateway artifacts)
app.use('/archive', express.static(ARCHIVE_DIR)); // archived renditions

app.listen(config.server.port, () => {
  logger.info(`NextGen-CCM backend listening on http://localhost:${config.server.port} (API: /api/v1)`);
  logger.info(`AI features: ${config.ai.apiKey ? `enabled (model: ${config.ai.model})` : 'disabled — set OPENROUTER_API_KEY in backend/.env'}`);
});
