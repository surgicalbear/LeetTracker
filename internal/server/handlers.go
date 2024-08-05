package server

import (
    "encoding/json"
    "net/http"
    "github.com/gorilla/mux"
    "LeetTracker/internal/database"
    "LeetTracker/internal/utils/leetcode"
    "LeetTracker/auth"
    "log"
)

type Product struct {
    Id          int
    Name        string
    Slug        string
    Description string
}

var products = []Product{
    {Id: 1, Name: "World of Authcraft", Slug: "world-of-authcraft", Description: "Battle bugs and protect yourself from invaders while you explore a scary world with no security"},
    {Id: 2, Name: "Ocean Explorer", Slug: "ocean-explorer", Description: "Explore the depths of the sea in this one of a kind underwater experience"},
    {Id: 3, Name: "Dinosaur Park", Slug: "dinosaur-park", Description: "Go back 65 million years in the past and ride a T-Rex"},
    {Id: 4, Name: "Cars VR", Slug: "cars-vr", Description: "Get behind the wheel of the fastest cars in the world."},
    {Id: 5, Name: "Robin Hood", Slug: "robin-hood", Description: "Pick up the bow and arrow and master the art of archery"},
    {Id: 6, Name: "Real World VR", Slug: "real-world-vr", Description: "Explore the seven wonders of the world in VR"},
}

func HelloWorldHandler(w http.ResponseWriter, r *http.Request) {
    resp := make(map[string]string)
    resp["message"] = "Hello World"
    jsonResp, err := json.Marshal(resp)
    if err != nil {
        log.Printf("error handling JSON marshal. Err: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    _, _ = w.Write(jsonResp)
}

func HealthHandler(db database.Service) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        healthStatus := db.Health()
        jsonResp, err := json.Marshal(healthStatus)
        if err != nil {
            log.Printf("error handling JSON marshal. Err: %v", err)
            http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        _, _ = w.Write(jsonResp)
    }
}


func ProductsHandler(w http.ResponseWriter, r *http.Request) {
    userID, ok := r.Context().Value(auth.UserIDKey).(string)
    if !ok {
        log.Printf("User ID not found in context")
        http.Error(w, "User ID not found", http.StatusInternalServerError)
        return
    }
    log.Printf("Request from user: %s", userID)

    payload, err := json.Marshal(products)
    if err != nil {
        log.Printf("Error marshalling products: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    _, err = w.Write(payload)
    if err != nil {
        log.Printf("Error writing response: %v", err)
    }
}

func AddFeedbackHandler(w http.ResponseWriter, r *http.Request) {
    var product Product
    vars := mux.Vars(r)
    slug := vars["slug"]

    for _, p := range products {
        if p.Slug == slug {
            product = p
        }
    }

    w.Header().Set("Content-Type", "application/json")
    if product.Slug != "" {
        payload, _ := json.Marshal(product)
        w.Write(payload)
    } else {
        http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
    }
}

func (s *Server) FetchLeetCodeProblemsHandler(w http.ResponseWriter, r *http.Request) {
    problems, err := leetcode.FetchLeetCodeProblems()
    if err != nil {
        http.Error(w, "Error fetching LeetCode problems", http.StatusInternalServerError)
        return
    }
    log.Printf("Fetched %d problems", len(problems))

    err = s.db.InsertLeetCodeProblems(problems)
    if err != nil {
        http.Error(w, "Error inserting LeetCode problems into database", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"message": "LeetCode problems fetched and stored successfully"})
}

func (s *Server) InvalidateLeetCodeCacheHandler(w http.ResponseWriter, r *http.Request) {
    err := leetcode.InvalidateCache()
    if err != nil {
        http.Error(w, "Failed to invalidate cache: "+err.Error(), http.StatusInternalServerError)
        return
    }
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("LeetCode problems cache successfully invalidated"))
}
