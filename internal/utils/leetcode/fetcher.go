package leetcode

import (
    "encoding/json"
    "io"
    "log"
    "net/http"
    "math"
    "time"
    "fmt"
    "LeetTracker/internal/utils/cache"
)

type LeetCodeResponse struct {
    UserName        string              `json:"user_name"`
    NumSolved       int                 `json:"num_solved"`
    NumTotal        int                 `json:"num_total"`
    AcEasy          int                 `json:"ac_easy"`
    AcMedium        int                 `json:"ac_medium"`
    AcHard          int                 `json:"ac_hard"`
    StatStatusPairs []StatStatusPair    `json:"stat_status_pairs"`
}


type StatStatusPair struct {
    Stat       ProblemStat `json:"stat"`
    Status     interface{} `json:"status"`
    Difficulty struct {
        Level int `json:"level"`
    } `json:"difficulty"`
    PaidOnly   bool `json:"paid_only"`
}

type ProblemStat struct {
    QuestionID               int     `json:"question_id"`
    QuestionTitle            string  `json:"question__title"`
    QuestionTitleSlug        string  `json:"question__title_slug"`
    QuestionHide             bool    `json:"question__hide"`
    TotalAccepted            int     `json:"total_acs"`
    TotalSubmitted           int     `json:"total_submitted"`
    FrontendQuestionID       int     `json:"frontend_question_id"`
    IsNewQuestion            bool    `json:"is_new_question"`
}

type Problem struct {
    Title          string  `json:"title"`
    TitleSlug      string  `json:"titleSlug"`
    Difficulty     string  `json:"difficulty"`
    AcceptanceRate float64 `json:"acRate"`
    FrontendID     int     `json:"frontendQuestionId"`
    IsPremium      bool    `json:"paidOnly"`
    URL            string  `json:"url"`
}

var cacheClient *cache.Cache

func init() {
    cacheClient = cache.NewCache("localhost:6379")
}

func FetchLeetCodeProblems() ([]Problem, error) {
    var problems []Problem

    //Hit the cache first
    err := cacheClient.Get("leetcode_problems", &problems)
    if err == nil {
        log.Println("Retrieved problems from cache")
        return problems, nil
    }

    // If not in cache, fetch from LeetCode API
    url := "https://leetcode.com/api/problems/all/"
    log.Printf("Fetching problems from URL: %s", url)
    
    resp, err := http.Get(url)
    if err != nil {
        log.Printf("Error making GET request: %v", err)
        return nil, err
    }
    defer resp.Body.Close()
    
    log.Printf("Response status: %s", resp.Status)
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        log.Printf("Error reading response body: %v", err)
        return nil, err
    }
    
    log.Printf("Response body length: %d bytes", len(body))

    var leetCodeResp LeetCodeResponse
    err = json.Unmarshal(body, &leetCodeResp)
    if err != nil {
        log.Printf("Error unmarshalling JSON into LeetCodeResponse: %v", err)
        return nil, err
    }

    for _, pair := range leetCodeResp.StatStatusPairs {
        acceptanceRate := math.Round((float64(pair.Stat.TotalAccepted)/float64(pair.Stat.TotalSubmitted)*100)*100) / 100
        
        difficulty := "Medium"
        switch pair.Difficulty.Level {
        case 1:
            difficulty = "Easy"
        case 3:
            difficulty = "Hard"
        }

        problem := Problem{
            Title:          pair.Stat.QuestionTitle,
            TitleSlug:      pair.Stat.QuestionTitleSlug,
            Difficulty:     difficulty,
            AcceptanceRate: acceptanceRate,
            FrontendID:     pair.Stat.FrontendQuestionID,
            IsPremium:      pair.PaidOnly,
            URL:            fmt.Sprintf("https://leetcode.com/problems/%s/", pair.Stat.QuestionTitleSlug),
        }
        problems = append(problems, problem)
    }

    log.Printf("Parsed %d problems from response", len(problems))

    // Store result in cache so we can hit it later
    err = cacheClient.Set("leetcode_problems", problems, 24*time.Hour)
    if err != nil {
        log.Printf("Error storing problems in cache: %v", err)
    }

    return problems, nil
}

func InvalidateCache() error {
    return cacheClient.Set("leetcode_problems", nil, 0)
}
