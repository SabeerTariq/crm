# Production Dashboard Locations & Access Guide

## 📍 Dashboard Locations

### 1. Production Head Dashboard
**Route**: `/production-head-dashboard`  
**Component**: `client/src/pages/ProductionHeadDashboard.js`  
**API**: `GET /api/production/production-head/dashboard`  
**Access**: Role ID 8 (production-head)

**Features**:
- Overall statistics for all departments
- Department grid overview
- Performance comparison table
- Recent tasks across all departments

**Access Methods**:
1. **Login**: Production Head users automatically redirected after login
2. **Sidebar**: Click "Production Dashboard" in sidebar (only visible to production-head role)
3. **Direct URL**: Navigate to `/production-head-dashboard`

---

### 2. Department Leader Dashboard
**Route**: `/department-leader-dashboard/:departmentId`  
**Component**: `client/src/pages/DepartmentLeaderDashboard.js`  
**API**: `GET /api/production/leader/dashboard?department_id=X`  
**Access**: Role IDs 9, 11, 13, 15, 17 (department leaders)

**Features**:
- Department-specific statistics (5 cards)
- Team members performance grid
- 4-column Kanban board (Pending, In Progress, Review, Completed)
- Task management interface

**Access Methods**:
1. **Login**: Department leaders automatically redirected after login
   - First go to `/production-head-dashboard`
   - Then automatically redirected to `/department-leader-dashboard/{their_department_id}`
2. **Sidebar**: Click "My Department" in sidebar (only visible to department leaders)
3. **Direct URL**: Navigate to `/department-leader-dashboard/{departmentId}`

**How Auto-Redirect Works**:
```javascript
// In ProductionHeadDashboard.js
useEffect(() => {
  if (hasProductionLeadRole()) {
    fetch('/production/user/department')
      .then(response => {
        navigate(`/department-leader-dashboard/${response.data.department_id}`);
      });
  }
}, []);
```

---

### 3. Team Member Dashboard
**Route**: `/team-member-dashboard`  
**Component**: `client/src/pages/TeamMemberDashboard.js`  
**API**: `GET /api/production/member/dashboard`  
**Access**: Role IDs 10, 12, 14, 16, 18 (team members)

**Features**:
- Personal task statistics (4 cards)
- Task completion progress bar
- Filter tabs (All, Pending, In Progress, Completed)
- Personal task list with details
- Efficiency score display

**Access Methods**:
1. **Login**: Team members automatically redirected after login
2. **Sidebar**: Click "My Tasks" in sidebar (only visible to team members)
3. **Direct URL**: Navigate to `/team-member-dashboard`

---

## 🔐 Role-Based Access Matrix

### Production Head (Role ID: 8)
**Routes they can access**:
- ✅ `/production-head-dashboard` (primary dashboard)

**What they see**:
- All departments
- All teams
- All tasks
- All performance data
- Cross-department analytics

**Sidebar Menu**:
- "Production Dashboard" → `/production-head-dashboard`

---

### Department Leaders (Role IDs: 9, 11, 13, 15, 17)
**Routes they can access**:
- ✅ `/production-head-dashboard` (redirects to their department)
- ✅ `/department-leader-dashboard/{their_department_id}`

**What they see**:
- Their department only
- Their team members
- Their department tasks
- Team performance
- Department statistics

**Sidebar Menu**:
- "My Department" → `/production-head-dashboard` (auto-redirects to department dashboard)

**Auto-Redirect Mechanism**:
1. Leader logs in
2. Redirected to `/production-head-dashboard`
3. Component detects leader role
4. Fetches their department_id from API
5. Automatically navigates to `/department-leader-dashboard/{department_id}`

---

### Team Members (Role IDs: 10, 12, 14, 16, 18)
**Routes they can access**:
- ✅ `/team-member-dashboard` (only dashboard)

**What they see**:
- Their own tasks only
- Their personal performance
- Their efficiency score
- Task completion progress

**Sidebar Menu**:
- "My Tasks" → `/team-member-dashboard`

---

## 🚀 How to Access

### For Production Head:
1. Login with production-head credentials
2. Auto-redirected to `/production-head-dashboard`
3. Or click "Production Dashboard" in sidebar
4. See all departments and overall statistics

### For Department Leaders:
1. Login with department leader credentials (e.g., designer-lead)
2. Redirected to `/production-head-dashboard`
3. Auto-redirected to `/department-leader-dashboard/{departmentId}`
4. Or click "My Department" in sidebar
5. See team members and department tasks in Kanban view

### For Team Members:
1. Login with team member credentials (e.g., designer-member)
2. Auto-redirected to `/team-member-dashboard`
3. Or click "My Tasks" in sidebar
4. See personal tasks and performance metrics

---

## 🔄 Navigation Flow Diagram

```
Login
  ↓
Check role_id
  ↓
  ├─ 8 (Production Head)
  │   └─ /production-head-dashboard
  │
  ├─ 9,11,13,15,17 (Department Leaders)
  │   ├─ /production-head-dashboard (first)
  │   └─ Auto-redirect to /department-leader-dashboard/{departmentId}
  │
  └─ 10,12,14,16,18 (Team Members)
      └─ /team-member-dashboard
```

---

## 📂 File Locations

### Frontend Components
```
client/src/pages/
├── ProductionHeadDashboard.js      ← Production Head dashboard
├── DepartmentLeaderDashboard.js       ← Department Leader dashboard
└── TeamMemberDashboard.js             ← Team Member dashboard
```

### Backend APIs
```
server/routes/production.js
├── GET /production-head/dashboard
├── GET /leader/dashboard?department_id=X
├── GET /member/dashboard
└── GET /user/department (new - fetches user's department)
```

### Routing
```
client/src/App.js
├── /production-head-dashboard → ProductionHeadDashboard
├── /department-leader-dashboard/:departmentId → DepartmentLeaderDashboard
└── /team-member-dashboard → TeamMemberDashboard
```

### Sidebar Navigation
```
client/src/components/Sidebar.js
├── Production Head: "Production Dashboard" menu item
├── Department Leaders: "My Department" menu item
└── Team Members: "My Tasks" menu item
```

---

## 🎯 Summary

**All Three Dashboards Are Integrated**:
- ✅ ProductionHeadDashboard - Accessible via `/production-head-dashboard`
- ✅ DepartmentLeaderDashboard - Accessible via `/department-leader-dashboard/:departmentId`
- ✅ TeamMemberDashboard - Accessible via `/team-member-dashboard`

**Auto-Redirect Logic**:
- Production Head → Goes to production-head-dashboard
- Department Leaders → Auto-redirected to their department dashboard
- Team Members → Goes to team-member-dashboard

**Sidebar Navigation**:
- Each role sees appropriate menu items
- Automatic redirection for department leaders
- Easy access to dashboards

**Everything is connected and working!** 🎉

