// Lab 4: база данных SQLite в браузере.
// SQLite скомпилирован в WebAssembly (библиотека sql.js), файл базы хранится в IndexedDB,
// поэтому сайт работает на GitHub Pages без сервера.

const Db = (() => {
    const SQL_JS_CDN = 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/';
    const IDB_NAME = 'web_labs_lab4';
    const IDB_STORE = 'files';
    const IDB_KEY = 'database.sqlite';

    const SCHEMA = `
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name     TEXT    NOT NULL CHECK (length(full_name) BETWEEN 2 AND 50),
            username      TEXT    NOT NULL UNIQUE COLLATE NOCASE
                                  CHECK (length(username) BETWEEN 3 AND 20),
            email         TEXT    NOT NULL UNIQUE COLLATE NOCASE CHECK (email LIKE '%_@_%._%'),
            password_hash TEXT    NOT NULL,
            salt          TEXT    NOT NULL,
            created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
            last_login    TEXT
        );

        CREATE TABLE IF NOT EXISTS sessions (
            token      TEXT    PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TEXT    NOT NULL DEFAULT (datetime('now')),
            expires_at TEXT    NOT NULL
        );
    `;

    let db = null;
    let opening = null;

    // ---------- IndexedDB: хранение файла базы ----------
    function idb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(IDB_NAME, 1);
            request.onupgradeneeded = () => request.result.createObjectStore(IDB_STORE);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function readFile() {
        const store = (await idb()).transaction(IDB_STORE).objectStore(IDB_STORE);
        return new Promise((resolve, reject) => {
            const request = store.get(IDB_KEY);
            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => reject(request.error);
        });
    }

    async function writeFile(bytes) {
        const tx = (await idb()).transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(bytes, IDB_KEY);
        return new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }

    // ---------- Открытие базы ----------
    async function create(SQL) {
        const fresh = new SQL.Database();
        fresh.exec(SCHEMA);
        db = fresh;
        await seed();
        await save();
    }

    // Демо-пользователь, чтобы можно было сразу войти: dinmukhamad / Lab3pass
    async function seed() {
        const salt = Auth.randomHex(16);
        run(
            `INSERT INTO users (full_name, username, email, password_hash, salt)
             VALUES (?, ?, ?, ?, ?)`,
            ['Dinmukhamad', 'dinmukhamad', 'dinmukhamad@example.com', await Auth.hashPassword('Lab3pass', salt), salt],
        );
    }

    async function load() {
        const SQL = await initSqlJs({ locateFile: (file) => SQL_JS_CDN + file });
        const bytes = await readFile();
        if (bytes) {
            db = new SQL.Database(bytes);
            db.exec(SCHEMA); // на случай, если в старом файле нет новых таблиц
        } else {
            await create(SQL);
        }
        db.exec('PRAGMA foreign_keys = ON');
        return db;
    }

    /** Открывает базу один раз за загрузку страницы. */
    function open() {
        opening ??= load();
        return opening;
    }

    /** Сохраняет текущее состояние базы в IndexedDB. */
    async function save() {
        await writeFile(db.export());
        db.exec('PRAGMA foreign_keys = ON');
    }

    // ---------- Запросы (только параметризованные — защита от SQL-инъекций) ----------
    function query(sql, params = []) {
        const stmt = db.prepare(sql);
        try {
            stmt.bind(params);
            const rows = [];
            while (stmt.step()) rows.push(stmt.getAsObject());
            return rows;
        } finally {
            stmt.free();
        }
    }

    function run(sql, params = []) {
        db.run(sql, params);
        return { changes: db.getRowsModified(), lastId: query('SELECT last_insert_rowid() AS id')[0].id };
    }

    /** Выполняет произвольный SQL (для SQL-консоли). Возвращает [{columns, values}]. */
    function exec(sql) {
        return db.exec(sql);
    }

    /** Файл базы для скачивания (.sqlite можно открыть в DB Browser for SQLite). */
    function exportFile() {
        const bytes = db.export();
        db.exec('PRAGMA foreign_keys = ON');
        return new Blob([bytes], { type: 'application/vnd.sqlite3' });
    }

    /** Удаляет все данные и создаёт базу заново с демо-пользователем. */
    async function reset() {
        await open();
        const SQL = await initSqlJs({ locateFile: (file) => SQL_JS_CDN + file });
        db.close();
        await create(SQL);
        db.exec('PRAGMA foreign_keys = ON');
    }

    return { open, save, query, run, exec, exportFile, reset };
})();
