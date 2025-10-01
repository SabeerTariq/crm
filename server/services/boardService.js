const db = require('../db');

class BoardService {
  
  /**
   * Get all boards
   */
  static async getAllBoards() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          b.*,
          d.department_name,
          u.name as created_by_name
        FROM boards b
        LEFT JOIN departments d ON b.department_id = d.id
        LEFT JOIN users u ON b.created_by = u.id
        ORDER BY d.department_name, b.board_name
      `;

      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get boards by department
   * @param {number} departmentId - Department ID
   */
  static async getBoardsByDepartment(departmentId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          b.*,
          d.department_name,
          u.name as created_by_name
        FROM boards b
        LEFT JOIN departments d ON b.department_id = d.id
        LEFT JOIN users u ON b.created_by = u.id
        WHERE b.department_id = ?
        ORDER BY b.is_default DESC, b.board_name
      `;

      db.query(sql, [departmentId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get a single board by ID
   * @param {number} boardId - Board ID
   */
  static async getBoardById(boardId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          b.*,
          d.department_name,
          u.name as created_by_name
        FROM boards b
        LEFT JOIN departments d ON b.department_id = d.id
        LEFT JOIN users u ON b.created_by = u.id
        WHERE b.id = ?
      `;

      db.query(sql, [boardId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0] || null);
      });
    });
  }

  /**
   * Create a new board
   * @param {Object} boardData - Board data
   */
  static async createBoard(boardData) {
    return new Promise((resolve, reject) => {
      const {
        board_name,
        department_id,
        description,
        created_by
      } = boardData;

      const sql = `
        INSERT INTO boards (board_name, department_id, description, created_by)
        VALUES (?, ?, ?, ?)
      `;

      const values = [board_name, department_id, description, created_by];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return reject(err);
        }
        resolve(result.insertId);
      });
    });
  }

  /**
   * Update a board
   * @param {number} boardId - Board ID
   * @param {Object} boardData - Updated board data
   */
  static async updateBoard(boardId, boardData) {
    return new Promise((resolve, reject) => {
      const {
        board_name,
        description
      } = boardData;

      const sql = `
        UPDATE boards 
        SET board_name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const values = [board_name, description, boardId];

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
   * Delete a board
   * @param {number} boardId - Board ID
   */
  static async deleteBoard(boardId) {
    return new Promise((resolve, reject) => {
      // First check if it's a default board
      const checkSql = 'SELECT is_default FROM boards WHERE id = ?';
      
      db.query(checkSql, [boardId], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return reject(err);
        }

        if (results.length === 0) {
          return reject(new Error('Board not found'));
        }

        if (results[0].is_default) {
          return reject(new Error('Cannot delete default board'));
        }

        // Move tasks to default board of the same department
        const moveTasksSql = `
          UPDATE project_tasks pt
          JOIN boards b ON pt.board_id = ?
          JOIN boards default_board ON b.department_id = default_board.department_id 
            AND default_board.is_default = TRUE
          SET pt.board_id = default_board.id
          WHERE pt.board_id = ?
        `;

        db.query(moveTasksSql, [boardId, boardId], (err) => {
          if (err) {
            console.error('Database error:', err);
            return reject(err);
          }

          // Delete the board
          const deleteSql = 'DELETE FROM boards WHERE id = ?';
          
          db.query(deleteSql, [boardId], (err, result) => {
            if (err) {
              console.error('Database error:', err);
              return reject(err);
            }
            resolve(result.affectedRows > 0);
          });
        });
      });
    });
  }

  /**
   * Get tasks for a specific board
   * @param {number} boardId - Board ID
   * @param {Object} filters - Filter options
   */
  static async getTasksForBoard(boardId, filters = {}) {
    return new Promise((resolve, reject) => {
      let whereClause = 'WHERE pt.board_id = ?';
      let queryParams = [boardId];

      // Apply additional filters
      if (filters.project_id) {
        whereClause += ' AND pt.project_id = ?';
        queryParams.push(filters.project_id);
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
}

module.exports = BoardService;
