import { getDatabase } from '../connection.js'

/**
 * Base Repository
 * Provides common database operations for all repositories
 */
export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName
    this._db = null
  }

  /**
   * Get database connection (lazy initialization)
   */
  get db() {
    if (!this._db) {
      this._db = getDatabase()
    }
    return this._db
  }

  /**
   * Find one record by column value
   */
  findOne(column, value) {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE ${column} = ?`)
    return stmt.get(value)
  }

  /**
   * Find one record by ID
   */
  findById(id) {
    return this.findOne('id', id)
  }

  /**
   * Find all records matching criteria
   */
  findAll(where = {}, orderBy = 'id', limit = null, offset = 0) {
    let sql = `SELECT * FROM ${this.tableName}`
    const params = []

    // Build WHERE clause
    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        params.push(where[key])
        return `${key} = ?`
      })
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    // Add ORDER BY
    sql += ` ORDER BY ${orderBy}`

    // Add LIMIT and OFFSET
    if (limit) {
      sql += ` LIMIT ? OFFSET ?`
      params.push(limit, offset)
    }

    const stmt = this.db.prepare(sql)
    return stmt.all(...params)
  }

  /**
   * Count records matching criteria
   */
  count(where = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`
    const params = []

    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        params.push(where[key])
        return `${key} = ?`
      })
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    const stmt = this.db.prepare(sql)
    const result = stmt.get(...params)
    return result.count
  }

  /**
   * Insert a new record
   */
  create(data) {
    const columns = Object.keys(data)
    const placeholders = columns.map(() => '?').join(', ')
    const values = Object.values(data)

    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`
    const stmt = this.db.prepare(sql)
    const info = stmt.run(...values)

    return info.lastInsertRowid
  }

  /**
   * Update a record by ID
   */
  update(id, data) {
    const columns = Object.keys(data)
    const setClause = columns.map(col => `${col} = ?`).join(', ')
    const values = [...Object.values(data), id]

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`
    const stmt = this.db.prepare(sql)
    const info = stmt.run(...values)

    return info.changes
  }

  /**
   * Delete a record by ID
   */
  delete(id) {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`)
    const info = stmt.run(id)
    return info.changes
  }

  /**
   * Delete all records matching criteria
   */
  deleteWhere(where) {
    const conditions = Object.keys(where).map(key => `${key} = ?`)
    const values = Object.values(where)

    const sql = `DELETE FROM ${this.tableName} WHERE ${conditions.join(' AND ')}`
    const stmt = this.db.prepare(sql)
    const info = stmt.run(...values)
    return info.changes
  }

  /**
   * Execute a raw SQL query
   */
  raw(sql, params = []) {
    const stmt = this.db.prepare(sql)
    return stmt.all(...params)
  }
}

export default BaseRepository
