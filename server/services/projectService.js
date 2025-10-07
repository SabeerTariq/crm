const db = require('../db');

class ProjectService {
  
  /**
   * Create a new project
   * @param {Object} projectData - Project data
   */
  static async createProject(projectData) {
    return new Promise((resolve, reject) => {
      const {
        customer_id,
        project_name,
        description,
        status = 'planning',
        priority = 'medium',
        start_date,
        end_date,
        budget,
        created_by,
        project_manager_id,
        assigned_upseller_id
      } = projectData;

      const sql = `
        INSERT INTO projects (
          customer_id, project_name, description, status, priority,
          start_date, end_date, budget, created_by, project_manager_id, assigned_upseller_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        customer_id, project_name, description, status, priority,
        start_date && start_date !== '' ? start_date : null, 
        end_date && end_date !== '' ? end_date : null, 
        budget && budget !== '' ? budget : null, 
        created_by, project_manager_id, assigned_upseller_id
      ];

      db.query(sql, values, (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  /**
   * Get all projects with filters
   * @param {Object} filters - Filter options
   */
  static async getAllProjects(filters = {}) {
    return new Promise((resolve, reject) => {
      let whereClause = 'WHERE 1=1';
      let queryParams = [];

      // Apply filters
      if (filters.status) {
        whereClause += ' AND p.status = ?';
        queryParams.push(filters.status);
      }

      if (filters.priority) {
        whereClause += ' AND p.priority = ?';
        queryParams.push(filters.priority);
      }

      if (filters.customer_id) {
        whereClause += ' AND p.customer_id = ?';
        queryParams.push(filters.customer_id);
      }

      if (filters.project_manager_id) {
        whereClause += ' AND p.project_manager_id = ?';
        queryParams.push(filters.project_manager_id);
      }

      if (filters.search) {
        whereClause += ' AND (p.project_name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      const sql = `
        SELECT 
          p.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          u1.name as created_by_name,
          u2.name as project_manager_name,
          u3.name as assigned_upseller_name,
          COUNT(DISTINCT pd.id) as departments_count,
          COUNT(DISTINCT pt.id) as tasks_count,
          COUNT(DISTINCT CASE WHEN pt.status = 'completed' THEN pt.id END) as completed_tasks
        FROM projects p
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN users u1 ON p.created_by = u1.id
        LEFT JOIN users u2 ON p.project_manager_id = u2.id
        LEFT JOIN users u3 ON p.assigned_upseller_id = u3.id
        LEFT JOIN project_departments pd ON p.id = pd.project_id
        LEFT JOIN project_tasks pt ON p.id = pt.project_id
        ${whereClause}
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;

      db.query(sql, queryParams, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get project by ID with full details
   * @param {number} projectId - Project ID
   */
  static async getProjectById(projectId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          p.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          u1.name as created_by_name,
          u2.name as project_manager_name,
          u3.name as assigned_upseller_name
        FROM projects p
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN users u1 ON p.created_by = u1.id
        LEFT JOIN users u2 ON p.project_manager_id = u2.id
        LEFT JOIN users u3 ON p.assigned_upseller_id = u3.id
        WHERE p.id = ?
      `;

      db.query(sql, [projectId], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) {
          return reject(new Error('Project not found'));
        }
        resolve(results[0]);
      });
    });
  }

  /**
   * Get project attachments
   * @param {number} projectId - Project ID
   */
  static async getProjectAttachments(projectId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pa.*,
          u.name as uploaded_by_name
        FROM project_attachments pa
        LEFT JOIN users u ON pa.uploaded_by = u.id
        WHERE pa.project_id = ?
        ORDER BY pa.created_at DESC
      `;

      db.query(sql, [projectId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Add attachment to project
   * @param {Object} attachmentData - Attachment data
   */
  static async addProjectAttachment(attachmentData) {
    return new Promise((resolve, reject) => {
      const {
        project_id,
        file_name,
        file_path,
        file_size,
        file_type,
        uploaded_by
      } = attachmentData;

      const sql = `
        INSERT INTO project_attachments (
          project_id, file_name, file_path, file_size, file_type, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const values = [
        project_id, file_name, file_path, file_size, file_type, uploaded_by
      ];

      db.query(sql, values, (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  /**
   * Delete project attachment
   * @param {number} attachmentId - Attachment ID
   */
  static async deleteProjectAttachment(attachmentId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM project_attachments WHERE id = ?';
      
      db.query(sql, [attachmentId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Update project
   * @param {number} projectId - Project ID
   * @param {Object} updateData - Update data
   */
  static async updateProject(projectId, updateData) {
    return new Promise((resolve, reject) => {
      const allowedFields = [
        'project_name', 'description', 'status', 'priority',
        'start_date', 'end_date', 'budget', 'project_manager_id'
      ];

      const updateFields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          // Handle empty strings for date and numeric fields
          if ((key === 'start_date' || key === 'end_date') && updateData[key] === '') {
            values.push(null);
          } else if (key === 'budget' && updateData[key] === '') {
            values.push(null);
          } else {
            values.push(updateData[key]);
          }
        }
      });

      if (updateFields.length === 0) {
        return reject(new Error('No valid fields to update'));
      }

      values.push(projectId);

      const sql = `
        UPDATE projects 
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
   * Delete project
   * @param {number} projectId - Project ID
   */
  static async deleteProject(projectId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM projects WHERE id = ?';
      
      db.query(sql, [projectId], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Get projects for a specific customer
   * @param {number} customerId - Customer ID
   */
  static async getProjectsByCustomer(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          p.*,
          u1.name as created_by_name,
          u2.name as project_manager_name,
          COUNT(DISTINCT pd.id) as departments_count,
          COUNT(DISTINCT pt.id) as tasks_count,
          COUNT(DISTINCT CASE WHEN pt.status = 'completed' THEN pt.id END) as completed_tasks
        FROM projects p
        LEFT JOIN users u1 ON p.created_by = u1.id
        LEFT JOIN users u2 ON p.project_manager_id = u2.id
        LEFT JOIN project_departments pd ON p.id = pd.project_id
        LEFT JOIN project_tasks pt ON p.id = pt.project_id
        WHERE p.customer_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;

      db.query(sql, [customerId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get projects managed by a specific user
   * @param {number} userId - User ID
   */
  static async getProjectsByManager(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          p.*,
          c.name as customer_name,
          c.email as customer_email,
          u1.name as created_by_name,
          COUNT(DISTINCT pd.id) as departments_count,
          COUNT(DISTINCT pt.id) as tasks_count,
          COUNT(DISTINCT CASE WHEN pt.status = 'completed' THEN pt.id END) as completed_tasks
        FROM projects p
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN users u1 ON p.created_by = u1.id
        LEFT JOIN project_departments pd ON p.id = pd.project_id
        LEFT JOIN project_tasks pt ON p.id = pt.project_id
        WHERE p.project_manager_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;

      db.query(sql, [userId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get project statistics
   * @param {number} userId - User ID (optional)
   */
  static async getProjectStats(userId = null) {
    return new Promise((resolve, reject) => {
      let whereClause = '';
      let queryParams = [];

      if (userId) {
        whereClause = 'WHERE p.project_manager_id = ?';
        queryParams.push(userId);
      }

      const sql = `
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning_projects,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
          COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_projects,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_projects,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_projects,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_projects,
          AVG(budget) as average_budget,
          SUM(budget) as total_budget
        FROM projects p
        ${whereClause}
      `;

      db.query(sql, queryParams, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  }
}

module.exports = ProjectService;
