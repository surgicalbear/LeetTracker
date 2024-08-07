package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"
    "strings"
    "sync"
    "LeetTracker/internal/utils/leetcode"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "github.com/joho/godotenv/autoload"
)

// Service represents a service that interacts with a database.
type Service interface {
	Health() map[string]string
	Close() error

    //Insert problems into DB
    InsertLeetCodeProblems(problems []leetcode.Problem) error
    //List
    GetListByID(listID int, userID string) (*List, error)
    GetListItems(listID int) ([]ListItem, error)
    CreateList(userID, name string) (int, error)

    EnsureUserExists(userID string) error
    UserExists(userID string) (bool, error)
    GetLeetCodeProblems(page, pageSize int) ([]leetcode.Problem, int, error)
}

type service struct {
	db *sql.DB
}

type List struct {
    ID        int       `json:"id"`
    UserID    string    `json:"user_id"`
    Name      string    `json:"name"`
    CreatedAt time.Time `json:"created_at"`
}

type ListItem struct {
    ID                int       `json:"id"`
    ListID            int       `json:"list_id"`
    ProblemID         int       `json:"problem_id"`
    ProblemTitle      string    `json:"problem_title"`
    ProblemDifficulty string    `json:"problem_difficulty"`
    AddedAt           time.Time `json:"added_at"`
}

var (
	database   = os.Getenv("DB_DATABASE")
	password   = os.Getenv("DB_PASSWORD")
	username   = os.Getenv("DB_USERNAME")
	port       = os.Getenv("DB_PORT")
	host       = os.Getenv("DB_HOST")
	schema     = os.Getenv("DB_SCHEMA")
	dbInstance *service
)

func New() Service {
	// Reuse Connection
	if dbInstance != nil {
		return dbInstance
	}
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable&search_path=%s", username, password, host, port, database, schema)
	db, err := sql.Open("pgx", connStr)
	if err != nil {
		log.Fatal(err)
	}
	dbInstance = &service{
		db: db,
	}
	return dbInstance
}

// Health checks the health of the database connection by pinging the database.
// It returns a map with keys indicating various health statistics.
func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := make(map[string]string)

	// Ping the database
	err := s.db.PingContext(ctx)
	if err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		log.Fatalf(fmt.Sprintf("db down: %v", err)) // Log the error and terminate the program
		return stats
	}

	// Database is up, add more statistics
	stats["status"] = "up"
	stats["message"] = "It's healthy"

	// Get database stats (like open connections, in use, idle, etc.)
	dbStats := s.db.Stats()
	stats["open_connections"] = strconv.Itoa(dbStats.OpenConnections)
	stats["in_use"] = strconv.Itoa(dbStats.InUse)
	stats["idle"] = strconv.Itoa(dbStats.Idle)
	stats["wait_count"] = strconv.FormatInt(dbStats.WaitCount, 10)
	stats["wait_duration"] = dbStats.WaitDuration.String()
	stats["max_idle_closed"] = strconv.FormatInt(dbStats.MaxIdleClosed, 10)
	stats["max_lifetime_closed"] = strconv.FormatInt(dbStats.MaxLifetimeClosed, 10)

	// Evaluate stats to provide a health message
	if dbStats.OpenConnections > 40 { // Assuming 50 is the max for this example
		stats["message"] = "The database is experiencing heavy load."
	}

	if dbStats.WaitCount > 1000 {
		stats["message"] = "The database has a high number of wait events, indicating potential bottlenecks."
	}

	if dbStats.MaxIdleClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many idle connections are being closed, consider revising the connection pool settings."
	}

	if dbStats.MaxLifetimeClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many connections are being closed due to max lifetime, consider increasing max lifetime or revising the connection usage pattern."
	}

	return stats
}

// Close closes the database connection.
// It logs a message indicating the disconnection from the specific database.
// If the connection is successfully closed, it returns nil.
// If an error occurs while closing the connection, it returns the error.
func (s *service) Close() error {
	log.Printf("Disconnected from database: %s", database)
	return s.db.Close()
}

func (s *service) InsertLeetCodeProblems(problems []leetcode.Problem) error {
    start := time.Now()
    defer func() {
        elapsed := time.Since(start)
        log.Printf("InsertLeetCodeProblems took %s", elapsed)
    }()
    const batchSize = 100
    numWorkers := 4 

    var wg sync.WaitGroup
    errCh := make(chan error, numWorkers)

    //create batches
    batches := make([][]leetcode.Problem, 0, len(problems)/batchSize+1)
    for i := 0; i < len(problems); i += batchSize {
        end := i + batchSize
        if end > len(problems) {
            end = len(problems)
        }
        batches = append(batches, problems[i:end])
    }

    //process batches concurrently
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func(workerBatches [][]leetcode.Problem) {
            defer wg.Done()
            for _, batch := range workerBatches {
                if err := s.insertBatch(batch); err != nil {
                    errCh <- err
                    return
                }
            }
        }(batches[i*len(batches)/numWorkers : (i+1)*len(batches)/numWorkers])
    }

    //wait for all goroutines to finish
    wg.Wait()
    close(errCh)
    for err := range errCh {
        if err != nil {
            return err
        }
    }
    return nil
}

func (s *service) insertBatch(problems []leetcode.Problem) error {
    if len(problems) == 0 {
        return nil
    }

    valueStrings := make([]string, len(problems))
    valueArgs := make([]interface{}, 0, len(problems)*6)

    for i, problem := range problems {
        valueStrings[i] = fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d)", i*6+1, i*6+2, i*6+3, i*6+4, i*6+5, i*6+6)
        valueArgs = append(valueArgs, problem.Title, problem.Difficulty, problem.AcceptanceRate, problem.FrontendID, problem.IsPremium, problem.URL)
    }

    stmt := fmt.Sprintf(`
        INSERT INTO leetcode_problems (title, difficulty, acceptance_rate, frontend_id, is_premium, url)
        VALUES %s
        ON CONFLICT (frontend_id) DO UPDATE SET
            title = EXCLUDED.title,
            difficulty = EXCLUDED.difficulty,
            acceptance_rate = EXCLUDED.acceptance_rate,
            is_premium = EXCLUDED.is_premium,
            url = EXCLUDED.url
    `, strings.Join(valueStrings, ","))

    _, err := s.db.Exec(stmt, valueArgs...)
    if err != nil {
        return fmt.Errorf("error inserting batch: %v", err)
    }

    return nil
}

func (s *service) GetListByID(listID int, userID string) (*List, error) {
    var list List
    err := s.db.QueryRow(`
        SELECT id, name, created_at
        FROM lists
        WHERE id = $1 AND user_id = $2
    `, listID, userID).Scan(&list.ID, &list.Name, &list.CreatedAt)
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, nil
        }
        return nil, err
    }
    return &list, nil
}

func (s *service) GetListItems(listID int) ([]ListItem, error) {
    rows, err := s.db.Query(`
        SELECT li.id, li.problem_id, lp.title, lp.difficulty, li.added_at
        FROM list_items li
        JOIN leetcode_problems lp ON li.problem_id = lp.frontend_id
        WHERE li.list_id = $1
        ORDER BY li.added_at DESC
    `, listID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var items []ListItem
    for rows.Next() {
        var li ListItem
        err := rows.Scan(&li.ID, &li.ProblemID, &li.ProblemTitle, &li.ProblemDifficulty, &li.AddedAt)
        if err != nil {
            return nil, err
        }
        li.ListID = listID
        items = append(items, li)
    }
    return items, nil
}

func (s *service) CreateList(userID, name string) (int, error) {
    var listID int
    err := s.db.QueryRow(`
        INSERT INTO lists (user_id, name)
        VALUES ($1, $2)
        RETURNING id
    `, userID, name).Scan(&listID)
    if err != nil {
        return 0, fmt.Errorf("failed to create list: %v", err)
    }
    return listID, nil
}

func (s *service) UserExists(userID string) (bool, error) {
    var exists bool
    err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)", userID).Scan(&exists)
    if err != nil {
        return false, fmt.Errorf("failed to check if user exists: %v", err)
    }
    return exists, nil
}

func (s *service) EnsureUserExists(userID string) error {
    exists, err := s.UserExists(userID)
    if err != nil {
        return err
    }
    if !exists {
        _, err := s.db.Exec("INSERT INTO users (id) VALUES ($1)", userID)
        if err != nil {
            return fmt.Errorf("failed to create user: %v", err)
        }
    }
    return nil
}


//for pagination
func (s *service) GetLeetCodeProblems(page, pageSize int) ([]leetcode.Problem, int, error) {
    var totalCount int
    err := s.db.QueryRow("SELECT COUNT(*) FROM leetcode_problems").Scan(&totalCount)
    if err != nil {
        return nil, 0, fmt.Errorf("failed to get total count of problems: %v", err)
    }

    //offset
    offset := (page - 1) * pageSize

    //get results
    rows, err := s.db.Query(`
        SELECT frontend_id, title, difficulty, acceptance_rate, is_premium, url
        FROM leetcode_problems
        ORDER BY frontend_id
        LIMIT $1 OFFSET $2
    `, pageSize, offset)
    if err != nil {
        return nil, 0, fmt.Errorf("failed to fetch LeetCode problems: %v", err)
    }
    defer rows.Close()

    var problems []leetcode.Problem
    for rows.Next() {
        var p leetcode.Problem
        err := rows.Scan(&p.FrontendID, &p.Title, &p.Difficulty, &p.AcceptanceRate, &p.IsPremium, &p.URL)
        if err != nil {
            return nil, 0, fmt.Errorf("failed to scan LeetCode problem: %v", err)
        }
        problems = append(problems, p)
    }

    if err = rows.Err(); err != nil {
        return nil, 0, fmt.Errorf("error iterating over LeetCode problems: %v", err)
    }

    return problems, totalCount, nil
}


