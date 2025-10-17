# CRM System - Comprehensive Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Module Documentation](#module-documentation)
6. [API Documentation](#api-documentation)
7. [Frontend Components](#frontend-components)
8. [Role-Based Access Control](#role-based-access-control)
9. [Business Logic & Workflows](#business-logic--workflows)
10. [Security Features](#security-features)
11. [Deployment Guide](#deployment-guide)
12. [Maintenance & Monitoring](#maintenance--monitoring)

---

## 🎯 Project Overview

This is a comprehensive **Customer Relationship Management (CRM) System** built with modern web technologies. The system manages the complete sales pipeline from lead generation to customer management, project delivery, and payment processing.

### Key Features
- **Multi-role User Management** with granular permissions
- **Lead-to-Customer Pipeline** with conversion tracking
- **Customer Assignment System** for upsellers
- **Project & Task Management** with Kanban boards
- **Multi-payment System** (one-time, installments, recurring)
- **Performance Tracking** and analytics
- **Real-time Dashboards** for different user roles

---

## 🛠️ Technology Stack

### Backend
- **Node.js** (v14+) with **Express.js** framework
- **MySQL/MariaDB** database with connection pooling
- **JWT** authentication with bcryptjs password hashing
- **Multer** for file uploads
- **CORS** enabled for cross-origin requests

### Frontend
- **React 19.1.1** with React Router DOM
- **Axios** for API communication
- **Custom Hooks** for state management
- **Responsive CSS** design
- **Font Awesome** icons

### Database
- **MySQL/MariaDB 10.4+** with comprehensive schema
- **Foreign key constraints** and indexes
- **Migration system** for schema updates
- **Connection pooling** for performance

---

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│  Express API    │◄──►│   MySQL DB      │
│   (Port 3000)   │    │   (Port 5000)   │    │   (Port 3306)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Directory Structure
```
crm/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── server/                 # Node.js Backend
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── middleware/         # Express middleware
│   ├── migrations/         # Database migrations
│   └── uploads/            # File uploads
└── docs/                   # Documentation files
```

---

## 🗄️ Database Schema

### Core Tables Overview

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | User accounts and authentication | Links to roles, teams, assignments |
| `roles` | Role definitions | Links to permissions via role_permissions |
| `permissions` | Available permissions | Many-to-many with roles |
| `customers` | Customer information | Links to sales, assignments, projects |
| `leads` | Lead information and tracking | Converts to customers |
| `sales` | Sales transactions | Links to payments, customers |
| `projects` | Project management | Links to tasks, customers |
| `tasks` | Task management | Links to projects, boards, users |

### User Management Tables
```sql
-- Users and Authentication
users (id, name, email, password_hash, role_id, created_at)
roles (id, name, description, created_at)
permissions (id, module, action, description)
role_permissions (role_id, permission_id)
```

### Lead Management Tables
```sql
-- Lead Pipeline
leads (id, name, company_name, email, phone, source, status, created_by, created_at)
lead_notes (id, lead_id, user_id, note, created_at)
lead_schedules (id, lead_id, schedule_date, schedule_time, scheduled_by, created_at)
lead_tracking (id, lead_id, action, details, created_at)
monthly_lead_stats (id, user_id, month, year, leads_created, leads_converted)
```

### Customer Management Tables
```sql
-- Customer Management
customers (id, name, company_name, email, phone, assigned_to, created_by, total_sales, total_paid, total_remaining)
customer_assignments (id, customer_id, upseller_id, status, notes, created_by, created_at)
customer_subscriptions (id, customer_id, service_name, amount, frequency, status, created_at)
```

### Sales & Payment Tables
```sql
-- Sales and Payments
sales (id, customer_id, unit_price, cash_in, remaining, payment_type, payment_source, services, created_by, created_at)
payment_installments (id, sale_id, installment_number, amount, due_date, paid_amount, status, paid_at)
payment_recurring (id, sale_id, customer_id, amount, frequency, next_payment_date, status, total_payments, payments_made)
payment_transactions (id, sale_id, installment_id, recurring_id, amount, payment_method, payment_source, created_by, created_at)
upcoming_payments (id, customer_id, payment_type, source_id, amount, due_date, status, description)
invoices (id, customer_id, sale_id, invoice_number, total_amount, remaining_amount, status, created_by, created_at)
```

### Project Management Tables
```sql
-- Project and Task Management
projects (id, customer_id, project_name, description, status, priority, budget, project_manager_id, created_by, created_at)
project_tasks (id, project_id, department_id, task_name, description, priority, status, assigned_to, created_by, due_date, board_id)
project_departments (project_id, department_id)
project_attachments (id, project_id, file_name, file_path, uploaded_by, created_at)
task_statuses (id, status_name, status_color, status_order, is_default)
task_members (task_id, user_id, role)
task_comments (id, task_id, user_id, comment, created_at)
task_checklists (id, task_id, title, created_by, created_at)
task_checklist_items (id, checklist_id, item_text, is_completed, created_by, created_at)
task_activity_logs (id, task_id, user_id, action, details, created_at)
```

### Team & Department Tables
```sql
-- Team Management
departments (id, department_name, description, created_by, created_at)
department_team_members (id, department_id, user_id, role, is_active, created_at)
teams (id, team_name, description, team_leader_id, created_by, created_at)
team_members (id, team_id, user_id, role, joined_at)
boards (id, board_name, department_id, description, is_default, created_by, created_at)
```

### Upseller Management Tables
```sql
-- Upseller System
upseller_teams (id, team_name, description, team_leader_id, created_by, created_at)
upseller_team_members (id, team_id, user_id, role, joined_at)
upseller_targets (id, user_id, target_year, target_month, target_value, created_at)
upseller_performance (id, user_id, metric_type, metric_value, period_year, period_month, created_at)
```

### Additional Tables
```sql
-- Targets and Performance
targets (id, user_id, target_year, target_month, target_value, target_type, created_at)
reminders (id, user_id, title, description, reminder_date, is_completed, created_at)
```

---

## 📚 Module Documentation

### 1. Authentication & Authorization Module

#### Purpose
Manages user authentication, role-based access control, and permission validation.

#### Key Components
- **JWT Authentication**: Token-based authentication system
- **Role-Based Access Control (RBAC)**: 7 predefined roles with specific permissions
- **Permission System**: Module-action based permissions
- **Protected Routes**: Middleware for route protection

#### Roles Hierarchy
1. **Admin** (role_id: 1) - Full system access
2. **Lead Scraper** (role_id: 2) - Lead creation and management
3. **Sales** (role_id: 3) - Lead conversion to customers
4. **Front Sales Manager** (role_id: 4) - Sales team management
5. **Upseller** (role_id: 5) - Customer management and upselling
6. **Upseller Manager** (role_id: 6) - Upseller team management
7. **Production** (role_id: 7) - Production team access

#### Files
- `server/routes/auth.js` - Authentication endpoints
- `server/routes/rbac.js` - Role and permission management
- `server/middleware/auth.js` - JWT authentication middleware
- `server/middleware/authorize.js` - Permission checking middleware
- `client/src/components/ProtectedRoute.js` - Frontend route protection
- `client/src/utils/roleUtils.js` - Role utility functions

### 2. User Management Module

#### Purpose
Manages user accounts, profiles, and team assignments.

#### Key Features
- User CRUD operations
- Role assignment and management
- Permission management per role
- User profile management
- Team management capabilities

#### Files
- `server/routes/users.js` - User management endpoints
- `client/src/pages/Users.js` - User management interface
- `client/src/pages/Roles.js` - Role management interface
- `client/src/components/UserProfile.js` - User profile component

### 3. Lead Management Module

#### Purpose
Manages the lead generation and conversion pipeline.

#### Key Features
- Lead creation and tracking
- Lead conversion to customers
- Lead source tracking
- Lead assignment to sales team
- Lead statistics and analytics
- Lead notes and scheduling
- CSV import functionality
- Visibility restrictions (user-specific notes and schedules)

#### Database Tables
- `leads` - Main lead information
- `lead_notes` - User-specific lead notes
- `lead_schedules` - User-specific lead schedules
- `lead_tracking` - Lead activity tracking
- `monthly_lead_stats` - Lead statistics

#### Files
- `server/routes/leads.js` - Lead management endpoints
- `client/src/pages/Leads.js` - Lead management interface
- `client/src/pages/ScheduleList.js` - Lead schedule management
- `client/src/pages/LeadScraperDashboard.js` - Lead scraper dashboard
- `server/services/statsService.js` - Lead statistics service

### 4. Customer Management Module

#### Purpose
Manages customer information, assignments, and relationships.

#### Key Features
- Customer CRUD operations
- Customer assignment to upsellers
- Customer sales profile tracking
- Customer payment history
- Customer project management
- Customer subscription management

#### Database Tables
- `customers` - Customer information
- `customer_assignments` - Customer-upseller assignments
- `customer_subscriptions` - Customer subscription management

#### Files
- `server/routes/customers.js` - Customer management endpoints
- `server/routes/customerSales.js` - Customer sales endpoints
- `client/src/pages/Customers.js` - Customer management interface
- `client/src/pages/CustomerSalesProfile.js` - Customer sales profile
- `server/services/customerSalesService.js` - Customer sales service

### 5. Sales Management Module

#### Purpose
Manages sales transactions and the sales pipeline.

#### Key Features
- Sales transaction recording
- Multiple payment types (one-time, installments, recurring)
- Sales role restrictions (sales role works with leads, upseller role works with customers)
- Sales analytics and reporting
- Sales target management
- Automatic invoice generation
- Custom installment and recurring payment dates

#### Database Tables
- `sales` - Sales transactions
- `invoices` - Invoice management

#### Files
- `server/routes/sales.js` - Sales management endpoints
- `client/src/pages/Sales.js` - Sales management interface
- `server/services/invoiceService.js` - Invoice generation service

### 6. Payment System Module

#### Purpose
Comprehensive payment management system supporting multiple payment types.

#### Key Features
- **One-time Payments**: Single payment for a sale
- **Installment Payments**: Large sales split into multiple payments
- **Recurring Payments**: Subscription-based payments
- **Custom Payment Dates**: User-defined payment schedules
- Payment transaction tracking
- Payment status management (pending, paid, overdue)
- Upcoming payments dashboard
- Payment method tracking (wire, cashapp, stripe, etc.)
- Invoice generation and management

#### Database Tables
- `payment_installments` - Installment payment schedules
- `payment_recurring` - Recurring payment schedules
- `payment_transactions` - Payment transaction records
- `upcoming_payments` - Upcoming payment tracking
- `invoices` - Invoice management

#### Files
- `server/routes/payments.js` - Payment management endpoints
- `server/routes/finance.js` - Finance management endpoints
- `client/src/pages/Payments.js` - Payment management interface
- `server/services/paymentService.js` - Payment processing service
- `server/services/invoiceService.js` - Invoice generation service

### 7. Customer Assignment Module

#### Purpose
Manages customer assignments to upsellers with access control.

#### Key Features
- Assign customers to upsellers
- Transfer customers between upsellers
- Deactivate/reactivate assignments
- Track assignment history
- Access control for assigned customers only
- Assignment types (territory, product, manual, performance)
- Status management (active, inactive, transferred)

#### Database Tables
- `customer_assignments` - Customer-upseller assignments

#### Files
- `server/routes/assignments.js` - Assignment management endpoints
- `client/src/pages/Assignments.js` - Assignment management interface
- `server/services/customerAssignmentService.js` - Assignment service
- `server/middleware/checkCustomerAssignment.js` - Assignment middleware

### 8. Project Management Module

#### Purpose
Manages projects, tasks, and project delivery.

#### Key Features
- Project creation and management
- Project status tracking (planning, active, on_hold, completed, cancelled)
- Project priority levels (low, medium, high, urgent)
- Project budget tracking
- Project manager assignment
- Project timeline management
- Project attachment management

#### Database Tables
- `projects` - Project information
- `project_departments` - Project-department relationships
- `project_attachments` - Project file attachments

#### Files
- `server/routes/projects.js` - Project management endpoints
- `client/src/pages/Projects.js` - Project management interface
- `client/src/pages/ProjectDetails.js` - Project detail view
- `server/services/projectService.js` - Project service

### 9. Task Management Module

#### Purpose
Comprehensive task management with Kanban-style boards.

#### Key Features
- Task creation and assignment
- Task status management
- Task priority levels
- Task due date tracking
- Task board system (Kanban-style)
- Task assignment to team members
- Task progress tracking
- Task comments and activity logs
- Task checklists
- Task attachments
- Automatic task member assignment

#### Database Tables
- `project_tasks` - Task information
- `task_statuses` - Task status definitions
- `task_members` - Task team member assignments
- `task_comments` - Task comments
- `task_checklists` - Task checklists
- `task_checklist_items` - Checklist items
- `task_activity_logs` - Task activity tracking

#### Files
- `server/routes/tasks.js` - Task management endpoints
- `client/src/pages/TaskManagement.js` - Task management interface
- `client/src/components/EnhancedTaskModal.js` - Task modal component
- `server/services/taskService.js` - Task service

### 10. Department Management Module

#### Purpose
Manages departments and department-based organization.

#### Key Features
- Department creation and management
- Predefined departments (Design, Development, SEO, Content, Marketing)
- Department-based task organization
- Department performance tracking
- Department team member management

#### Database Tables
- `departments` - Department information
- `department_team_members` - Department team assignments

#### Files
- `server/routes/departments.js` - Department management endpoints
- `client/src/pages/Departments.js` - Department management interface
- `server/services/departmentService.js` - Department service

### 11. Board Management Module

#### Purpose
Manages Kanban-style task boards for task organization.

#### Key Features
- Board creation and management
- Board assignment to departments
- Default board creation
- Task organization by status
- Board-based task filtering

#### Database Tables
- `boards` - Board information

#### Files
- `server/routes/boards.js` - Board management endpoints
- `server/services/boardService.js` - Board service

### 12. Team Management Module

#### Purpose
Manages teams and team member assignments.

#### Key Features
- Team creation and management
- Team member assignment
- Team leader designation
- Upseller team management
- Team performance tracking

#### Database Tables
- `teams` - Team information
- `team_members` - Team member assignments
- `upseller_teams` - Upseller-specific teams
- `upseller_team_members` - Upseller team member assignments

#### Files
- `server/routes/teams.js` - Team management endpoints
- `server/routes/upsellerTeams.js` - Upseller team endpoints
- `client/src/pages/Teams.js` - Team management interface
- `client/src/pages/UpsellerTeams.js` - Upseller team interface

### 13. Target & Performance Management Module

#### Purpose
Manages sales targets and performance tracking.

#### Key Features
- Sales target setting per user/month/year
- Performance metrics tracking
- Upseller performance analytics
- Team performance comparison
- Target achievement tracking
- Commission tracking for wire transfer and Zelle payments

#### Database Tables
- `targets` - General targets
- `upseller_targets` - Upseller-specific targets
- `upseller_performance` - Upseller performance metrics

#### Files
- `server/routes/targets.js` - Target management endpoints
- `server/routes/upsellerTargets.js` - Upseller target endpoints
- `server/routes/upsellerPerformance.js` - Upseller performance endpoints
- `client/src/pages/Targets.js` - Target management interface
- `client/src/pages/UpsellerTargets.js` - Upseller target interface
- `client/src/pages/UpsellerPerformance.js` - Upseller performance interface
- `client/src/pages/Performance.js` - Performance analytics interface

### 14. Dashboard System Module

#### Purpose
Provides role-specific dashboards with analytics and statistics.

#### Key Features
- **Lead Scraper Dashboard**: Lead creation statistics and analytics
- **Front Seller Dashboard**: Sales performance and commission tracking
- **Upseller Dashboard**: Customer assignments, sales, and commission tracking
- **Upsell Manager Dashboard**: Team performance analytics
- Real-time data updates
- Cross-tab synchronization
- Periodic refresh functionality

#### Files
- `server/routes/dashboard.js` - Dashboard API endpoints
- `client/src/pages/Dashboard.js` - Main dashboard
- `client/src/pages/LeadScraperDashboard.js` - Lead scraper dashboard
- `client/src/pages/FrontSellerDashboard.js` - Front seller dashboard
- `client/src/pages/UpsellerDashboard.js` - Upseller dashboard
- `client/src/pages/UpsellManagerDashboard.js` - Upsell manager dashboard

### 15. Reminder System Module

#### Purpose
Manages reminders and calendar functionality.

#### Key Features
- Reminder creation and management
- Calendar view
- Reminder notifications
- Due date tracking

#### Database Tables
- `reminders` - Reminder information

#### Files
- `server/routes/reminders.js` - Reminder management endpoints
- `client/src/pages/Calendar.js` - Calendar interface
- `server/services/reminderService.js` - Reminder service

---

## 🔌 API Documentation

### Authentication Endpoints (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout (client-side)

### User Management (`/api/users`)
- `GET /` - Get all users
- `POST /` - Create new user
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user
- `GET /profile` - Get current user profile
- `PUT /profile` - Update current user profile

### Role-Based Access Control (`/api/rbac`)
- `GET /roles` - Get all roles
- `POST /roles` - Create new role
- `GET /permissions` - Get all permissions
- `GET /role-permissions/:roleId` - Get role permissions
- `POST /role-permissions` - Assign permissions to role

### Lead Management (`/api/leads`)
- `GET /` - Get leads with filtering
- `POST /` - Create new lead
- `GET /:id` - Get lead by ID
- `PUT /:id` - Update lead
- `DELETE /:id` - Delete lead
- `POST /:id/convert` - Convert lead to customer
- `GET /:id/notes` - Get lead notes (user-specific)
- `POST /:id/notes` - Add lead note
- `GET /:id/schedules` - Get lead schedules (user-specific)
- `POST /:id/schedules` - Schedule lead call
- `GET /scheduled` - Get scheduled leads for current user
- `POST /import-csv` - Import leads from CSV

### Customer Management (`/api/customers`)
- `GET /` - Get customers
- `POST /` - Create new customer
- `GET /:id` - Get customer by ID
- `PUT /:id` - Update customer
- `DELETE /:id` - Delete customer
- `GET /:id/sales` - Get customer sales
- `GET /:id/payments` - Get customer payments
- `GET /:id/projects` - Get customer projects

### Sales Management (`/api/sales`)
- `GET /` - Get sales
- `POST /` - Create new sale
- `GET /:id` - Get sale by ID
- `PUT /:id` - Update sale
- `DELETE /:id` - Delete sale

### Payment Management (`/api/payments`)
- `GET /sale/:saleId` - Get payment details for sale
- `POST /installments` - Create installment payments
- `POST /installments/custom` - Create custom installment payments
- `POST /recurring` - Create recurring payment
- `POST /recurring/custom` - Create custom recurring payments
- `POST /installment/:installmentId/pay` - Process installment payment
- `POST /recurring/:recurringId/pay` - Process recurring payment
- `PUT /installment/:installmentId` - Update installment
- `GET /upcoming/installments` - Get upcoming installments
- `GET /upcoming/recurring` - Get upcoming recurring payments
- `GET /transactions/:saleId` - Get payment transactions

### Finance Management (`/api/finance`)
- `GET /invoices` - Get invoices
- `POST /invoices` - Create invoice
- `GET /invoices/:id` - Get invoice by ID
- `PUT /invoices/:id` - Update invoice
- `PUT /invoices/:id/payment` - Record invoice payment

### Assignment Management (`/api/assignments`)
- `GET /` - Get all assignments
- `GET /my-assignments` - Get current upseller assignments
- `GET /upseller/:upsellerId` - Get upseller assignments
- `GET /customer/:customerId` - Get customer assignments
- `POST /assign` - Assign customer to upseller
- `POST /transfer` - Transfer customer
- `PUT /:assignmentId/status` - Update assignment status
- `GET /upseller/:upsellerId/stats` - Get upseller statistics
- `GET /my-stats` - Get current upseller statistics
- `GET /upsellers` - Get all upsellers
- `GET /unassigned-customers` - Get unassigned customers
- `GET /check/:customerId` - Check customer assignment

### Project Management (`/api/projects`)
- `GET /` - Get projects
- `POST /` - Create project
- `GET /:id` - Get project by ID
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project
- `POST /:id/attachments` - Upload project attachments

### Task Management (`/api/tasks`)
- `GET /` - Get all tasks
- `GET /project/:projectId` - Get project tasks
- `GET /:id` - Get task by ID
- `POST /` - Create task
- `PUT /:id` - Update task
- `DELETE /:id` - Delete task
- `POST /:id/comments` - Add task comment
- `GET /:id/comments` - Get task comments
- `POST /:id/attachments` - Upload task attachments
- `GET /:id/attachments` - Get task attachments
- `POST /:id/checklists` - Create task checklist
- `GET /:id/checklists` - Get task checklists
- `POST /:id/members` - Add task member
- `GET /:id/members` - Get task members
- `GET /:id/activity` - Get task activity logs

### Department Management (`/api/departments`)
- `GET /` - Get departments
- `POST /` - Create department
- `GET /:id` - Get department by ID
- `PUT /:id` - Update department
- `DELETE /:id` - Delete department
- `POST /:id/members` - Add department member
- `GET /:id/members` - Get department members
- `DELETE /:id/members/:userId` - Remove department member

### Board Management (`/api/boards`)
- `GET /` - Get boards
- `GET /department/:departmentId` - Get department boards
- `GET /:id` - Get board by ID
- `POST /` - Create board
- `PUT /:id` - Update board
- `DELETE /:id` - Delete board
- `GET /:id/tasks` - Get board tasks

### Team Management (`/api/teams`)
- `GET /` - Get teams
- `POST /` - Create team
- `GET /:id` - Get team by ID
- `PUT /:id` - Update team
- `DELETE /:id` - Delete team
- `POST /:id/members` - Add team member
- `GET /:id/members` - Get team members
- `DELETE /:id/members/:userId` - Remove team member

### Upseller Management (`/api/upseller`)
- `GET /dashboard` - Get upseller dashboard data
- `GET /manager/dashboard` - Get upsell manager dashboard data

### Upseller Teams (`/api/upseller-teams`)
- `GET /` - Get upseller teams
- `POST /` - Create upseller team
- `GET /:id` - Get upseller team by ID
- `PUT /:id` - Update upseller team
- `DELETE /:id` - Delete upseller team
- `POST /:id/members` - Add upseller team member
- `GET /:id/members` - Get upseller team members
- `DELETE /:id/members/:userId` - Remove upseller team member

### Upseller Targets (`/api/upseller-targets`)
- `GET /` - Get upseller targets
- `POST /` - Create upseller target
- `GET /:id` - Get upseller target by ID
- `PUT /:id` - Update upseller target
- `DELETE /:id` - Delete upseller target

### Upseller Performance (`/api/upseller-performance`)
- `GET /` - Get upseller performance
- `POST /` - Create upseller performance record
- `GET /:id` - Get upseller performance by ID
- `PUT /:id` - Update upseller performance
- `DELETE /:id` - Delete upseller performance

### Target Management (`/api/targets`)
- `GET /` - Get targets
- `POST /` - Create target
- `GET /:id` - Get target by ID
- `PUT /:id` - Update target
- `DELETE /:id` - Delete target

### Dashboard (`/api/dashboard`)
- `GET /stats` - Get dashboard statistics
- `GET /front-seller/stats` - Get front seller dashboard statistics
- `GET /lead-scraper/stats` - Get lead scraper dashboard statistics

### Reminder Management (`/api/reminders`)
- `GET /` - Get reminders
- `POST /` - Create reminder
- `GET /:id` - Get reminder by ID
- `PUT /:id` - Update reminder
- `DELETE /:id` - Delete reminder

### Status Management (`/api/statuses`)
- `GET /` - Get task statuses
- `POST /` - Create task status
- `GET /:id` - Get task status by ID
- `PUT /:id` - Update task status
- `DELETE /:id` - Delete task status

---

## 🎨 Frontend Components

### Page Components (24 total)

#### Authentication & Core
- **Login.js** - User authentication interface
- **Dashboard.js** - Main dashboard for general users

#### Lead Management
- **Leads.js** - Lead management interface with filtering, search, and CSV import
- **ScheduleList.js** - Lead schedule management for current user
- **LeadScraperDashboard.js** - Lead scraper specific dashboard with statistics

#### Customer Management
- **Customers.js** - Customer management interface
- **CustomerSalesProfile.js** - Detailed customer sales profile view

#### Sales Management
- **Sales.js** - Sales management interface with multiple payment types

#### User Management
- **Users.js** - User management interface
- **Roles.js** - Role management interface

#### Dashboard System
- **FrontSellerDashboard.js** - Front seller dashboard with commission tracking
- **UpsellerDashboard.js** - Upseller dashboard with customer assignments and performance
- **UpsellManagerDashboard.js** - Upsell manager dashboard with team analytics

#### Upseller Management
- **UpsellerTeams.js** - Upseller team management
- **UpsellerTargets.js** - Upseller target management
- **UpsellerPerformance.js** - Upseller performance tracking

#### Team Management
- **Teams.js** - General team management
- **Targets.js** - Target management
- **Performance.js** - Performance analytics

#### Project Management
- **Projects.js** - Project management interface
- **ProjectDetails.js** - Detailed project view
- **TaskManagement.js** - Task management with Kanban boards

#### Department Management
- **Departments.js** - Department management interface

#### Payment Management
- **Payments.js** - Payment management interface

#### Assignment Management
- **Assignments.js** - Customer assignment management

#### Calendar
- **Calendar.js** - Calendar and reminder interface

### Reusable Components

#### Layout Components
- **PageLayout.js** - Common page layout wrapper with sidebar
- **PageLayout.css** - Styling for page layout
- **Sidebar.js** - Navigation sidebar with role-based menu
- **Sidebar.css** - Styling for sidebar

#### Functional Components
- **ProtectedRoute.js** - Route protection based on permissions
- **UpcomingPayments.js** - Payment dashboard component
- **UserProfile.js** - User profile management component
- **EnhancedTaskModal.js** - Advanced task modal with all features

### Custom Hooks
- **usePermissions.js** - Permission checking hook
- **useUserBoards.js** - Board management hook

### Utility Functions
- **roleUtils.js** - Role-based utility functions
- **userUtils.js** - User utility functions
- **debugPermissions.js** - Permission debugging utilities

### Services
- **api.js** - Axios-based API service with interceptors

---

## 🔐 Role-Based Access Control

### Role Hierarchy

| Role ID | Role Name | Description | Access Level |
|---------|-----------|-------------|--------------|
| 1 | admin | Full system access | All modules and functions |
| 2 | lead-scraper | Lead creation and management | Lead management only |
| 3 | sales | Lead conversion to customers | Leads and customer conversion |
| 4 | front-sales-manager | Sales team management | Sales team oversight |
| 5 | upseller | Customer management and upselling | Assigned customers only |
| 6 | upseller-manager | Upseller team management | Upseller team oversight |
| 7 | production | Production team access | Production-related modules |

### Permission System

#### Module-Based Permissions
- `users` - User management
- `roles` - Role management
- `leads` - Lead management
- `customers` - Customer management
- `sales` - Sales management
- `payments` - Payment management
- `projects` - Project management
- `tasks` - Task management
- `departments` - Department management
- `teams` - Team management
- `assignments` - Customer assignments
- `upseller_teams` - Upseller team management
- `upseller_targets` - Upseller target management
- `upseller_performance` - Upseller performance tracking
- `targets` - Target management
- `reminders` - Reminder management

#### Action-Based Permissions
- `create` - Create new records
- `read` - View records
- `update` - Modify records
- `delete` - Remove records
- `view` - View-only access

### Access Control Rules

#### Lead Scraper (role_id: 2)
- Can create and manage leads
- Can view own lead statistics
- Cannot access customer or sales data

#### Sales (role_id: 3)
- Can view and convert leads to customers
- Can create sales for converted customers
- Cannot access upseller-specific features

#### Upseller (role_id: 5)
- Can only access assigned customers
- Can create sales for assigned customers
- Can process payments for assigned customers
- Cannot access other upsellers' data

#### Upseller Manager (role_id: 6)
- Can manage upseller teams
- Can view all upseller performance
- Can assign customers to upsellers
- Cannot access individual upseller customer data

#### Admin (role_id: 1)
- Full access to all modules
- Can manage users, roles, and permissions
- Can view all data and statistics

---

## 🔄 Business Logic & Workflows

### Sales Pipeline Workflow

```
1. Lead Generation
   ├── Lead Scraper creates leads
   ├── Lead tracking and statistics
   └── Lead assignment to sales team

2. Lead Conversion
   ├── Sales team converts leads to customers
   ├── Customer record creation
   └── Lead deletion after conversion

3. Customer Assignment
   ├── Admin assigns customers to upsellers
   ├── Assignment tracking and history
   └── Access control enforcement

4. Project Management
   ├── Projects created for customers
   ├── Tasks assigned to departments
   └── Progress tracking and reporting

5. Payment Processing
   ├── Multiple payment types supported
   ├── Payment transaction tracking
   └── Invoice generation

6. Performance Tracking
   ├── Target setting and monitoring
   ├── Performance analytics
   └── Commission tracking
```

### Payment Processing Workflow

#### One-Time Payments
1. Sale created with `payment_type: 'one_time'`
2. Payment recorded in `sales.cash_in`
3. Payment transaction created
4. Customer totals updated

#### Installment Payments
1. Sale created with `payment_type: 'installments'`
2. Installments created in `payment_installments` table
3. Due dates calculated based on frequency
4. Payments processed against installments
5. Status updated based on payment completion

#### Recurring Payments
1. Sale created with `payment_type: 'recurring'`
2. Recurring schedule created in `payment_recurring` table
3. Next payment date calculated
4. Payments processed against recurring schedule
5. Status managed (active, paused, cancelled)

### Customer Assignment Workflow

1. **Assignment Creation**
   - Admin assigns customer to upseller
   - Previous assignments deactivated
   - New assignment created with 'active' status

2. **Access Control**
   - Upseller can only access assigned customers
   - Payment processing restricted to assigned customers
   - Sales creation limited to assigned customers

3. **Assignment Transfer**
   - Customer transferred to different upseller
   - Previous assignment marked as 'transferred'
   - New assignment created with 'active' status

4. **Performance Tracking**
   - Upseller statistics calculated from assigned customers
   - Commission tracking for assigned customers only
   - Performance metrics per upseller

### Task Management Workflow

1. **Task Creation**
   - Task created for project
   - Assigned to department and user
   - Added to appropriate board

2. **Task Progression**
   - Status changes tracked
   - Comments and activity logged
   - Checklists and attachments managed

3. **Task Completion**
   - Task marked as completed
   - Final status and completion date recorded
   - Project progress updated

---

## 🔒 Security Features

### Authentication Security
- **JWT Token-Based Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Token Expiration**: Automatic token expiration
- **Secure Headers**: CORS and security headers

### Authorization Security
- **Role-Based Access Control**: Granular permission system
- **Route Protection**: Middleware-based route protection
- **Data Isolation**: Users can only access authorized data
- **Permission Validation**: Server-side permission checking

### Data Security
- **SQL Injection Prevention**: Parameterized queries
- **Input Validation**: Server-side input validation
- **XSS Protection**: Input sanitization
- **File Upload Security**: File type and size validation

### API Security
- **Rate Limiting**: Request rate limiting
- **CORS Configuration**: Cross-origin request control
- **Error Handling**: Secure error messages
- **Audit Logging**: User activity tracking

---

## 🚀 Deployment Guide

### Prerequisites
- Node.js 14+
- MySQL/MariaDB 10.4+
- Git

### Environment Setup

#### Backend Environment Variables
Create `server/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=crm_db
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=production
```

#### Frontend Environment Variables
Create `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Installation Steps

1. **Clone Repository**
```bash
git clone <repository-url>
cd crm
```

2. **Install Backend Dependencies**
```bash
cd server
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../client
npm install
```

4. **Database Setup**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE crm_db;"

# Import database schema
mysql -u root -p crm_db < crm_db.sql

# Run migrations
cd server
node run_migration.js
```

5. **Start Development Servers**
```bash
# Start backend (Terminal 1)
cd server
npm start

# Start frontend (Terminal 2)
cd client
npm start
```

### Production Deployment

1. **Build Frontend**
```bash
cd client
npm run build
```

2. **Configure Production Environment**
```bash
# Update server/.env for production
DB_HOST=production_host
DB_USER=production_user
DB_PASSWORD=production_password
NODE_ENV=production
```

3. **Start Production Server**
```bash
cd server
npm start
```

### VPS Deployment
See `VPS_SETUP_GUIDE.md` for detailed VPS deployment instructions.

---

## 📊 Maintenance & Monitoring

### Database Maintenance
- **Regular Backups**: Automated database backups
- **Performance Monitoring**: Query performance tracking
- **Data Cleanup**: Regular cleanup of old records
- **Migration Management**: Schema update procedures

### Application Monitoring
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Response time monitoring
- **User Activity**: User behavior tracking
- **Security Audits**: Regular security assessments

### Business Metrics
- **Sales Performance**: Sales tracking and analytics
- **Customer Satisfaction**: Customer feedback monitoring
- **Payment Collection**: Payment collection rates
- **Project Completion**: Project delivery metrics
- **Team Performance**: Team productivity analytics

### Maintenance Scripts
- `server/clear_data.js` - Data cleanup utilities
- `server/fix_missing_payment_transactions.js` - Payment data repair
- `server/update_upseller_performance.js` - Performance data updates
- `server/vps-diagnostic.js` - VPS diagnostic tools

---

## 🔮 Future Enhancements

### Planned Features
- **Mobile Application**: React Native mobile app
- **Advanced Reporting**: Comprehensive analytics dashboard
- **Email Automation**: Automated email workflows
- **Document Management**: Advanced file management
- **Calendar Integration**: External calendar sync
- **Advanced Search**: Full-text search capabilities
- **Bulk Operations**: Mass data operations
- **API Webhooks**: Real-time event notifications
- **Real-time Notifications**: Live update system
- **Advanced Permissions**: Custom permission sets

### Integration Opportunities
- **Payment Processors**: Stripe, PayPal integration
- **CRM Systems**: Salesforce, HubSpot integration
- **Email Services**: SendGrid, Mailgun integration
- **Analytics Tools**: Google Analytics, Mixpanel integration
- **Communication Tools**: Slack, Microsoft Teams integration

---

## 📞 Support & Documentation

### Additional Documentation
- `CUSTOMER_ASSIGNMENT_MODULE_DOCUMENTATION.md` - Detailed assignment module docs
- `PAYMENT_SYSTEM_DOCUMENTATION.md` - Comprehensive payment system docs
- `PAYMENTS_MODULE_STATUS.md` - Payment module status
- `SALES_ROLE_RESTRICTIONS_DOCUMENTATION.md` - Sales role restrictions
- `VPS_SETUP_GUIDE.md` - VPS deployment guide

### API Documentation
- All API endpoints documented with parameters and responses
- Error codes and status messages documented
- Authentication and authorization requirements specified

### Code Documentation
- Comprehensive inline code comments
- Service layer documentation
- Database schema documentation
- Component documentation

---

## 🎉 Summary

This CRM system provides a comprehensive solution for managing the complete sales and customer relationship lifecycle. Key strengths include:

### ✅ **Completed Features**
- **Complete Authentication & Authorization System**
- **Comprehensive User Management**
- **Full Lead-to-Customer Pipeline**
- **Advanced Customer Assignment System**
- **Multi-Payment System with Custom Dates**
- **Complete Project & Task Management**
- **Department & Team Management**
- **Performance Tracking & Analytics**
- **Role-Specific Dashboards**
- **Real-Time Data Updates**

### 🏗️ **Architecture Benefits**
- **Modular Design**: Easy to maintain and extend
- **Scalable Architecture**: Handles growth efficiently
- **Security-First**: Comprehensive security measures
- **Performance Optimized**: Efficient database queries and caching
- **User-Friendly**: Intuitive interface design

### 🔧 **Technical Excellence**
- **Modern Technology Stack**: Latest frameworks and libraries
- **Clean Code Architecture**: Well-structured and documented
- **Comprehensive Testing**: Thoroughly tested functionality
- **Production Ready**: Deployed and running in production

The system successfully manages the complete business workflow from lead generation through project delivery and payment processing, providing a solid foundation for business growth and customer relationship management.

---

*This documentation is comprehensive and covers all aspects of the CRM system. For specific implementation details, refer to the individual module documentation files and source code comments.*
