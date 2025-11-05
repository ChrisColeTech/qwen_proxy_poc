# Database Migrations - Quick Reference

Quick reference guide for common migration tasks.

---

## Commands

### Check Status
```bash
node scripts/migrate.js status
```

### Run Migrations
```bash
node scripts/migrate.js up
```

### Rollback (Dev Only)
```bash
node scripts/migrate.js down
```

---

## Creating a New Migration

### 1. Create File

File: `src/database/migrations/003-description.js`

### 2. Basic Template

```javascript
/**
 * Migration 003: Description
 * Explain what this migration does
 */

module.exports = {
  name: 'Short description',
  version: 3,

  up(db) {
    console.log('[Migration 003] Applying changes...');
    // Add your schema changes here
    console.log('[Migration 003] Changes applied');
  },

  down(db) {
    console.log('[Migration 003] Rolling back...');
    // Add rollback logic here
    console.log('[Migration 003] Rollback complete');
  }
};
```

### 3. Test Migration

```bash
# Check it's detected
node scripts/migrate.js status

# Apply it
node scripts/migrate.js up

# Verify schema
sqlite3 data/qwen_proxy.db ".schema"
```

---

## Common Patterns

### Add Column

```javascript
up(db) {
  // Check if column exists (idempotent)
  const info = db.prepare("PRAGMA table_info(sessions)").all();
  const exists = info.some(col => col.name === 'new_column');

  if (!exists) {
    db.exec('ALTER TABLE sessions ADD COLUMN new_column TEXT');
  }

  // Add index
  db.exec('CREATE INDEX IF NOT EXISTS idx_new ON sessions(new_column)');
}
```

### Add Table

```javascript
up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS new_table (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_name ON new_table(name)');
}
```

### Drop Table

```javascript
down(db) {
  db.exec('DROP TABLE IF EXISTS new_table');
}
```

### Update Data

```javascript
up(db) {
  const stmt = db.prepare('UPDATE sessions SET status = ? WHERE expires_at > ?');
  stmt.run('active', Date.now());
  console.log(`Updated ${stmt.changes} rows`);
}
```

---

## Best Practices

1. ✅ **Use IF NOT EXISTS** - Makes migrations idempotent
2. ✅ **Add Indexes** - For columns used in WHERE/JOIN
3. ✅ **Log Changes** - Console output helps debugging
4. ✅ **Test Rollback** - Ensure `down()` works
5. ✅ **Backup First** - Always backup before migration
6. ⚠️ **Avoid DROP COLUMN** - SQLite doesn't support it

---

## File Naming

**Format:** `<version>-<description>.js`

**Examples:**
- `001-initial-schema.js`
- `002-add-user-field.js`
- `003-add-api-keys-table.js`
- `004-optimize-indexes.js`

**Rules:**
- 3-digit version number
- kebab-case description
- `.js` extension

---

## Testing Checklist

Before deploying a migration:

- [ ] Backup database: `cp data/qwen_proxy.db data/backup.db`
- [ ] Check status: `node scripts/migrate.js status`
- [ ] Review changes in migration file
- [ ] Run migration: `node scripts/migrate.js up`
- [ ] Verify schema: `sqlite3 data/qwen_proxy.db ".schema"`
- [ ] Test application functionality
- [ ] Test rollback: `node scripts/migrate.js down` (optional)
- [ ] Re-apply: `node scripts/migrate.js up`
- [ ] Commit migration file to git

---

## Troubleshooting

### Database Locked
```bash
# Increase busy timeout
# Add to connection.js:
db.pragma('busy_timeout = 5000');
```

### Column Already Exists
```javascript
// Check before adding
const info = db.prepare("PRAGMA table_info(table_name)").all();
const exists = info.some(col => col.name === 'column_name');
if (!exists) {
  db.exec('ALTER TABLE table_name ADD COLUMN column_name TEXT');
}
```

### Migration Failed
```bash
# Transaction auto-rolls back
# Fix the migration file and retry
node scripts/migrate.js up
```

---

## Emergency Rollback

```bash
# 1. Stop server
pm2 stop qwen-proxy

# 2. Backup current database
cp data/qwen_proxy.db data/qwen_proxy.db.emergency

# 3. Restore previous backup
cp data/qwen_proxy.db.backup data/qwen_proxy.db

# 4. Reset schema version (if needed)
sqlite3 data/qwen_proxy.db "UPDATE metadata SET value = '1' WHERE key = 'schema_version';"

# 5. Restart server
pm2 start qwen-proxy
```

---

## Files & Locations

- **Migrations:** `/src/database/migrations/`
- **CLI Tool:** `/scripts/migrate.js`
- **Runner:** `/src/database/migrations.js`
- **Docs:** `/docs/MIGRATIONS.md`
- **Database:** `/data/qwen_proxy.db`

---

## Help

Full documentation: `/docs/MIGRATIONS.md`

```bash
node scripts/migrate.js --help
```
