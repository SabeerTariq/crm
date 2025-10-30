# Production Dashboard Analysis & Implementation Plan

## 📊 Current System Analysis

### Existing Structure

#### 1. **Departments**
- **Table**: `departments`
- **Roles**: team_leader, team_member (defined in `department_team_members` table)
- **Structure**: Users are assigned to departments with specific roles
- **Fields**: department_name, description, is_active

#### 2. **Projects**
- **Table**: `projects`
- **Links to**: customers, upsellers, project managers
- **Fields**: project_name, status, priority, budget, dates
- **Has**: Department associations via `project_departments`

#### 3. **Tasks**
- **Table**: `project_tasks`
- **Links to**: projects, departments, users (assigned_to)
- **Fields**: task_name, status, priority, assigned_to, due_date
- **Features**: Comments, attachments, checklists, activity tracking
- **Has**: Board-based Kanban view

#### 4. **Boards**
- **Table**: `boards`
- **Links to**: departments
- **Purpose**: Kanban boards for departments
- **Features**: Custom statuses, task organization

### Current Flow

```
Customer → Project → Project Departments → Tasks → Assignments
                                           ↓
                                    Department Members
```

### Current Role Structure (from database)
```sql
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Full access'),
(2, 'lead-scraper', NULL),
(3, 'sales', ''),
(4, 'front-sales-manager', NULL),
(5, 'upseller', 'Create Upsells and Manage Projects'),
(6, 'upseller-manager', 'Manage Upsell Teams and Performance'),
(7, 'production', '');
```

**Current Issue**: There's a generic "production" role but no specific production department roles

---

## 🎯 Proposed Production Dashboard Architecture

### New Roles to Create

```sql
-- Production Management Roles
(8, 'production-head', 'Overall production management'),
(9, 'designer-lead', 'Design department leadership'),
(10, 'designer-member', 'Design team member'),
(11, 'developer-lead', 'Development department leadership'),
(12, 'developer-member', 'Development team member'),
(13, 'seo-lead', 'SEO department leadership'),
(14, 'seo-member', 'SEO team member'),
(15, 'content-lead', 'Content department leadership'),
(16, 'content-member', 'Content team member'),
(17, 'qa-lead', 'QA department leadership'),
(18, 'qa-member', 'QA team member');
```

### Hierarchy & Access Control

```
┌─────────────────────────────────────┐
│   PRODUCTION HEAD (Role 8)          │
│   Sees: ALL departments & teams     │
│   - All tasks across all depts      │
│   - All performance metrics         │
│   - Cross-department analytics      │
└───────────┬─────────────────────────┘
            │
    ┌───────┼───────┬──────────┬────────────┐
    │       │       │          │            │
┌───▼───┐ ┌─▼───┐ ┌─▼──┐ ┌────▼───┐ ┌────▼────┐
│Design │ │Dev  │ │SEO │ │Content │ │  QA     │
└───┬───┘ └───┬─┘ └───┬─┘ └────┬───┘ └────┬────┘
    │         │        │        │         │
┌───▼───┐ ┌──▼───┐ ┌──▼──┐ ┌───▼───┐ ┌───▼────┐
│Lead   │ │Lead  │ │Lead │ │Lead   │ │Lead    │
│(9)    │ │(11)  │ │(13) │ │(15)   │ │(17)    │
└───┬───┘ └───┬──┘ └───┬─┘ └───┬───┘ └───┬────┘
    │         │        │        │         │
┌───▼───┐ ┌──▼───┐ ┌──▼──┐ ┌───▼───┐ ┌───▼────┐
│Member │ │Member│ │Mem  │ │Member │ │Member   │
│(10)   │ │(12)  │ │(14) │ │(16)   │ │(18)     │
```

### Dashboard Access Matrix

| Role | Own Tasks | Team Tasks | Dept Tasks | All Tasks | Dept Performance | All Performance |
|------|----------|------------|------------|-----------|------------------|-----------------|
| Production Head | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dept Leader | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Team Member | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🗄️ Database Requirements

### Additional Tables Needed

#### 1. Production Teams Table (Already exists: `department_team_members`)
**Current Structure**:
```sql
CREATE TABLE department_team_members (
  id INT PRIMARY KEY,
  department_id INT,
  user_id INT,
  role ENUM('team_leader', 'team_member'),
  is_active BOOLEAN
);
```

**Modification Needed**: Add `production_role_id` field
```sql
ALTER TABLE department_team_members 
ADD COLUMN production_role_id INT REFERENCES roles(id);
```

#### 2. Production Performance Tracking Table
```sql
CREATE TABLE production_performance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  department_id INT NOT NULL,
  project_id INT,
  task_id INT,
  date_tracked DATE NOT NULL,
  tasks_completed INT DEFAULT 0,
  tasks_assigned INT DEFAULT 0,
  hours_logged DECIMAL(5,2) DEFAULT 0,
  efficiency_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (task_id) REFERENCES project_tasks(id),
  INDEX idx_user_dept (user_id, department_id),
  INDEX idx_date (date_tracked)
);
```

---

## 🛠️ Backend API Endpoints Needed

### Production Head Dashboard (`/api/production-head/dashboard`)
```javascript
GET /api/production-head/dashboard
Response: {
  userInfo: { id, name, role },
  departments: [
    {
      id, name,
      members: [...],
      stats: {
        total_tasks, completed_tasks, efficiency
      }
    }
  ],
  overallStats: {
    total_tasks: 150,
    completed_tasks: 85,
    pending_tasks: 65,
    avg_efficiency: 87.5,
    department_breakdown: [...]
  },
  recentTasks: [...],
  performanceTrends: [...]
}
```

### Department Leader Dashboard (`/api/production-leader/dashboard/:departmentId`)
```javascript
GET /api/production-leader/dashboard/:departmentId
Response: {
  departmentInfo: { id, name, leader_id },
  teamMembers: [
    {
      id, name,
      tasks_completed: 12,
      tasks_pending: 3,
      efficiency: 85.5,
      avg_completion_time: 2.5
    }
  ],
  departmentTasks: [...],
  stats: {
    total_tasks, completed_tasks, efficiency
  }
}
```

### Team Member Dashboard (`/api/production-member/dashboard`)
```javascript
GET /api/production-member/dashboard
Response: {
  userInfo: { id, name, department },
  myTasks: [...],
  stats: {
    tasks_completed: 15,
    tasks_pending: 8,
    efficiency: 88.2,
    current_streak: 7
  }
}
```

---

## 🎨 Frontend Dashboard Components

### 1. ProductionHeadDashboard.js
**Features**:
- Multi-department overview cards
- Department performance comparison chart
- Task distribution pie chart
- Team member performance list
- Recent activity feed
- Filter by department, date range

### 2. DepartmentLeaderDashboard.js
**Features**:
- Team members list with performance
- Department tasks Kanban view
- Task assignment interface
- Performance metrics dashboard
- Team workload distribution
- Member efficiency reports

### 3. TeamMemberDashboard.js
**Features**:
- Personal task list
- Task completion tracking
- Personal performance metrics
- Completed tasks history
- Pending tasks priority view
- Efficiency score display

---

## 📋 Implementation Steps

### Phase 1: Database & Roles (Day 1)
1. Create new roles (8-18)
2. Create `production_performance` table
3. Update `department_team_members` with `production_role_id`
4. Create migration file
5. Run migration

### Phase 2: Backend APIs (Day 2-3)
1. Create production routes directory
2. Implement Production Head dashboard API
3. Implement Department Leader dashboard API
4. Implement Team Member dashboard API
5. Add permission checks
6. Test all endpoints

### Phase 3: Frontend Dashboards (Day 4-5)
1. Create ProductionHeadDashboard component
2. Create DepartmentLeaderDashboard component
3. Create TeamMemberDashboard component
4. Add routing in App.js
5. Update Sidebar navigation

### Phase 4: Integration & Testing (Day 6)
1. Test role-based access
2. Test performance tracking
3. Test task assignment
4. UI/UX refinements
5. Documentation

---

## 🚀 Next Steps

Would you like me to:

1. **Start with Phase 1**: Create database migration and roles
2. **Start with Phase 2**: Build backend APIs first
3. **Create a detailed implementation plan** for each component
4. **Focus on a specific role** first (e.g., start with Department Leader)
5. **Something else**?

Let me know your preference and I'll begin implementation!
