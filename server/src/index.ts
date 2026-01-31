import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.js';
import suppliersRoutes from './routes/suppliers.js';
import skusRoutes from './routes/skus.js';
import supplierOffersRoutes from './routes/supplierOffers.js';
import clientsRoutes from './routes/clients.js';
import contractLinesRoutes from './routes/contractLines.js';
import inventoryLotsRoutes from './routes/inventoryLots.js';
import allocationsRoutes from './routes/allocations.js';
import fxRatesRoutes from './routes/fxRates.js';
import metricsRoutes from './routes/metrics.js';
import recommendationsRoutes from './routes/recommendations.js';
import auditRoutes from './routes/audit.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/skus', skusRoutes);
app.use('/api/supplier-offers', supplierOffersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/client-contract-lines', contractLinesRoutes);
app.use('/api/inventory-lots', inventoryLotsRoutes);
app.use('/api/allocations', allocationsRoutes);
app.use('/api/fx-rates', fxRatesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/audit', auditRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🍵 Matsu Matcha API server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

export default app;
