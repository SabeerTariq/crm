const db = require('../db');

class DepartmentService {
  
  /**
   * Get all departments
   */
  static async getAllDepartments() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          d.*,
          COUNT(dtm.user_id) as team_members_count,
          COUNT(CASE WHEN dtm.role = 'team_leader' THEN 1 END) as team_leaders_count
        FROM departments d
        LEFT JOIN department_team_members dtm ON d.id = dtm.department_id AND dtm.is_active = 1
        WHERE d.is_active = 1
        GROUP BY d.id
        ORDER BY d.department_name
      `;

      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get department by ID
   * @param {number} departmentId - Department ID
   */
  static async getDepartmentById(departmentId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          d.*,
          COUNT(dtm.user_id) as team_members_count,
          COUNT(CASE WHEN dtm.role = 'team_leader' THEN 1 END) as team_leaders_count
        FROM departments d
        LEFT JOIN department_team_members dtm ON d.id = dtm.department_id AND dtm.is_active = 1
        WHERE d.id = ? AND d.is_active = 1
        GROUP BY d.id
      `;

      db.query(sql, [departmentId], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) {
          return reject(new Error('Department not found'));
        }
        resolve(results[0]);
      });
    });
  }

  /**
   * Create a new department
   * @param {Object} departmentData - Department data
   */
  static async createDepartment(departmentData) {
    return new Promise((resolve, reject) => {
      const { department_name, description } = departmentData;

      const sql = `
        INSERT INTO departments (department_name, description)
        VALUES (?, ?)
      `;

      db.query(sql, [department_name, description], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  /**
   * Update department
   * @param {number} departmentId - Department ID
   * @param {Object} updateData - Update data
   */
  static async updateDepartment(departmentId, updateData) {
    return new Promise((resolve, reject) => {
      const allowedFields = ['department_name', 'description', 'is_active'];
      const updateFields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (updateFields.length === 0) {
        return reject(new Error('No valid fields to update'));
      }

      values.push(departmentId);

      const sql = `
        UPDATE departments 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(sql, values, (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Get team members for a department
   * @param {number} departmentId - Department ID
   */
  static async getDepartmentTeamMembers(departmentId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          dtm.*,
          u.name as user_name,
          u.email as user_email,
          u.role_id,
          r.name as role_name
        FROM department_team_members dtm
        JOIN users u ON dtm.user_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE dtm.department_id = ? AND dtm.is_active = 1
        ORDER BY dtm.role DESC, u.name
      `;

      db.query(sql, [departmentId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Add user to department
   * @param {number} departmentId - Department ID
   * @param {number} userId - User ID
   * @param {string} role - Role (team_leader or team_member)
   */
  static async addUserToDepartment(departmentId, userId, role = 'team_member') {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO department_team_members (department_id, user_id, role)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        role = VALUES(role), 
        is_active = 1, 
        assigned_at = CURRENT_TIMESTAMP
      `;

      db.query(sql, [departmentId, userId, role], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId || result.affectedRows > 0);
      });
    });
  }

  /**
   * Remove user from department
   * @param {number} departmentId - Department ID
   * @param {number} userId - User ID
   */
  static async removeUserFromDepartment(departmentId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE department_team_members 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE department_id = ? AND user_id = ?
      `;

      db.query(sql, [departmentId, userId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Update user role in department
   * @param {number} departmentId - Department ID
   * @param {number} userId - User ID
   * @param {string} role - New role
   */
  static async updateUserRoleInDepartment(departmentId, userId, role) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE department_team_members 
        SET role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE department_id = ? AND user_id = ? AND is_active = 1
      `;

      db.query(sql, [role, departmentId, userId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Get available team leaders for a department
   * @param {number} departmentId - Department ID
   */
  static async getAvailableTeamLeaders(departmentId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(DISTINCT pd.id) as current_projects,
          COUNT(DISTINCT pt.id) as current_tasks
        FROM users u
        JOIN department_team_members dtm ON u.id = dtm.user_id
        LEFT JOIN project_departments pd ON u.id = pd.team_leader_id AND pd.status IN ('not_started', 'in_progress')
        LEFT JOIN project_tasks pt ON u.id = pt.assigned_to AND pt.status IN ('pending', 'in_progress')
        WHERE dtm.department_id = ? 
        AND dtm.role = 'team_leader' 
        AND dtm.is_active = 1
        GROUP BY u.id
        ORDER BY u.name
      `;

      db.query(sql, [departmentId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get available team members for a department
   * @param {number} departmentId - Department ID
   */
  static async getAvailableTeamMembers(departmentId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          u.id,
          u.name,
          u.email,
          dtm.role,
          COUNT(DISTINCT pt.id) as current_tasks
        FROM users u
        JOIN department_team_members dtm ON u.id = dtm.user_id
        LEFT JOIN project_tasks pt ON u.id = pt.assigned_to AND pt.status IN ('pending', 'in_progress')
        WHERE dtm.department_id = ? 
        AND dtm.is_active = 1
        GROUP BY u.id
        ORDER BY dtm.role DESC, u.name
      `;

      db.query(sql, [departmentId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get departments assigned to a project
   * @param {number} projectId - Project ID
   */
  static async getProjectDepartments(projectId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pd.*,
          d.department_name,
          d.description as department_description,
          u.name as team_leader_name,
          u.email as team_leader_email,
          COUNT(DISTINCT pt.id) as tasks_count,
          COUNT(DISTINCT CASE WHEN pt.status = 'completed' THEN pt.id END) as completed_tasks
        FROM project_departments pd
        JOIN departments d ON pd.department_id = d.id
        LEFT JOIN users u ON pd.team_leader_id = u.id
        LEFT JOIN project_tasks pt ON pd.department_id = pt.department_id AND pd.project_id = pt.project_id
        WHERE pd.project_id = ?
        GROUP BY pd.id
        ORDER BY d.department_name
      `;

      db.query(sql, [projectId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Add department to project
   * @param {number} projectId - Project ID
   * @param {number} departmentId - Department ID
   * @param {number} teamLeaderId - Team Leader ID
   */
  static async addDepartmentToProject(projectId, departmentId, teamLeaderId = null) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO project_departments (project_id, department_id, team_leader_id)
        VALUES (?, ?, ?)
      `;

      db.query(sql, [projectId, departmentId, teamLeaderId], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  /**
   * Update project department
   * @param {number} projectDepartmentId - Project Department ID
   * @param {Object} updateData - Update data
   */
  static async updateProjectDepartment(projectDepartmentId, updateData) {
    return new Promise((resolve, reject) => {
      const allowedFields = ['team_leader_id', 'status', 'start_date', 'end_date'];
      const updateFields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (updateFields.length === 0) {
        return reject(new Error('No valid fields to update'));
      }

      values.push(projectDepartmentId);

      const sql = `
        UPDATE project_departments 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(sql, values, (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Remove department from project
   * @param {number} projectDepartmentId - Project Department ID
   */
  static async removeDepartmentFromProject(projectDepartmentId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM project_departments WHERE id = ?';
      
      db.query(sql, [projectDepartmentId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Get department team members
   * @param {number} departmentId - Department ID
   */
  static async getDepartmentTeamMembers(departmentId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          dtm.*,
          u.name as user_name,
          u.email as user_email,
          r.name as role_name
        FROM department_team_members dtm
        JOIN users u ON dtm.user_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE dtm.department_id = ? AND dtm.is_active = 1
        ORDER BY dtm.role DESC, u.name ASC
      `;

      db.query(sql, [departmentId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Add team member to department
   * @param {Object} teamMemberData - Team member data
   */
  static async addTeamMember(teamMemberData) {
    return new Promise((resolve, reject) => {
      const { department_id, user_id, role = 'team_member' } = teamMemberData;

      // Check if user is already an active member of this department
      const checkActiveSql = `
        SELECT id FROM department_team_members 
        WHERE department_id = ? AND user_id = ? AND is_active = 1
      `;

      db.query(checkActiveSql, [department_id, user_id], (err, activeResults) => {
        if (err) return reject(err);
        
        if (activeResults.length > 0) {
          return reject(new Error('User is already a member of this department'));
        }

        // Check if user has an inactive record in this department
        const checkInactiveSql = `
          SELECT id FROM department_team_members 
          WHERE department_id = ? AND user_id = ? AND is_active = 0
        `;

        db.query(checkInactiveSql, [department_id, user_id], (err, inactiveResults) => {
          if (err) return reject(err);

          // If user has an inactive record, reactivate it
          if (inactiveResults.length > 0) {
            const reactivateSql = `
              UPDATE department_team_members 
              SET is_active = 1, role = ?, updated_at = CURRENT_TIMESTAMP
              WHERE department_id = ? AND user_id = ? AND is_active = 0
            `;

            db.query(reactivateSql, [role, department_id, user_id], (err, result) => {
              if (err) return reject(err);
              resolve(inactiveResults[0].id);
            });
          } else {
            // User is not in this department, proceed with normal addition
            
            // Check if user is in another department and remove them from there first
            const removeFromOtherDeptSql = `
              UPDATE department_team_members 
              SET is_active = 0, updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ? AND is_active = 1 AND department_id != ?
            `;

            db.query(removeFromOtherDeptSql, [user_id, department_id], (err, removeResult) => {
              if (err) return reject(err);

              // Add user to new department
              const sql = `
                INSERT INTO department_team_members (department_id, user_id, role)
                VALUES (?, ?, ?)
              `;

              db.query(sql, [department_id, user_id, role], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
              });
            });
          }
        });
      });
    });
  }

  /**
   * Update team member role
   * @param {number} teamMemberId - Team member ID
   * @param {string} role - New role
   */
  static async updateTeamMemberRole(teamMemberId, role) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE department_team_members 
        SET role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;

      db.query(sql, [role, teamMemberId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Remove team member from department
   * @param {number} teamMemberId - Team member ID
   */
  static async removeTeamMember(teamMemberId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE department_team_members 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(sql, [teamMemberId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Get available users for department assignment
   * @param {number} departmentId - Department ID
   */
  static async getAvailableUsers(departmentId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          u.id,
          u.name,
          u.email,
          r.name as role_name,
          CASE 
            WHEN dtm.user_id IS NOT NULL AND dtm.is_active = 1 THEN dtm.role
            ELSE NULL
          END as current_department_role,
          CASE 
            WHEN dtm.user_id IS NOT NULL AND dtm.is_active = 1 THEN d.department_name
            ELSE NULL
          END as current_department_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN department_team_members dtm ON u.id = dtm.user_id AND dtm.is_active = 1
        LEFT JOIN departments d ON dtm.department_id = d.id
        WHERE r.id IN (7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18)
        ORDER BY u.name ASC
      `;

      db.query(sql, [departmentId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get department tasks for team leader
   * @param {number} departmentId - Department ID
   */
  static async getDepartmentTasks(departmentId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pt.*,
          p.project_name,
          u.name as assigned_to_name,
          u.email as assigned_to_email,
          ts.status_name,
          ts.status_color
        FROM project_tasks pt
        LEFT JOIN projects p ON pt.project_id = p.id
        LEFT JOIN users u ON pt.assigned_to = u.id
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

  /**
   * Delete department (soft delete)
   * @param {number} departmentId - Department ID
   */
  static async deleteDepartment(departmentId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE departments 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(sql, [departmentId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }
}

module.exports = DepartmentService;
