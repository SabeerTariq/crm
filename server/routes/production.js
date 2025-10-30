const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Get production head dashboard data
router.get('/production-head/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verify user is production head
    const userRoleCheck = await new Promise((resolve, reject) => {
      db.query(
        `SELECT r.id, r.name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ? AND r.name = 'production-head'`,
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    if (userRoleCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Production head role required.'
      });
    }

    // Get all departments with team members
    const departments = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          d.id,
          d.department_name,
          d.description,
          COUNT(DISTINCT dtm.user_id) as team_size,
          COUNT(DISTINCT pt.id) as active_projects_count,
          COUNT(DISTINCT prt.id) as pending_tasks,
          COUNT(DISTINCT CASE WHEN LOWER(prt.status) IN ('completed', 'complete') 
                             OR prt.status LIKE '%completed%' 
                             OR prt.status LIKE '%complete%' THEN prt.id END) as completed_tasks
        FROM departments d
        LEFT JOIN department_team_members dtm ON d.id = dtm.department_id AND dtm.is_active = 1
        LEFT JOIN project_departments pd ON d.id = pd.department_id
        LEFT JOIN projects pt ON pd.project_id = pt.id AND pt.status IN ('planning', 'active')
        LEFT JOIN project_tasks prt ON pd.project_id = prt.project_id
        GROUP BY d.id
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Get overall statistics
    const overallStats = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          COUNT(DISTINCT p.id) as total_projects,
          COUNT(DISTINCT prt.id) as total_tasks,
          COUNT(DISTINCT CASE WHEN LOWER(prt.status) IN ('completed', 'complete') 
                             OR prt.status LIKE '%completed%' 
                             OR prt.status LIKE '%complete%' THEN prt.id END) as completed_tasks,
          COUNT(DISTINCT CASE WHEN LOWER(prt.status) NOT IN ('completed', 'complete') 
                             AND prt.status NOT LIKE '%completed%' 
                             AND prt.status NOT LIKE '%complete%' THEN prt.id END) as pending_tasks,
          ROUND(
            AVG(
              CASE WHEN LOWER(prt.status) IN ('completed', 'complete') 
                   OR prt.status LIKE '%completed%' 
                   OR prt.status LIKE '%complete%'
              THEN (TIMESTAMPDIFF(HOUR, prt.created_at, prt.updated_at))
              ELSE NULL END
            ), 2
          ) as avg_completion_time
        FROM projects p
        LEFT JOIN project_departments pd ON p.id = pd.project_id
        LEFT JOIN project_tasks prt ON p.id = prt.project_id
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || {});
      });
    });

    // Get department-wise performance
    const departmentStats = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          d.id as department_id,
          d.department_name,
          COUNT(DISTINCT dtm.user_id) as team_size,
          COUNT(DISTINCT prt.id) as total_tasks,
          COUNT(DISTINCT CASE WHEN LOWER(prt.status) IN ('completed', 'complete') 
                             OR prt.status LIKE '%completed%' 
                             OR prt.status LIKE '%complete%' THEN prt.id END) as completed_tasks,
          ROUND(
            CASE 
              WHEN COUNT(DISTINCT prt.id) > 0 
              THEN (COUNT(DISTINCT CASE WHEN LOWER(prt.status) IN ('completed', 'complete') 
                                       OR prt.status LIKE '%completed%' 
                                       OR prt.status LIKE '%complete%' THEN prt.id END) / COUNT(DISTINCT prt.id)) * 100
              ELSE 0 
            END, 2
          ) as completion_rate,
          ROUND(AVG(pp.efficiency_score), 2) as avg_efficiency
        FROM departments d
        LEFT JOIN department_team_members dtm ON d.id = dtm.department_id AND dtm.is_active = 1
        LEFT JOIN project_departments pd ON d.id = pd.department_id
        LEFT JOIN projects pt ON pd.project_id = pt.id
        LEFT JOIN project_tasks prt ON pt.id = prt.project_id
        LEFT JOIN production_performance pp ON d.id = pp.department_id
        GROUP BY d.id, d.department_name
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Get all tasks with detailed information
    const allTasks = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          prt.*,
          prt.id,
          prt.task_name,
          prt.status,
          prt.priority,
          prt.due_date,
          prt.assigned_to,
          prt.created_at,
          prt.description,
          prt.department_id,
          d.department_name,
          pt.project_name,
          pt.id as project_id,
          u.name as assigned_to_name,
          u.email as assigned_to_email
        FROM project_tasks prt
        LEFT JOIN departments d ON prt.department_id = d.id
        LEFT JOIN projects pt ON prt.project_id = pt.id
        LEFT JOIN users u ON prt.assigned_to = u.id
        ORDER BY prt.created_at DESC
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Get all department members with their tasks and statistics
    const departmentMembersDetails = [];
    for (const dept of departments) {
      const members = await new Promise((resolve, reject) => {
        db.query(`
          SELECT 
            u.id,
            u.name,
            u.email,
            dtm.role,
            dtm.department_id,
            COUNT(DISTINCT CASE WHEN LOWER(prt.status) IN ('completed', 'complete') 
                               OR prt.status LIKE '%completed%' 
                               OR prt.status LIKE '%complete%' THEN prt.id END) as tasks_completed,
            COUNT(DISTINCT CASE WHEN LOWER(prt.status) NOT IN ('completed', 'complete') 
                               AND prt.status NOT LIKE '%completed%' 
                               AND prt.status NOT LIKE '%complete%'
                               AND (LOWER(prt.status) LIKE '%progress%' 
                                    OR LOWER(prt.status) LIKE '%revision%'
                                    OR LOWER(prt.status) LIKE '%pending%'
                                    OR LOWER(prt.status) LIKE '%new task%'
                                    OR LOWER(prt.status) LIKE '%review%'
                                    OR LOWER(prt.status) LIKE '%in_progress%') THEN prt.id END) as tasks_pending,
            COUNT(DISTINCT prt.id) as total_tasks,
            ROUND(AVG(pp.efficiency_score), 2) as efficiency_score,
            SUM(pp.hours_logged) as total_hours,
            MAX(prt.updated_at) as last_task_update
          FROM department_team_members dtm
          JOIN users u ON dtm.user_id = u.id
          LEFT JOIN project_tasks prt ON prt.assigned_to = u.id AND prt.department_id = ?
          LEFT JOIN production_performance pp ON pp.user_id = u.id AND pp.department_id = ?
          WHERE dtm.department_id = ? AND dtm.is_active = 1
          GROUP BY u.id, u.name, u.email, dtm.role, dtm.department_id
        `, [dept.id, dept.id, dept.id], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      // Get tasks for each member
      for (const member of members) {
        const memberTasks = await new Promise((resolve, reject) => {
          db.query(`
            SELECT 
              prt.*,
              p.project_name,
              d.department_name
            FROM project_tasks prt
            LEFT JOIN projects p ON prt.project_id = p.id
            LEFT JOIN departments d ON prt.department_id = d.id
            WHERE prt.assigned_to = ? AND prt.department_id = ?
            ORDER BY 
              CASE 
                WHEN LOWER(prt.status) LIKE '%progress%' 
                     OR prt.status LIKE '%Progress%' 
                     OR LOWER(prt.status) LIKE '%revision%' 
                     OR prt.status LIKE '%Revisions%' THEN 1
                WHEN LOWER(prt.status) LIKE '%pending%' 
                     OR LOWER(prt.status) LIKE '%new task%' 
                     OR prt.status LIKE '%New Task%' THEN 2
                WHEN LOWER(prt.status) LIKE '%review%' THEN 3
                WHEN LOWER(prt.status) IN ('completed', 'complete') 
                     OR prt.status LIKE '%completed%' 
                     OR prt.status LIKE '%Completed%' THEN 4
                ELSE 5
              END,
              prt.due_date ASC
          `, [member.id, dept.id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        departmentMembersDetails.push({
          ...member,
          assigned_tasks: memberTasks,
          department_name: dept.department_name
        });
      }
    }

    // Get recent tasks (limit 20 for overview)
    const recentTasks = allTasks.slice(0, 20);

    res.json({
      success: true,
      data: {
        userId,
        departments,
        overallStats,
        departmentStats,
        allTasks,
        recentTasks,
        departmentMembersDetails
      }
    });
  } catch (error) {
    console.error('Error fetching production head dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get department leader dashboard
router.get('/leader/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { department_id } = req.query;

    if (!department_id) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    // Verify user is leader of this department
    const leaderCheck = await new Promise((resolve, reject) => {
      db.query(`
        SELECT dtm.id 
        FROM department_team_members dtm
        WHERE dtm.department_id = ? 
        AND dtm.user_id = ? 
        AND dtm.role = 'team_leader'
        AND dtm.is_active = 1
      `, [department_id, userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (leaderCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a leader of this department.'
      });
    }

    // Get department info
    const department = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM departments WHERE id = ?', [department_id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    // Get team members with their performance and assigned tasks
    const teamMembers = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          dtm.role,
          COUNT(DISTINCT CASE WHEN LOWER(prt.status) IN ('completed', 'complete') 
                             OR prt.status LIKE '%completed%' 
                             OR prt.status LIKE '%complete%' THEN prt.id END) as tasks_completed,
          COUNT(DISTINCT CASE WHEN LOWER(prt.status) NOT IN ('completed', 'complete') 
                             AND prt.status NOT LIKE '%completed%' 
                             AND prt.status NOT LIKE '%complete%'
                             AND (LOWER(prt.status) LIKE '%progress%' 
                                  OR LOWER(prt.status) LIKE '%revision%'
                                  OR LOWER(prt.status) LIKE '%pending%'
                                  OR LOWER(prt.status) LIKE '%new task%'
                                  OR LOWER(prt.status) LIKE '%in_progress%') THEN prt.id END) as tasks_pending,
          ROUND(AVG(pp.efficiency_score), 2) as efficiency_score,
          SUM(pp.hours_logged) as total_hours
        FROM department_team_members dtm
        JOIN users u ON dtm.user_id = u.id
        LEFT JOIN project_tasks prt ON prt.assigned_to = u.id AND prt.department_id = ?
        LEFT JOIN production_performance pp ON pp.user_id = u.id AND pp.department_id = ?
        WHERE dtm.department_id = ? AND dtm.is_active = 1
        GROUP BY u.id, u.name, u.email, dtm.role
      `, [department_id, department_id, department_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Get tasks assigned to each member
    const memberTasksMap = {};
    for (const member of teamMembers) {
      const memberTasks = await new Promise((resolve, reject) => {
        db.query(`
          SELECT 
            prt.*,
            p.project_name,
            d.department_name
          FROM project_tasks prt
          LEFT JOIN projects p ON prt.project_id = p.id
          LEFT JOIN departments d ON prt.department_id = d.id
          WHERE prt.assigned_to = ? AND prt.department_id = ?
          ORDER BY 
            CASE prt.status
              WHEN 'in_progress' THEN 1
              WHEN 'pending' THEN 2
              WHEN 'review' THEN 3
              WHEN 'completed' THEN 4
              ELSE 5
            END,
            prt.due_date ASC
        `, [member.id, department_id], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      memberTasksMap[member.id] = memberTasks;
    }

    // Add tasks to each member object
    const teamMembersWithTasks = teamMembers.map(member => ({
      ...member,
      assigned_tasks: memberTasksMap[member.id] || []
    }));

    // Get department tasks
    const departmentTasks = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          prt.*,
          p.project_name,
          u.name as assigned_to_name,
          p.status as project_status
        FROM project_tasks prt
        LEFT JOIN projects p ON prt.project_id = p.id
        LEFT JOIN users u ON prt.assigned_to = u.id
        WHERE prt.department_id = ?
        ORDER BY prt.priority DESC, prt.due_date ASC
      `, [department_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Get department statistics
    const stats = {
      total_tasks: departmentTasks.length,
      completed_tasks: departmentTasks.filter(t => {
        const status = (t.status || '').toLowerCase();
        return status === 'completed' || status === 'complete' || status.includes('completed') || status.includes('complete');
      }).length,
      pending_tasks: departmentTasks.filter(t => {
        const status = (t.status || '').toLowerCase();
        return status !== 'completed' && status !== 'complete' && !status.includes('completed') && !status.includes('complete');
      }).length,
      team_size: teamMembers.length,
      avg_efficiency: teamMembers.length > 0 
        ? (teamMembers.reduce((sum, m) => sum + (parseFloat(m.efficiency_score) || 0), 0) / teamMembers.length).toFixed(2)
        : 0
    };

    res.json({
      success: true,
      data: {
        department,
        teamMembers: teamMembersWithTasks,
        tasks: departmentTasks,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching department leader dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get user's department info for department leader dashboard
router.get('/user/department', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's department
    const department = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          dtm.department_id,
          d.department_name,
          dtm.role
        FROM department_team_members dtm
        JOIN departments d ON dtm.department_id = d.id
        WHERE dtm.user_id = ? AND dtm.is_active = 1
        LIMIT 1
      `, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'User is not assigned to any department'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error fetching user department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department info'
    });
  }
});

// Get team member dashboard
router.get('/member/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's department
    const userDept = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          dtm.*,
          d.department_name
        FROM department_team_members dtm
        JOIN departments d ON dtm.department_id = d.id
        WHERE dtm.user_id = ? AND dtm.is_active = 1
        LIMIT 1
      `, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (!userDept) {
      return res.status(404).json({
        success: false,
        message: 'User is not assigned to any department'
      });
    }

    // Get user's tasks - only tasks assigned to them from their department
    const myTasks = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          prt.*,
          pt.project_name,
          d.department_name
        FROM project_tasks prt
        LEFT JOIN projects pt ON prt.project_id = pt.id
        LEFT JOIN departments d ON prt.department_id = d.id
        WHERE prt.assigned_to = ? AND prt.department_id = ?
        ORDER BY 
          CASE prt.status
            WHEN 'in_progress' THEN 1
            WHEN 'pending' THEN 2
            WHEN 'review' THEN 3
            WHEN 'completed' THEN 4
            ELSE 5
          END,
          prt.due_date ASC
      `, [userId, userDept.department_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Get performance statistics from project_tasks
    // Handle both old status format (pending, in_progress, completed) and new format (New Task, In Progress, Completed)
    const stats = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          COUNT(CASE WHEN LOWER(pt.status) IN ('completed', 'complete') OR pt.status LIKE '%completed%' OR pt.status LIKE '%complete%' THEN 1 END) as tasks_completed,
          COUNT(CASE WHEN LOWER(pt.status) NOT IN ('completed', 'complete') 
                     AND pt.status NOT LIKE '%completed%' 
                     AND pt.status NOT LIKE '%complete%' THEN 1 END) as tasks_pending,
          ROUND(COALESCE(AVG(pp.efficiency_score), 0), 2) as efficiency_score,
          SUM(CASE WHEN LOWER(pt.status) IN ('completed', 'complete') 
                   OR pt.status LIKE '%completed%' 
                   OR pt.status LIKE '%complete%' THEN 1 ELSE 0 END) as total_completed
        FROM project_tasks pt
        LEFT JOIN production_performance pp ON pt.id = pp.task_id AND pp.user_id = ?
        WHERE pt.assigned_to = ? AND pt.department_id = ?
      `, [userId, userId, userDept.department_id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || {});
      });
    });

    res.json({
      success: true,
      data: {
        userId,
        department: {
          id: userDept.department_id,
          name: userDept.department_name,
          role: userDept.role
        },
        tasks: myTasks,
        stats: {
          tasks_completed: myTasks.filter(t => {
            const status = (t.status || '').toLowerCase();
            return status === 'completed' || status === 'complete' || status.includes('completed') || status.includes('complete');
          }).length,
          tasks_pending: myTasks.filter(t => {
            const status = (t.status || '').toLowerCase();
            return status !== 'completed' && status !== 'complete' && !status.includes('completed') && !status.includes('complete');
          }).length,
          total_tasks: myTasks.length,
          efficiency_score: stats.efficiency_score || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching team member dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

module.exports = router;
