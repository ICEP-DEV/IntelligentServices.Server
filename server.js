import express from 'express';
import dotenv from 'dotenv';
import { sequelize } from './models/config.js';
import registerRoutes from './routes/register.js';
import dashboardRoutes from './routes/dashboard.js';
import {router as resetRoutes} from './routes/reset.js';
import notificationsRoute from './routes/notifications.js';
import loginRoutes from './routes/login.js';
import cors from 'cors';
import { createServer } from 'http';
import { initSocket } from './middlewares/socket.js';
import seedSuperAdmin from './utils/Seeder.js';
import createUser from './routes/SeederAdmin.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// -----------------------------
// CORS setup
// -----------------------------
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};
app.use(cors(corsOptions));
app.use(express.json());

// -----------------------------
// Routes
// -----------------------------
app.use('/api', registerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', resetRoutes);
app.use('/api', loginRoutes);
app.use('/api/notifications', notificationsRoute);
app.use('/super', createUser);

app.get('/', (req, res) => res.send('API is running'));

// -----------------------------
// Database + Server + Socket.IO
// -----------------------------
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Database connected');
    await seedSuperAdmin();

    const io = initSocket(httpServer, corsOptions);

    httpServer.listen(process.env.PORT || 3000, () => {
      console.log(`Server started on port ${process.env.PORT || 3000}`);
    });
  })
  .catch(err => console.error('DB connection error:', err));
