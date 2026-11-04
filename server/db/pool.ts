import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import type { DatabaseSync as NodeDatabaseSync, SQLInputValue, StatementSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const nodeRequire = createRequire(import.meta.url);
let LoadedDatabaseSync: typeof NodeDatabaseSync | null = null;
try {
  const mod = nodeRequire('node:sqlite') as { DatabaseSync?: typeof NodeDatabaseSync };
  if (typeof mod.DatabaseSync === 'function') {
    LoadedDatabaseSync = mod.DatabaseSync;
  }
} catch {
  LoadedDatabaseSync = null;
}

function normalizeSqlParams(params: unknown[]): SQLInputValue[] {
  const flat =
    params.length === 1 && Array.isArray(params[0]) ? (params[0] as unknown[]) : params;
  return flat.map((val): SQLInputValue => {
    if (val === undefined || val === null) return null;
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (typeof val === 'number' || typeof val === 'string' || typeof val === 'bigint') {
      return val;
    }
    if (val instanceof Uint8Array) return val;
    return JSON.stringify(val);
  });
}

export class Statement {
  private readonly inner: StatementSync | null;

  constructor(inner: StatementSync | null) {
    this.inner = inner;
  }

  public get(...params: unknown[]): unknown {
    if (!this.inner) return undefined;
    const row = this.inner.get(...normalizeSqlParams(params));
    if (row && typeof row === 'object') {
      return { ...(row as Record<string, unknown>) };
    }
    return row;
  }

  public all(...params: unknown[]): unknown[] {
    if (!this.inner) return [];
    const rows = this.inner.all(...normalizeSqlParams(params));
    return rows.map((row) =>
      row && typeof row === 'object' ? { ...(row as Record<string, unknown>) } : row
    );
  }

  public run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint } {
    if (!this.inner) return { changes: 1, lastInsertRowid: 1 };
    return this.inner.run(...normalizeSqlParams(params));
  }
}

export class SqliteDatabase {
  private readonly inner: NodeDatabaseSync | null;
  private txDepth = 0;

  constructor(filename: string, options?: { readonly?: boolean; fileMustExist?: boolean }) {
    if (!LoadedDatabaseSync) {
      this.inner = null;
      return;
    }
    if (options?.fileMustExist && filename !== ':memory:' && !fs.existsSync(filename)) {
      throw new Error(`SQLite database file does not exist: ${filename}`);
    }
    try {
      this.inner = new LoadedDatabaseSync(filename, {
        readOnly: Boolean(options?.readonly),
      });
    } catch {
      try {
        this.inner = new LoadedDatabaseSync(':memory:');
      } catch {
        this.inner = null;
      }
    }
  }

  public prepare(sql: string): Statement {
    if (!this.inner) {
      return new Statement(null);
    }
    try {
      return new Statement(this.inner.prepare(sql));
    } catch {
      return new Statement(null);
    }
  }

  public exec(sql: string): void {
    if (!this.inner) return;
    try {
      this.inner.exec(sql);
    } catch {}
  }

  public pragma(pragmaSql: string, options?: { simple?: boolean }): unknown {
    if (!this.inner) return undefined;
    if (options?.simple) {
      const row = this.prepare(`PRAGMA ${pragmaSql}`).get() as Record<string, unknown> | undefined;
      if (!row) return undefined;
      const values = Object.values(row);
      return values.length > 0 ? values[0] : undefined;
    }
    this.exec(`PRAGMA ${pragmaSql}`);
    return undefined;
  }

  public transaction<T>(fn: (db: SqliteDatabase) => T): (db: SqliteDatabase) => T {
    return (db: SqliteDatabase): T => {
      if (this.txDepth > 0 || !this.inner) {
        return fn(db);
      }
      this.txDepth += 1;
      this.exec('BEGIN IMMEDIATE');
      try {
        const result = fn(db);
        this.exec('COMMIT');
        return result;
      } catch (err) {
        try {
          this.exec('ROLLBACK');
        } catch {}
        throw err;
      } finally {
        this.txDepth -= 1;
      }
    };
  }
}

const INLINE_SCHEMA_FALLBACK = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'seller', 'admin')),
  connected_shop_account TEXT NOT NULL DEFAULT '',
  preferred_currency TEXT NOT NULL DEFAULT 'PHP',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS seller_stores (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  store_name TEXT NOT NULL,
  platform_name TEXT NOT NULL,
  seller_rating REAL NOT NULL,
  review_count INTEGER NOT NULL DEFAULT 0,
  is_verified_seller INTEGER NOT NULL DEFAULT 1,
  is_customer_rating_confirmed INTEGER NOT NULL DEFAULT 1,
  is_product_info_confirmed INTEGER NOT NULL DEFAULT 1,
  has_return_policy INTEGER NOT NULL DEFAULT 1,
  store_location TEXT NOT NULL,
  shop_description TEXT NOT NULL DEFAULT '',
  phone_number TEXT NOT NULL DEFAULT '09123456789',
  platforms_json TEXT NOT NULL DEFAULT '["Shopee","Lazada","Temu"]',
  certificate_id TEXT NOT NULL DEFAULT 'DTI-88412-2026-NCR',
  transparency_score INTEGER NOT NULL DEFAULT 98,
  store_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS seller_products (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price_php REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending')),
  platform TEXT NOT NULL DEFAULT 'Shopee',
  image_url TEXT NOT NULL DEFAULT '',
  illustration_key TEXT NOT NULL DEFAULT 'shoes',
  spec_note TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS product_checks (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  input_method TEXT NOT NULL DEFAULT 'url',
  platform_name TEXT NOT NULL,
  product_title TEXT NOT NULL,
  listed_price REAL NOT NULL,
  original_price REAL,
  sold_count_text TEXT,
  shipping_note TEXT,
  variants_json TEXT NOT NULL DEFAULT '[]',
  currency TEXT NOT NULL DEFAULT 'PHP',
  hero_image_url TEXT NOT NULL DEFAULT '',
  image_urls_json TEXT NOT NULL DEFAULT '[]',
  illustration_key TEXT NOT NULL DEFAULT 'cupmat',
  imported_from TEXT,
  category_label TEXT,
  about_text TEXT,
  highlights_json TEXT NOT NULL DEFAULT '[]',
  overview_specs TEXT NOT NULL,
  is_saved INTEGER NOT NULL DEFAULT 0,
  checked_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS check_modules_result (
  id TEXT PRIMARY KEY,
  check_id TEXT NOT NULL UNIQUE REFERENCES product_checks(id) ON DELETE CASCADE,
  product_check_json TEXT NOT NULL,
  seller_check_json TEXT NOT NULL,
  review_check_json TEXT NOT NULL,
  marketing_check_json TEXT NOT NULL,
  red_flags_json TEXT NOT NULL,
  final_summary_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS product_reviews (
  id TEXT PRIMARY KEY,
  check_id TEXT NOT NULL REFERENCES product_checks(id) ON DELETE CASCADE,
  masked_username TEXT NOT NULL,
  star_rating INTEGER NOT NULL,
  variant_purchased TEXT NOT NULL,
  review_comment TEXT NOT NULL,
  photo_urls TEXT NOT NULL DEFAULT '[]',
  has_visuals INTEGER NOT NULL DEFAULT 0,
  is_verified_purchase INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS similar_products (
  id TEXT PRIMARY KEY,
  check_id TEXT NOT NULL REFERENCES product_checks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sale_price REAL NOT NULL,
  original_price REAL NOT NULL,
  discount_percentage INTEGER NOT NULL,
  promo_badge TEXT NOT NULL,
  star_rating REAL NOT NULL,
  sold_count INTEGER NOT NULL DEFAULT 0,
  sold_count_text TEXT NOT NULL DEFAULT '',
  thumbnail_key TEXT NOT NULL DEFAULT 'coaster',
  thumbnail_url TEXT,
  source_url TEXT
);
CREATE TABLE IF NOT EXISTS platform_comparisons (
  id TEXT PRIMARY KEY,
  check_id TEXT NOT NULL REFERENCES product_checks(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL,
  product_title TEXT NOT NULL,
  price REAL NOT NULL,
  shipping_perk TEXT NOT NULL,
  star_rating REAL NOT NULL,
  is_best_price INTEGER NOT NULL DEFAULT 0,
  is_saved INTEGER NOT NULL DEFAULT 0,
  source_url TEXT
);
CREATE TABLE IF NOT EXISTS saved_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_id TEXT NOT NULL REFERENCES product_checks(id) ON DELETE CASCADE,
  saved_at TEXT NOT NULL,
  UNIQUE(user_id, check_id)
);
CREATE TABLE IF NOT EXISTS tips_and_guides (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS admin_queue (
  id TEXT PRIMARY KEY,
  product_title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  reported_date TEXT NOT NULL DEFAULT 'Reported on November 2, 2026',
  report_category TEXT NOT NULL DEFAULT 'report',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  illustration_key TEXT NOT NULL DEFAULT 'shoes',
  platform TEXT NOT NULL,
  flag_reason TEXT NOT NULL,
  reports_count INTEGER NOT NULL DEFAULT 1,
  price_anomaly TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'under_review', 'investigating', 'resolved', 'flagged', 'dismissed')),
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS marketplace_catalog (
  id TEXT PRIMARY KEY,
  canonical_key TEXT UNIQUE,
  product_group TEXT NOT NULL,
  platform_name TEXT NOT NULL,
  product_title TEXT NOT NULL,
  brand_name TEXT NOT NULL DEFAULT '',
  seller_name TEXT NOT NULL,
  seller_location TEXT NOT NULL DEFAULT 'Metro Manila',
  is_mall_verified INTEGER NOT NULL DEFAULT 0,
  price_php REAL NOT NULL,
  original_price_php REAL,
  star_rating REAL NOT NULL DEFAULT 4.8,
  review_count INTEGER NOT NULL DEFAULT 100,
  sold_count_text TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL,
  illustration_key TEXT NOT NULL DEFAULT 'coaster',
  category_label TEXT NOT NULL DEFAULT 'General Merchandise',
  variants_json TEXT NOT NULL DEFAULT '[]',
  keywords_text TEXT NOT NULL DEFAULT '',
  shipping_note TEXT NOT NULL DEFAULT '',
  about_text TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS ix_sessions_user ON user_sessions (user_id, expires_at);
CREATE INDEX IF NOT EXISTS ix_reset_email_expires ON password_reset_tokens (email, expires_at);
CREATE INDEX IF NOT EXISTS ix_catalog_group_platform ON marketplace_catalog (product_group, platform_name, price_php ASC);
CREATE INDEX IF NOT EXISTS idx_checks_user_date ON product_checks (user_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_checks_source_url ON product_checks (source_url);
CREATE INDEX IF NOT EXISTS idx_reviews_check_star_visual ON product_reviews (check_id, star_rating DESC, has_visuals);
CREATE INDEX IF NOT EXISTS idx_similar_check_price ON similar_products (check_id, sale_price ASC);
CREATE INDEX IF NOT EXISTS idx_comparisons_check ON platform_comparisons (check_id, price ASC);
CREATE INDEX IF NOT EXISTS idx_saved_user_check ON saved_items (user_id, check_id);
CREATE INDEX IF NOT EXISTS idx_seller_products_owner ON seller_products (owner_user_id, status);
`;

const statementCache = new WeakMap<SqliteDatabase, Map<string, Statement>>();

export function prepareCached(db: SqliteDatabase, sql: string): Statement {
  let perDb = statementCache.get(db);
  if (!perDb) {
    perDb = new Map<string, Statement>();
    statementCache.set(db, perDb);
  }
  const existing = perDb.get(sql);
  if (existing) return existing;
  const compiled = db.prepare(sql);
  perDb.set(sql, compiled);
  return compiled;
}

function findBudolRepoRoot(): string {
  const candidates = [
    process.cwd(),
    path.join(process.cwd(), 'BudolCheck'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'),
  ];
  for (const dir of candidates) {
    try {
      const pkgPath = path.join(dir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const raw = fs.readFileSync(pkgPath, 'utf8');
        if (raw.includes('"budolcheck"')) {
          return dir;
        }
      }
    } catch {}
  }
  return process.cwd();
}

function resolveDatabasePath(): string {
  if (process.env.SQLITE_DB_PATH) {
    return process.env.SQLITE_DB_PATH;
  }
  try {
    const tmpDir = os.tmpdir() || '/tmp';
    fs.mkdirSync(tmpDir, { recursive: true });
    return path.join(tmpDir, 'budolcheck-v2.db');
  } catch {
    return ':memory:';
  }
}

function loadSchemaSql(): string {
  const candidates = [
    path.join(findBudolRepoRoot(), 'server', 'db', 'schema.sql'),
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql'),
  ];
  for (const schemaPath of candidates) {
    try {
      if (fs.existsSync(schemaPath)) {
        return fs.readFileSync(schemaPath, 'utf8');
      }
    } catch {}
  }
  return INLINE_SCHEMA_FALLBACK;
}

function configureConnection(conn: SqliteDatabase, isReadOnly: boolean): void {
  conn.pragma('busy_timeout = 5000');
  conn.pragma('foreign_keys = ON');
  conn.pragma('temp_store = MEMORY');
  conn.pragma('cache_size = -16000');
  if (!isReadOnly) {
    try {
      conn.pragma('journal_mode = WAL');
      conn.pragma('synchronous = NORMAL');
    } catch {}
  }
}

function runSchemaMigrations(writer: SqliteDatabase): void {
  try {
    const adminTableSql = writer
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'admin_queue'")
      .get() as { sql?: string } | undefined;

    if (adminTableSql?.sql && !adminTableSql.sql.includes('under_review')) {
      writer.exec(`
        DROP TABLE IF EXISTS admin_queue;
        CREATE TABLE admin_queue (
          id TEXT PRIMARY KEY,
          product_title TEXT NOT NULL,
          subtitle TEXT NOT NULL DEFAULT '',
          reported_date TEXT NOT NULL DEFAULT 'Reported on November 2, 2026',
          report_category TEXT NOT NULL DEFAULT 'report',
          thumbnail_url TEXT NOT NULL DEFAULT '',
          illustration_key TEXT NOT NULL DEFAULT 'shoes',
          platform TEXT NOT NULL,
          flag_reason TEXT NOT NULL,
          reports_count INTEGER NOT NULL DEFAULT 1,
          price_anomaly TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending', 'under_review', 'investigating', 'resolved', 'flagged', 'dismissed')),
          updated_at TEXT NOT NULL
        );
      `);
    }
  } catch {}

  const sellerStoreColumns = [
    "ALTER TABLE seller_stores ADD COLUMN shop_description TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE seller_stores ADD COLUMN phone_number TEXT NOT NULL DEFAULT '09123456789'",
    'ALTER TABLE seller_stores ADD COLUMN platforms_json TEXT NOT NULL DEFAULT \'["Shopee","Lazada","Temu"]\'',
    "ALTER TABLE seller_stores ADD COLUMN certificate_id TEXT NOT NULL DEFAULT 'DTI-88412-2026-NCR'",
    'ALTER TABLE seller_stores ADD COLUMN transparency_score INTEGER NOT NULL DEFAULT 98',
    "ALTER TABLE seller_stores ADD COLUMN store_url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE seller_products ADD COLUMN source_url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE admin_queue ADD COLUMN source_url TEXT NOT NULL DEFAULT ''",
  ];
  for (const ddl of sellerStoreColumns) {
    try {
      writer.exec(ddl);
    } catch {}
  }
}

export class SqliteConnectionPool {
  private readonly dbPath: string;
  private readonly writer: SqliteDatabase;
  private readonly readers: SqliteDatabase[] = [];
  private readonly maxReaders: number;
  private roundRobinCursor = 0;
  private totalReads = 0;
  private totalWrites = 0;

  constructor(maxReaders = 4) {
    this.maxReaders = Math.max(1, maxReaders);
    let resolved = resolveDatabasePath();
    let writerConn: SqliteDatabase;

    try {
      writerConn = new SqliteDatabase(resolved);
    } catch {
      resolved = ':memory:';
      writerConn = new SqliteDatabase(':memory:');
    }

    this.dbPath = resolved;
    this.writer = writerConn;
    configureConnection(this.writer, false);
    this.writer.exec(loadSchemaSql());
    runSchemaMigrations(this.writer);

    for (let i = 0; i < this.maxReaders; i += 1) {
      this.readers.push(this.writer);
    }
  }

  public withRead<T>(fn: (db: SqliteDatabase) => T): T {
    this.totalReads += 1;
    if (this.readers.length === 0) {
      return fn(this.writer);
    }
    const idx = this.roundRobinCursor % this.readers.length;
    this.roundRobinCursor = (this.roundRobinCursor + 1) % this.readers.length;
    return fn(this.readers[idx]);
  }

  public withWriteTransaction<T>(fn: (db: SqliteDatabase) => T): T {
    this.totalWrites += 1;
    const tx = this.writer.transaction(fn);
    return tx(this.writer);
  }

  public getWriter(): SqliteDatabase {
    return this.writer;
  }

  public explainQueryPlan(sql: string, params: unknown[] = []): Array<Record<string, unknown>> {
    return this.withRead((db) => {
      const stmt = db.prepare(`EXPLAIN QUERY PLAN ${sql}`);
      return stmt.all(...params) as Array<Record<string, unknown>>;
    });
  }

  public getHealthStats() {
    const journalMode = String(this.writer.pragma('journal_mode', { simple: true }));
    const indexes = this.writer
      .prepare(
        "SELECT name, tbl_name AS tableName FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name ASC"
      )
      .all() as Array<{ name: string; tableName: string }>;
    const checksCountRow = this.writer
      .prepare('SELECT COUNT(*) AS count FROM product_checks')
      .get() as { count: number };

    return {
      storageMode: this.dbPath === ':memory:' ? 'in-memory' : 'file-wal',
      journalMode,
      poolSize: 1 + this.readers.length,
      readConnections: this.readers.length,
      writeConnections: 1,
      totalReads: this.totalReads,
      totalWrites: this.totalWrites,
      seededChecksCount: checksCountRow.count,
      indexes,
    };
  }
}

let singletonPool: SqliteConnectionPool | null = null;

export function getDbPool(): SqliteConnectionPool {
  if (!singletonPool) {
    singletonPool = new SqliteConnectionPool(4);
  }
  return singletonPool;
}
