const db = require('../db');

class TaskService {
  
  /**
   * Create a new task
   * @param {Object} taskData - Task data
   */
  static async createTask(taskData) {
    return new Promise((resolve, reject) => {
      const {
        project_id,
        department_id,
        task_name,
        description,
        priority = 'medium',
        assigned_to,
        created_by,
        due_date,
        estimated_hours
      } = taskData;

      // First, get the default board for this department
      const getBoardSql = 'SELECT id FROM boards WHERE department_id = ? AND is_default = 1 LIMIT 1';
      
      db.query(getBoardSql, [department_id], (err, boardResult) => {
        if (err) {
          console.error('Error getting default board:', err);
          return reject(err);
        }

        const board_id = boardResult.length > 0 ? boardResult[0].id : null;

        const sql = `
          INSERT INTO project_tasks (
            project_id, department_id, task_name, description, priority,
            assigned_to, created_by, due_date, estimated_hours, board_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          project_id, department_id, task_name, description, priority,
          assigned_to && assigned_to !== '' ? assigned_to : null, 
          created_by, 
          due_date && due_date !== '' ? due_date : null, 
          estimated_hours && estimated_hours !== '' ? estimated_hours : null,
          board_id
        ];

        db.query(sql, values, (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return reject(err);
          }
          
          const taskId = result.insertId;
          
          // Automatically add task creator and department lead as members
          
          // Add task creator as collaborator first
          this.addTaskMember(taskId, created_by, 'collaborator', created_by)
            .then(() => {
              // Get department lead and add as reviewer
              const getDeptLeadSql = `
                SELECT u.id 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                JOIN department_team_members dtm ON u.id = dtm.user_id
                WHERE dtm.department_id = ? AND dtm.role = 'team_leader' AND dtm.is_active = 1
                LIMIT 1
              `;
              
              db.query(getDeptLeadSql, [department_id], (err, leadResult) => {
                const memberPromises = [];
                
                if (!err && leadResult.length > 0 && leadResult[0].id !== created_by) {
                  memberPromises.push(
                    this.addTaskMember(taskId, leadResult[0].id, 'reviewer', created_by)
                  );
                }
                
                // Add assigned_to as assignee if different from creator
                if (assigned_to && assigned_to !== created_by) {
                  memberPromises.push(
                    this.addTaskMember(taskId, assigned_to, 'assignee', created_by)
                  );
                }
                
                // Execute remaining member additions
                if (memberPromises.length > 0) {
                  Promise.all(memberPromises)
                    .then(() => {
                      resolve(taskId);
                    })
                    .catch((memberErr) => {
                      console.error('Error adding additional members:', memberErr);
                      resolve(taskId);
                    });
                } else {
                  resolve(taskId);
                }
              });
            })
            .catch((err) => {
              console.error('Error adding task creator:', err);
              resolve(taskId);
            });
        });
      });
    });
  }

  /**
   * Get all tasks across all projects (for task management board)
   * @param {Object} filters - Filter options
   */
  static async getAllTasks(filters = {}) {
    return new Promise((resolve, reject) => {
      let whereClause = 'WHERE 1=1';
      let queryParams = [];

      // Apply filters
      if (filters.project_id) {
        whereClause += ' AND pt.project_id = ?';
        queryParams.push(filters.project_id);
      }

      if (filters.department_id) {
        whereClause += ' AND pt.department_id = ?';
        queryParams.push(filters.department_id);
      }

      if (filters.status) {
        whereClause += ' AND pt.status = ?';
        queryParams.push(filters.status);
      }

      if (filters.priority) {
        whereClause += ' AND pt.priority = ?';
        queryParams.push(filters.priority);
      }

      if (filters.assigned_to) {
        whereClause += ' AND pt.assigned_to = ?';
        queryParams.push(filters.assigned_to);
      }

      if (filters.search) {
        whereClause += ' AND (pt.task_name LIKE ? OR pt.description LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm);
      }

      const sql = `
        SELECT 
          pt.*,
          d.department_name,
          u1.name as assigned_to_name,
          u1.email as assigned_to_email,
          u2.name as created_by_name,
          p.project_name,
          c.name as customer_name,
          COUNT(DISTINCT tc.id) as comments_count,
          COUNT(DISTINCT pa.id) as attachments_count
        FROM project_tasks pt
        LEFT JOIN departments d ON pt.department_id = d.id
        LEFT JOIN users u1 ON pt.assigned_to = u1.id
        LEFT JOIN users u2 ON pt.created_by = u2.id
        LEFT JOIN projects p ON pt.project_id = p.id
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN task_comments tc ON pt.id = tc.task_id
        LEFT JOIN project_attachments pa ON pt.project_id = pa.project_id
        ${whereClause}
        GROUP BY pt.id
        ORDER BY pt.created_at DESC
      `;

      db.query(sql, queryParams, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get all tasks for a project
   * @param {number} projectId - Project ID
   * @param {Object} filters - Filter options
   */
  static async getProjectTasks(projectId, filters = {}) {
    return new Promise((resolve, reject) => {
      let whereClause = 'WHERE pt.project_id = ?';
      let queryParams = [projectId];

      // Apply filters
      if (filters.department_id) {
        whereClause += ' AND pt.department_id = ?';
        queryParams.push(filters.department_id);
      }

      if (filters.status) {
        whereClause += ' AND pt.status = ?';
        queryParams.push(filters.status);
      }

      if (filters.priority) {
        whereClause += ' AND pt.priority = ?';
        queryParams.push(filters.priority);
      }

      if (filters.assigned_to) {
        whereClause += ' AND pt.assigned_to = ?';
        queryParams.push(filters.assigned_to);
      }

      if (filters.search) {
        whereClause += ' AND (pt.task_name LIKE ? OR pt.description LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm);
      }

      const sql = `
        SELECT 
          pt.*,
          d.department_name,
          u1.name as assigned_to_name,
          u1.email as assigned_to_email,
          u2.name as created_by_name,
          p.project_name,
          c.name as customer_name,
          COUNT(DISTINCT tc.id) as comments_count,
          COUNT(DISTINCT pa.id) as attachments_count
        FROM project_tasks pt
        LEFT JOIN departments d ON pt.department_id = d.id
        LEFT JOIN users u1 ON pt.assigned_to = u1.id
        LEFT JOIN users u2 ON pt.created_by = u2.id
        LEFT JOIN projects p ON pt.project_id = p.id
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN task_comments tc ON pt.id = tc.task_id
        LEFT JOIN project_attachments pa ON pt.project_id = pa.project_id
        ${whereClause}
        GROUP BY pt.id
        ORDER BY pt.priority DESC, pt.due_date ASC, pt.created_at DESC
      `;

      db.query(sql, queryParams, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get task by ID with full details
   * @param {number} taskId - Task ID
   */
  static async getTaskById(taskId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pt.*,
          d.department_name,
          u1.name as assigned_to_name,
          u1.email as assigned_to_email,
          u2.name as created_by_name,
          p.project_name,
          c.name as customer_name,
          c.email as customer_email
        FROM project_tasks pt
        LEFT JOIN departments d ON pt.department_id = d.id
        LEFT JOIN users u1 ON pt.assigned_to = u1.id
        LEFT JOIN users u2 ON pt.created_by = u2.id
        LEFT JOIN projects p ON pt.project_id = p.id
        LEFT JOIN customers c ON p.customer_id = c.id
        WHERE pt.id = ?
      `;

      db.query(sql, [taskId], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) {
          return reject(new Error('Task not found'));
        }
        resolve(results[0]);
      });
    });
  }

  /**
   * Update task
   * @param {number} taskId - Task ID
   * @param {Object} updateData - Update data
   */
  static async updateTask(taskId, updateData) {
    return new Promise((resolve, reject) => {
      const allowedFields = [
        'task_name', 'description', 'status', 'priority',
        'assigned_to', 'due_date', 'estimated_hours', 'actual_hours', 'department_id'
      ];

      const updateFields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          // Handle empty strings for foreign key fields
          if (key === 'assigned_to' && updateData[key] === '') {
            values.push(null);
          } else if (key === 'due_date' && updateData[key] === '') {
            values.push(null);
          } else if (key === 'estimated_hours' && updateData[key] === '') {
            values.push(null);
          } else {
            values.push(updateData[key]);
          }
        }
      });

      // If status is being updated to completed, set completed_date
      if (updateData.status === 'completed' && !updateData.completed_date) {
        updateFields.push('completed_date = CURRENT_TIMESTAMP');
      }

      if (updateFields.length === 0) {
        return reject(new Error('No valid fields to update'));
      }

      values.push(taskId);

      const sql = `
        UPDATE project_tasks 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return reject(err);
        }
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Delete task
   * @param {number} taskId - Task ID
   */
  static async deleteTask(taskId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM project_tasks WHERE id = ?';
      
      db.query(sql, [taskId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Get tasks assigned to a user
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   */
  static async getUserTasks(userId, filters = {}) {
    return new Promise((resolve, reject) => {
      let whereClause = 'WHERE pt.assigned_to = ?';
      let queryParams = [userId];

      // Apply filters
      if (filters.status) {
        whereClause += ' AND pt.status = ?';
        queryParams.push(filters.status);
      }

      if (filters.priority) {
        whereClause += ' AND pt.priority = ?';
        queryParams.push(filters.priority);
      }

      if (filters.project_id) {
        whereClause += ' AND pt.project_id = ?';
        queryParams.push(filters.project_id);
      }

      const sql = `
        SELECT 
          pt.*,
          d.department_name,
          p.project_name,
          c.name as customer_name,
          COUNT(DISTINCT tc.id) as comments_count,
          COUNT(DISTINCT pa.id) as attachments_count
        FROM project_tasks pt
        LEFT JOIN departments d ON pt.department_id = d.id
        LEFT JOIN projects p ON pt.project_id = p.id
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN task_comments tc ON pt.id = tc.task_id
        LEFT JOIN project_attachments pa ON pt.project_id = pa.project_id
        ${whereClause}
        GROUP BY pt.id
        ORDER BY pt.priority DESC, pt.due_date ASC
      `;

      db.query(sql, queryParams, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get tasks by department
   * @param {number} departmentId - Department ID
   * @param {Object} filters - Filter options
   */
  static async getDepartmentTasks(departmentId, filters = {}) {
    return new Promise((resolve, reject) => {
      let whereClause = 'WHERE pt.department_id = ?';
      let queryParams = [departmentId];

      // Apply filters
      if (filters.status) {
        whereClause += ' AND pt.status = ?';
        queryParams.push(filters.status);
      }

      if (filters.project_id) {
        whereClause += ' AND pt.project_id = ?';
        queryParams.push(filters.project_id);
      }

      const sql = `
        SELECT 
          pt.*,
          d.department_name,
          u.name as assigned_to_name,
          p.project_name,
          c.name as customer_name
        FROM project_tasks pt
        LEFT JOIN departments d ON pt.department_id = d.id
        LEFT JOIN users u ON pt.assigned_to = u.id
        LEFT JOIN projects p ON pt.project_id = p.id
        LEFT JOIN customers c ON p.customer_id = c.id
        ${whereClause}
        ORDER BY pt.priority DESC, pt.due_date ASC
      `;

      db.query(sql, queryParams, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Add comment to task
   * @param {number} taskId - Task ID
   * @param {number} userId - User ID
   * @param {string} comment - Comment text
   */
  static async addTaskComment(taskId, userId, comment) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO task_comments (task_id, user_id, comment)
        VALUES (?, ?, ?)
      `;

      db.query(sql, [taskId, userId, comment], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  /**
   * Get task comments
   * @param {number} taskId - Task ID
   */
  static async getTaskComments(taskId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          tc.*,
          u.name as user_name,
          u.email as user_email
        FROM task_comments tc
        JOIN users u ON tc.user_id = u.id
        WHERE tc.task_id = ?
        ORDER BY tc.created_at ASC
      `;

      db.query(sql, [taskId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Add attachment to task (using project attachments)
   * @param {number} taskId - Task ID
   * @param {Object} attachmentData - Attachment data
   */
  static async addTaskAttachment(taskId, attachmentData) {
    return new Promise((resolve, reject) => {
      const { file_name, file_path, file_size, file_type, uploaded_by } = attachmentData;

      // First get the project_id for this task
      const getProjectSql = 'SELECT project_id FROM project_tasks WHERE id = ?';
      
      db.query(getProjectSql, [taskId], (err, projectResult) => {
        if (err) return reject(err);
        
        if (projectResult.length === 0) {
          return reject(new Error('Task not found'));
        }
        
        const projectId = projectResult[0].project_id;
        
        const sql = `
          INSERT INTO project_attachments (project_id, file_name, file_path, file_size, file_type, uploaded_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [projectId, file_name, file_path, file_size, file_type, uploaded_by], (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        });
      });
    });
  }

  /**
   * Get task attachments (using project attachments)
   * @param {number} taskId - Task ID
   */
  static async getTaskAttachments(taskId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pa.*,
          u.name as uploaded_by_name,
          'project' as attachment_type
        FROM project_attachments pa
        LEFT JOIN users u ON pa.uploaded_by = u.id
        WHERE pa.project_id = (
          SELECT project_id FROM project_tasks WHERE id = ?
        )
        ORDER BY pa.created_at DESC
      `;

      db.query(sql, [taskId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Add checklist to task
   * @param {number} taskId - Task ID
   * @param {string} title - Checklist title
   * @param {number} createdBy - User ID who created the checklist
   */
  static async addTaskChecklist(taskId, title, createdBy) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO task_checklists (task_id, title, created_by)
        VALUES (?, ?, ?)
      `;

      db.query(sql, [taskId, title, createdBy], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  /**
   * Get task checklists
   * @param {number} taskId - Task ID
   */
  static async getTaskChecklists(taskId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          tc.*,
          u.name as created_by_name
        FROM task_checklists tc
        JOIN users u ON tc.created_by = u.id
        WHERE tc.task_id = ?
        ORDER BY tc.created_at ASC
      `;

      db.query(sql, [taskId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Add checklist item
   * @param {number} checklistId - Checklist ID
   * @param {string} itemText - Item text
   */
  static async addChecklistItem(checklistId, itemText) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO task_checklist_items (checklist_id, item_text)
        VALUES (?, ?)
      `;

      db.query(sql, [checklistId, itemText], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  /**
   * Get checklist items
   * @param {number} checklistId - Checklist ID
   */
  static async getChecklistItems(checklistId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          tci.*,
          u.name as completed_by_name
        FROM task_checklist_items tci
        LEFT JOIN users u ON tci.completed_by = u.id
        WHERE tci.checklist_id = ?
        ORDER BY tci.created_at ASC
      `;

      db.query(sql, [checklistId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Toggle checklist item completion
   * @param {number} itemId - Item ID
   * @param {boolean} isCompleted - Completion status
   * @param {number} userId - User ID who completed/uncompleted
   */
  static async toggleChecklistItem(itemId, isCompleted, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE task_checklist_items 
        SET is_completed = ?, completed_by = ?, completed_at = ?
        WHERE id = ?
      `;

      const completedAt = isCompleted ? new Date() : null;
      const completedBy = isCompleted ? userId : null;

      db.query(sql, [isCompleted, completedBy, completedAt, itemId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Add activity log entry
   * @param {number} taskId - Task ID
   * @param {number} userId - User ID
   * @param {string} action - Action performed
   * @param {string} description - Description of the action
   * @param {string} oldValue - Old value (optional)
   * @param {string} newValue - New value (optional)
   */
  static async addActivityLog(taskId, userId, action, description, oldValue = null, newValue = null) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO task_activity_logs (task_id, user_id, action, description, old_value, new_value)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(sql, [taskId, userId, action, description, oldValue, newValue], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  /**
   * Get task activity logs
   * @param {number} taskId - Task ID
   */
  static async getTaskActivityLogs(taskId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          tal.*,
          u.name as user_name,
          u.email as user_email
        FROM task_activity_logs tal
        JOIN users u ON tal.user_id = u.id
        WHERE tal.task_id = ?
        ORDER BY tal.created_at DESC
      `;

      db.query(sql, [taskId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Add member to task
   * @param {number} taskId - Task ID
   * @param {number} userId - User ID to add
   * @param {string} role - Member role (assignee, collaborator, reviewer, observer)
   * @param {number} assignedBy - User ID who assigned the member
   */
  static async addTaskMember(taskId, userId, role, assignedBy) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO task_members (task_id, user_id, role, assigned_by)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        role = VALUES(role),
        is_active = 1,
        assigned_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      `;

      db.query(sql, [taskId, userId, role, assignedBy], (err, result) => {
        if (err) {
          console.error('Error in addTaskMember:', err);
          return reject(err);
        }
        resolve(result.insertId || result.affectedRows);
      });
    });
  }

  /**
   * Get task members
   * @param {number} taskId - Task ID
   */
  static async getTaskMembers(taskId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          tm.*,
          u.name as user_name,
          u.email as user_email,
          r.name as role_name,
          assigned_by_user.name as assigned_by_name
        FROM task_members tm
        JOIN users u ON tm.user_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN users assigned_by_user ON tm.assigned_by = assigned_by_user.id
        WHERE tm.task_id = ? AND tm.is_active = 1
        ORDER BY tm.assigned_at ASC
      `;

      db.query(sql, [taskId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Update task member role
   * @param {number} memberId - Member ID
   * @param {string} role - New role
   */
  static async updateTaskMemberRole(memberId, role) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE task_members 
        SET role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(sql, [role, memberId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Remove member from task
   * @param {number} memberId - Member ID
   */
  static async removeTaskMember(memberId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE task_members 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(sql, [memberId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Get available users for task assignment
   * @param {number} departmentId - Department ID
   */
  static async getAvailableUsersForTask(departmentId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT DISTINCT
          u.id,
          u.name,
          u.email,
          r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.role_id IN (1, 3, 4, 5)
        ORDER BY u.name ASC
      `;

      db.query(sql, [], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get task statistics for a project
   * @param {number} projectId - Project ID
   */
  static async getProjectTaskStats(projectId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN status = 'review' THEN 1 END) as review_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_tasks,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tasks,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tasks,
          SUM(estimated_hours) as total_estimated_hours,
          SUM(actual_hours) as total_actual_hours,
          AVG(estimated_hours) as avg_estimated_hours
        FROM project_tasks
        WHERE project_id = ?
      `;

      db.query(sql, [projectId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  }

  /**
   * Get user task statistics
   * @param {number} userId - User ID
   */
  static async getUserTaskStats(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN due_date < CURDATE() AND status != 'completed' THEN 1 END) as overdue_tasks,
          SUM(estimated_hours) as total_estimated_hours,
          SUM(actual_hours) as total_actual_hours
        FROM project_tasks
        WHERE assigned_to = ?
      `;

      db.query(sql, [userId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  }
}

module.exports = TaskService;
