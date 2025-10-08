import express from 'express';
import dotenv from 'dotenv';
import { sequelize } from './model/index.js';
import registerRoutes from './routes/register.js';
import dashboardRoutes from './routes/dashboard.js';
import resetRoutes from './routes/reset.js';
import notificationsRoute from './routes/notifications.js';
import loginRoutes from './routes/login.js';
import cors from 'cors';
import { createServer } from 'http';
import { initSocket } from './config/socket.js';
import seedSuperAdmin from './utils/Seeder.js';


// Super admin routes
import createUser from './routes/super/SeederAdmin.js';
import addAdminUsers from './routes/super/SeederAdmin.js';
import suspendedUser from './routes/super/SuspendUsers.js'

// Other routes
import lodgeQuery from './routes/lodgeQuery.js';
import lodgeComplaint from './routes/lodgeComplaint.js';
import feedbackRoute from './routes/feedback.js';
import viewTotalRequest from './routes/AdminDashboard.js';
import totalRequest from './routes/AdminDashboard.js';
import viewRequestDetails from './routes/AdminDashboard.js';
import StatsInfo from './routes/StatisticsInfo.js'

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
app.use('/api', lodgeQuery);
app.use('/api', lodgeComplaint);
app.use('/api', feedbackRoute);
app.use('/api', viewTotalRequest);
app.use('/api', totalRequest);
app.use('/api', viewRequestDetails);
app.use('/api', StatsInfo)


//---------------------
// Super Routes 
//--------------------
app.use('/super', createUser);  
app.use('/super', addAdminUsers);  
app.use('/super', suspendedUser);


app.get('/', (req, res) => res.send('API is running'));

// -----------------------------
// Database + Server + Socket.IO
// -----------------------------
sequelize.sync() 
  .then(async () => {
    console.log('Database connected');
    await seedSuperAdmin();

    const io = initSocket(httpServer, corsOptions);

    httpServer.listen(process.env.PORT || 3000, () => {
      console.log(`Server started on port ${process.env.PORT || 3000}`);
    });
  })
  .catch(err => console.error('DB connection error:', err));

console.log("JWT_SECRET loaded:", process.env.JWT_SECRET);
