# Task Assignment Workflow - Complete Implementation Plan

## 🎯 Workflow Overview

```
Task Creation → Department Leader Assigns to Member → Member Updates Status
```

## Current State Analysis

### ✅ What Exists
1. **Task Creation**: Tasks can be created from project details
2. **Database Structure**: `project_tasks` table with `assigned_to` field
3. **Task Management Module**: Basic task viewing exists
4. **Department Structure**: Departments with members exist

### ❌ What's Missing
1. **Department Leader Task Assignment Interface**: No UI for leaders to assign tasks
2. **Member Task View**: No filtered view for department members
3. **Status Update for Members**: No simplified interface for members to update task status
4. **Task Assignment Logic**: No API endpoints for department-specific task assignment

---

## 📋 Required Implementation

### 1. Backend Changes

#### A. Update Task Service - Get Tasks by Department
**File**: `server/services/taskService.js`

Add method to get tasks by department with user information:
```javascript
static async getTasksByDepartment(departmentId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        pt.*,
        p.project_name,
        u_assigned.name as assigned_to_name,
        u_assigned.email as assigned_to_email,
        u_creator.name as created_by_name,
        d.department_name,
        ts.status_name,
        ts.status_color
      FROM project_tasks pt
      INNER JOIN projects p ON pt.project_id = p.id
      INNER JOIN departments d ON pt.department_id = d.id
      LEFT JOIN users u_assigned ON pt.assigned_to = u_assigned.id
      LEFT JOIN users u_creator ON pt.created_by = u_creator.id
      LEFT JOIN task_statuses ts ON pt.status = ts.status_name
      WHERE pt.department_id = ?
      ORDER BY pt.created_at DESC
    `;
    
    db.query(sql, [departmentId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}
```

#### B. Update Task Routes - Add Member Assignment Endpoint
**File**: `server/routes/tasks.js`

Add endpoint for department leaders to assign tasks:
```javascript
// Assign task to department member
router.post('/:id/assign', auth, authorize('tasks', 'update'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const { assigned_to } = req.body;
    
    // Verify task belongs to leader's department
    const task = await TaskService.getTaskById(taskId);
    const userDepartment = await DepartmentService.getUserDepartment(req.user.id);
    
    if (userDepartment?.department_id !== task.department_id) {
      return res.status(403).json({ message: 'Not authorized to assign this task' });
    }
    
    // Update task
    await TaskService.updateTask(taskId, { assigned_to });
    
    res.json({ message: 'Task assigned successfully' });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ message: 'Error assigning task' });
  }
});
```

### 2. Frontend Changes

#### A. Department Leader Dashboard - Task Assignment UI
**File**: `client/src/pages/DepartmentLeaderDashboard.js`

Add task assignment functionality to existing Kanban board:
- Add dropdown to assign/unassign members to tasks
- Show currently assigned member
- Allow reassignment
- Display task details (description, due date, priority)

Key changes:
1. Add task assignment modal
2. Fetch department members for assignment dropdown
3. Update task when assigned
4. Show assignment status in task cards

#### B. Team Member Dashboard - Task List View
**File**: `client/src/pages/TeamMemberDashboard.js`

Enhance existing task list to include:
1. **Filter by Assignment**: Show only tasks assigned to logged-in member
2. **Status Update**: Add status dropdown on each task
3. **Task Details**: Click to view full task details
4. **Quick Status Update**: Update status without modal

Key changes:
1. Add filter for `assigned_to = current_user_id`
2. Add status update buttons (Pending → In Progress → Completed)
3. Show department name and project name
4. Add task details modal with full information

#### C. Task Management Module Updates
**File**: `client/src/pages/TaskManagement.js`

Add department filtering and user context awareness:
1. **Department Context**: If user is department leader/member, filter by their department
2. **Assignment Interface**: Show assigned_to dropdown with department members
3. **Role-Based Actions**: 
   - Leaders: Can assign tasks
   - Members: Can only update status of assigned tasks

---

## 🔄 Complete Flow

### Scenario 1: Department Leader Assigns Task to Member

1. **Task Created** (e.g., from Project Details)
   - Task has `department_id`
   - Status: "New Task"
   - `assigned_to`: NULL

2. **Department Leader Opens Dashboard**
   - Sees task in "Pending" column
   - Clicks "Assign" button on task card

3. **Assignment Modal Opens**
   - Shows list of department members
   - Leader selects member
   - Confirms assignment

4. **Backend Updates Task**
   - Sets `assigned_to = selected_member_id`
   - Status remains "New Task"

5. **Member Views Their Tasks**
   - Opens Team Member Dashboard
   - Sees task in "My Tasks"
   - Can change status to "In Progress"

### Scenario 2: Member Updates Task Status

1. **Member Opens Dashboard**
   - Sees assigned tasks
   - Clicks on a task

2. **Task Details Open**
   - Member sees full task information
   - Sees status dropdown

3. **Member Changes Status**
   - Selects new status (e.g., "In Progress")
   - Confirms update

4. **Status Updated**
   - Task moves to appropriate column
   - Activity logged
   - Department leader sees update

---

## 📝 Implementation Checklist

### Backend
- [ ] Add `getTasksByDepartment()` method to TaskService
- [ ] Add `assignTask()` method to TaskService
- [ ] Add `/tasks/:id/assign` endpoint
- [ ] Add `/tasks/department/:departmentId` endpoint
- [ ] Verify user authorization for task assignment

### Frontend - Department Leader Dashboard
- [ ] Add "Assign Task" button to task cards
- [ ] Create task assignment modal
- [ ] Add member selection dropdown
- [ ] Fetch department members
- [ ] Show currently assigned member
- [ ] Add reassignment functionality
- [ ] Update UI after assignment

### Frontend - Team Member Dashboard
- [ ] Filter tasks by `assigned_to = current_user_id`
- [ ] Add status change buttons
- [ ] Add task details modal
- [ ] Show task status dropdown
- [ ] Add quick status update functionality
- [ ] Show assignment status

### Frontend - Task Management Module
- [ ] Add department filtering
- [ ] Show assignment interface for leaders
- [ ] Add role-based action restrictions
- [ ] Update task cards to show assigned user

### Testing
- [ ] Test task assignment as department leader
- [ ] Test status update as team member
- [ ] Test unauthorized access attempts
- [ ] Test cross-department task visibility
- [ ] Test task reassignment

---

## 🎨 UI/UX Considerations

### Department Leader View
- **Task Cards**: Show "Unassigned" badge if no assignee
- **Assign Button**: Icon next to task
- **Assignment Modal**: 
  - Member list with search
  - Currently assigned member highlighted
  - "Assign" and "Reassign" buttons

### Team Member View
- **Task Filter**: "My Tasks" tab
- **Status Indicators**: Color-coded badges
- **Quick Actions**: Status dropdown on each card
- **Task Details**: Full view with all information

### Both Views
- **Real-time Updates**: Refresh when status changes
- **Activity Log**: Show recent status changes
- **Notifications**: Alert when task assigned/updated

---

## 🚀 Next Steps

1. **Implement Backend APIs** (Priority 1)
2. **Update Department Leader Dashboard** (Priority 2)
3. **Update Team Member Dashboard** (Priority 3)
4. **Update Task Management Module** (Priority 4)
5. **Test Complete Flow** (Priority 5)

---

## 💡 Additional Features (Future Enhancements)

- **Bulk Assignment**: Assign multiple tasks at once
- **Task Templates**: Create task templates for departments
- **Automated Workflow**: Auto-assign based on workload
- **Task Comments**: Allow members to add comments
- **Task Time Tracking**: Track hours spent on tasks
- **Task Dependencies**: Link related tasks
- **Task Notifications**: Email/In-app notifications

