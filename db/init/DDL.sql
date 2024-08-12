CREATE TABLE IF NOT EXISTS leetcode_problems (
    frontend_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    acceptance_rate REAL,
    is_premium BOOLEAN,
    url TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lists (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    tags TEXT,
    difficulty TEXT,
    estimated_time TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS list_items (
    id SERIAL PRIMARY KEY,
    list_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES leetcode_problems(frontend_id)
);
