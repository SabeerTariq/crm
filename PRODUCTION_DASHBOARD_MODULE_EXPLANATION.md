# Production Dashboard Module - How It Works

## 🎯 Module Overview

The Production Dashboard module provides a **3-tier hierarchy** for managing production teams and tasks across different departments (Design, Development, SEO, Content, QA).

### Hierarchy Structure

```
Production Head (Level 1)
    ↓
    ├─ Department Leaders (Level 2)
    │   ├─ Designer Lead
    │   ├─ Developer Lead
    │   ├─ SEO Lead
    │   ├─ Content Lead
    │   └─ QA Lead
    │       ↓
    │       └─ Team Members (Level 3)
    │           ├─ Designer Member
    │           ├─ Developer Member
    │           ├─ SEO Member
    │           ├─ Content Member
    │           └─ QA Member
```

---

## 🗄️ Database Structure

### Core Tables

#### 1. **users** Table
- Stores all users in the system
- Has `role_id` field that links to `roles` table
- Production users have role_id 8-18

#### 2. **roles** Table
```sql
id | name
8  | production-head
9  | designer-lead
10 | designer-member
11 | developer-lead
12 | developer-member
13 | seo-lead
14 | seo-member
15 | content-lead
16 | content-member
17 | qa-lead
18 | qa-member
```

#### 3. **departments** Table
```sql
id | department_name | description
13 | Development     | Development team
15 | Design          | Design team
```

#### 4. **department_team_members** Table
Links users to departments with their production role:
```sql
id | department_id | user_id | role           | production_role_id | is_active
1  | 13           | 10     | team_leader   | 11                | 1
2  | 13           | 11     | team_member    | 12                | 1
```

#### 5. **projects** Table
Main projects linked to customers

#### 6. **project_departments** Table
Links departments to specific projects

#### 7. **project_tasks** Table
Tasks assigned to team members

#### 8. **production_performance** Table (NEW)
Tracks efficiency and performance metrics:
```sql
- user_id
- department_id
- project_id
- task_id
- date_tracked
- tasks_completed
- tasks_assigned
- hours_logged
- efficiency_score
```

---

## 🔄 Data Flow

### Scenario: A New Project Starts

1. **Project Creation** (by Admin/Upseller)
   ```
   - Project created in `projects` table
   - Linked to customer
   ```

2. **Department Assignment** (by Admin)
   ```
   - Project linked to departments in `project_departments`
   - Each department gets project_dept record
   - Team leader assigned via `team_leader_id` field
   ```

3. **Task Creation** (by Admin/Leader)
   ```
   - Tasks created in `project_tasks` table
   - Linked to: project_id, department_id, assigned_to (user_id)
   - Task has: status, priority, due_date, estimated_hours
   ```

4. **Task Assignment** (by Leader)
   ```
   - Tasks assigned to team members
   - `assigned_to` field points to user_id
   ```

5. **Task Completion** (by Member)
   ```
   - Member updates task status to 'completed'
   - Performance tracked in `production_performance`
   - Efficiency calculated automatically
   ```

---

## 🎛️ API Endpoints & Data Flow

### 1. Production Head Dashboard API

**Endpoint**: `GET /api/production/production-head/dashboard`

**Backend Process**:
```javascript
1. Check user role (must be role_id = 8)
2. Query all departments:
   - Get department info
   - Count team members
   - Count active projects
   - Count tasks (completed + pending)
3. Get overall statistics:
   - Total projects across all departments
   - Total tasks across all departments
   - Completed vs pending ratio
4. Get department performance metrics:
   - For each department
   - Calculate completion rates
   - Calculate average efficiency
5. Get recent tasks (last 20)
6. Return combined data
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "userId": 8,
    "departments": [...],  // All departments with stats
    "overallStats": {
      "total_projects": 15,
      "total_tasks": 120,
      "completed_tasks": 80,
      "pending_tasks": 40,
      "avg_completion_time": 2.5
    },
    "departmentStats": [...],  // Performance by department
    "recentTasks": [...]  // Latest 20 tasks
  }
}
```

**Frontend Display**:
- 4 statistics cards at top
- Grid showing all departments
- Performance comparison table
- Recent tasks list

---

### 2. Department Leader Dashboard API

**Endpoint**: `GET /api/production/leader/dashboard?department_id=X`

**Backend Process**:
```javascript
1. Verify user is leader of department X
2. Query department info
3. Get team members:
   - All users in this department
   - Their task completion stats
   - Their efficiency scores
   - Hours logged
4. Get department tasks:
   - All tasks for this department
   - Filtered by status
   - Include project info, assignee info
5. Calculate department statistics
6. Return combined data
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "department": {
      "id": 13,
      "department_name": "Development",
      "description": "Development team"
    },
    "teamMembers": [
      {
        "id": 10,
        "name": "John Doe",
        "role": "team_leader",
        "tasks_completed": 15,
        "tasks_pending": 3,
        "efficiency_score": 87.5,
        "total_hours": 120.5
      }
    ],
    "tasks": [...],  // All department tasks
    "stats": {
      "total_tasks": 50,
      "completed_tasks": 35,
      "pending_tasks": 15,
      "team_size": 5,
      "avg_efficiency": 82.3
    }
  }
}
```

**Frontend Display**:
- 5 statistics cards
- Team members grid with performance
- 4-column Kanban board (Pending, In Progress, Review, Completed)
- Task details with priority badges

---

### 3. Team Member Dashboard API

**Endpoint**: `GET /api/production/member/dashboard`

**Backend Process**:
```javascript
1. Get user's department assignment
2. Get all tasks assigned to this user:
   - Across all projects
   - In their department
   - Ordered by status and priority
3. Get performance statistics:
   - Tasks completed this period
   - Tasks pending
   - Efficiency score
4. Return personal dashboard data
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "userId": 12,
    "department": {
      "id": 13,
      "name": "Development"
    },
    "tasks": [...],  // Only this user's tasks
    "stats": {
      "tasks_completed": 8,
      "tasks_pending": 5,
      "total_tasks": 13,
      "efficiency_score": 85.5
    }
  }
}
```

**Frontend Display**:
- 4 personal statistics cards
- Task completion progress bar
- Filter tabs (All, Pending, In Progress, Completed)
- Task cards with details
- Priority and status badges

---

## 🔐 Access Control & Security

### Role Verification Flow

```javascript
// Every API request:
1. Extract token from Authorization header
2. Verify token is valid (auth middleware)
3. Get user from token
4. Check user's role_id
5. Verify user has required role for endpoint
6. Check user's department membership (for leaders)
7. Filter data based on user's access level
8. Return appropriate data
```

### Access Levels

#### Production Head (Role 8)
- ✅ Sees ALL departments
- ✅ Sees ALL teams
- ✅ Sees ALL tasks
- ✅ Sees ALL performance data
- ✅ Full cross-department analytics

#### Department Leader (Roles 9, 11, 13, 15, 17)
- ✅ Sees OWN department only
- ✅ Sees team members in department
- ✅ Sees department tasks only
- ✅ Sees team performance
- ❌ Cannot see other departments

#### Team Member (Roles 10, 12, 14, 16, 18)
- ✅ Sees OWN tasks only
- ✅ Sees OWN performance
- ❌ Cannot see team data
- ❌ Cannot see other members' tasks

---

## 🎨 Frontend Components Structure

### ProductionHeadDashboard.js

```javascript
Component Structure:
├── Header (welcome message)
├── Statistics Grid
│   ├── Total Projects Card
│   ├── Total Tasks Card
│   ├── Completion Rate Card
│   └── Pending Tasks Card
├── Departments Overview Section
│   └── Department Grid
│       └── DepartmentCard (for each dept)
│           ├── Department name
│           ├── Team size
│           ├── Active projects count
│           ├── Completed/Pending tasks
│           └── Progress bar
├── Performance Metrics Table
│   └── DepartmentStatsTable
└── Recent Tasks Section
    └── Task List (last 20 tasks)
```

### DepartmentLeaderDashboard.js

```javascript
Component Structure:
├── Header (department name)
├── Statistics Cards (5 cards)
├── Team Members Section
│   └── TeamMemberCard (for each member)
│       ├── Avatar
│       ├── Name and role
│       ├── Tasks completed
│       ├── Tasks pending
│       └── Efficiency bar
└── Kanban Board
    ├── Pending Column
    ├── In Progress Column
    ├── Review Column
    └── Completed Column
    │   └── TaskCard (for each task in status)
    │       ├── Task name
    │       ├── Description snippet
    │       ├── Priority badge
    │       ├── Due date
    │       └── Assignee name
```

### TeamMemberDashboard.js

```javascript
Component Structure:
├── Header (personal welcome)
├── Statistics Cards (4 cards)
├── Progress Bar Section
│   ├── Completion percentage
│   └── Animated progress bar
├── Filter Tabs
│   ├── All button
│   ├── Pending button
│   ├── In Progress button
│   └── Completed button
└── Tasks List Section
    └── TaskCard (filtered by selected tab)
        ├── Task name
        ├── Project name
        ├── Description
        ├── Status badge (with icon)
        ├── Priority badge
        └── Due date
```

---

## 🔄 Real-World Example Flow

### Example: Design Team Working on Project

**Setup**:
1. Project "E-commerce Website" created
2. Project linked to Design department
3. Designer Lead (role_id: 9) assigned as team_leader
4. 3 Designer Members (role_id: 10) assigned to department

**Task Flow**:
1. **Admin creates tasks**:
   ```
   - Task 1: "Design homepage" → assigned to Designer A
   - Task 2: "Design product pages" → assigned to Designer B
   - Task 3: "Design checkout flow" → assigned to Designer C
   ```

2. **Designer A sees task** (Team Member Dashboard):
   ```
   - Login as Designer A
   - Navigate to Team Member Dashboard
   - See "Design homepage" in "Pending" column
   - Task shows: priority, due date, project name
   ```

3. **Designer A starts work**:
   ```
   - Move task to "In Progress"
   - Task appears in their dashboard's "In Progress" tab
   ```

4. **Designer A completes work**:
   ```
   - Move task to "Completed"
   - Task appears in their dashboard's "Completed" tab
   - Performance updated: tasks_completed += 1
   ```

5. **Designer Lead monitors** (Department Leader Dashboard):
   ```
   - Login as Designer Lead
   - Navigate to Department Leader Dashboard
   - See team members' progress:
     * Designer A: 8 tasks completed, 2 pending
     * Designer B: 12 tasks completed, 1 pending
     * Designer C: 5 tasks completed, 3 pending
   - See department Kanban board with all tasks
   - See overall completion rate: 85%
   - See average efficiency: 88%
   ```

6. **Production Head monitors** (Production Head Dashboard):
   ```
   - Login as Production Head
   - Navigate to Production Head Dashboard
   - See Design department metrics:
     * Team size: 3 members + 1 leader = 4
     * Total tasks: 16
     * Completed: 25
     * Pending: 6
     * Completion rate: 81%
     * Efficiency: 88%
   - Compare with other departments
   - See recent tasks across all departments
   ```

---

## 📊 Performance Tracking

### Automatic Efficiency Calculation

**Formula**:
```javascript
efficiency = (tasks_completed / tasks_assigned) * 100

Example:
- User has 20 tasks assigned
- User completes 18 tasks
- Efficiency = (18 / 20) * 100 = 90%
```

**When Efficiency Updates**:
- After task status change to 'completed'
- After task is assigned to user
- Daily summary updates
- Department leader views their dashboard
- Production head views their dashboard

---

## 🎯 Key Features Explained

### 1. Multi-Level Visibility
- **Production Head**: Top-level view of entire production
- **Department Leaders**: Department-level view and management
- **Team Members**: Personal task view only

### 2. Real-Time Updates
- Data fetched on every dashboard load
- Fresh statistics
- Current task statuses
- Updated performance metrics

### 3. Visual Task Management
- Kanban board for visual workflow
- Color-coded statuses
- Priority badges
- Due date tracking

### 4. Performance Analytics
- Efficiency scores per team member
- Department completion rates
- Cross-department comparison
- Historical performance tracking

### 5. Role-Based Access
- Each role sees appropriate data
- Security at API level
- No unauthorized data access
- Smooth permission checks

---

## 🚀 How to Use the Module

### As Production Head:
1. Login with production-head account
2. Click "Production Dashboard" in sidebar
3. View all departments at a glance
4. Monitor overall production health
5. Track cross-department performance
6. Review recent tasks across all teams

### As Department Leader:
1. Login with department leader account (e.g., designer-lead)
2. Navigate to department leader dashboard (via department ID)
3. View team members and their performance
4. See all department tasks in Kanban view
5. Track department statistics
6. Monitor team efficiency

### As Team Member:
1. Login with team member account (e.g., designer-member)
2. Navigate to team member dashboard
3. View assigned tasks
4. Track personal progress
5. See efficiency score
6. Filter tasks by status

---

## 🔧 Technical Implementation

### Frontend
- **React** components
- **Axios** for API calls
- **React Router** for navigation
- **CSS** for styling
- **Conditional rendering** based on role

### Backend
- **Node.js** with Express
- **MySQL** database
- **JWT** authentication
- **Role-based middleware**
- **SQL queries** for data aggregation

### Security
- **Token-based** authentication
- **Role verification** on every request
- **Data filtering** by user access level
- **SQL injection** prevention
- **XSS** protection

---

## ✅ Module Benefits

1. **Centralized Management**: Production Head sees everything
2. **Department Focus**: Leaders focus on their teams
3. **Personal Tracking**: Members track own work
4. **Performance Insights**: Real metrics and analytics
5. **Visual Organization**: Kanban boards for clarity
6. **Efficient Workflow**: Clear task status tracking
7. **Scalable**: Works for any department size
8. **Secure**: Role-based access control

---

## 📝 Summary

The Production Dashboard Module provides a **complete production management solution** with:
- ✅ 3-tier hierarchy (Head → Leaders → Members)
- ✅ Role-based dashboards
- ✅ Performance tracking
- ✅ Task management (Kanban)
- ✅ Real-time data
- ✅ Secure access control
- ✅ Beautiful UI/UX
- ✅ Fully responsive design

**Everything is integrated and ready to use!** 🎉

