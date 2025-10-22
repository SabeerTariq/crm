const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const customerRoutes = require('./routes/customers');
const customerSalesRoutes = require('./routes/customerSales');
const userRoutes = require('./routes/users');
const rbacRoutes = require('./routes/rbac');
const dashboardRoutes = require('./routes/dashboard');
const salesRoutes = require('./routes/sales');
const paymentRoutes = require('./routes/payments');
const financeRoutes = require('./routes/finance');
const teamRoutes = require('./routes/teams');
const targetRoutes = require('./routes/targets');
const assignmentRoutes = require('./routes/assignments');
const upsellerRoutes = require('./routes/upseller');
const upsellerTeamRoutes = require('./routes/upsellerTeams');
const upsellerTargetRoutes = require('./routes/upsellerTargets');
const upsellerPerformanceRoutes = require('./routes/upsellerPerformance');
const projectRoutes = require('./routes/projects');
const departmentRoutes = require('./routes/departments');
const taskRoutes = require('./routes/tasks');
const statusRoutes = require('./routes/statuses');
const boardRoutes = require('./routes/boards');
const reminderRoutes = require('./routes/reminders');
const chargebackRefundRoutes = require('./routes/chargebackRefunds');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

// Register all routes before starting the server
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customers', customerSalesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/upseller', upsellerRoutes);
app.use('/api/upseller-teams', upsellerTeamRoutes);
app.use('/api/upseller-targets', upsellerTargetRoutes);
app.use('/api/upseller-performance', upsellerPerformanceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/chargeback-refunds', chargebackRefundRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));