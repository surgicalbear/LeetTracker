package server

import (
    "encoding/json"
    "net/http"
    "github.com/gorilla/mux"
    "LeetTracker/internal/database"
    "LeetTracker/internal/utils/leetcode"
    "LeetTracker/auth"
    "log"
    "strconv"
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

func (s *Server) GetListItemsHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.Context().Value(auth.UserIDKey).(string)
    listID, err := strconv.Atoi(mux.Vars(r)["id"])
    if err != nil {
        http.Error(w, "Invalid list ID", http.StatusBadRequest)
        return
    }

    list, err := s.db.GetListByID(listID, userID)
    if err != nil {
        http.Error(w, "Error retrieving list", http.StatusInternalServerError)
        return
    }
    if list == nil {
        http.Error(w, "List not found or access denied", http.StatusNotFound)
        return
    }

    items, err := s.db.GetListItems(listID)
    if err != nil {
        http.Error(w, "Failed to get list items", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(items)
}


func (s *Server) CreateListHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.Context().Value(auth.UserIDKey).(string)
    
    // Create user if non-existent
    err := s.db.EnsureUserExists(userID)
    if err != nil {
        log.Printf("Error ensuring user exists: %v", err)
        http.Error(w, "Failed to create list", http.StatusInternalServerError)
        return
    }

    var list database.List
    if err := json.NewDecoder(r.Body).Decode(&list); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // Set the UserID field
    list.UserID = userID

    listID, err := s.db.CreateList(userID, &list)
    if err != nil {
        log.Printf("Error creating list: %v", err)
        http.Error(w, "Failed to create list", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(map[string]int{"list_id": listID})
}

func (s *Server) GetUserListsHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.Context().Value(auth.UserIDKey).(string)

    lists, err := s.db.GetUserLists(userID)
    if err != nil {
        log.Printf("Error fetching user lists: %v", err)
        http.Error(w, "Failed to fetch lists", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(lists)
}

func (s *Server) GetLeetCodeProblemsHandler(w http.ResponseWriter, r *http.Request) {
    pageStr := r.URL.Query().Get("page")
    pageSizeStr := r.URL.Query().Get("pageSize")

    page, err := strconv.Atoi(pageStr)
    if err != nil || page < 1 {
        page = 1
    }

    pageSize, err := strconv.Atoi(pageSizeStr)
    if err != nil || pageSize < 1 || pageSize > 100 {
        pageSize = 20 
    }

    problems, totalCount, err := s.db.GetLeetCodeProblems(page, pageSize)
    if err != nil {
        log.Printf("Error fetching LeetCode problems: %v", err)
        http.Error(w, "Failed to fetch LeetCode problems", http.StatusInternalServerError)
        return
    }

    //total pages
    totalPages := (totalCount + pageSize - 1) / pageSize

    response := struct {
        Problems   []leetcode.Problem `json:"problems"`
        TotalCount int                `json:"totalCount"`
        Page       int                `json:"page"`
        PageSize   int                `json:"pageSize"`
        TotalPages int                `json:"totalPages"`
    }{
        Problems:   problems,
        TotalCount: totalCount,
        Page:       page,
        PageSize:   pageSize,
        TotalPages: totalPages,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

func (s *Server) SearchProblemsHandler(w http.ResponseWriter, r *http.Request) {
    query := r.URL.Query().Get("q")
    if query == "" {
        http.Error(w, "Search query is required", http.StatusBadRequest)
        return
    }

    problems, err := s.db.SearchProblems(query)
    if err != nil {
        log.Printf("Error searching problems: %v", err)
        http.Error(w, "Failed to search problems", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(problems)
}

func (s *Server) AddProblemToListHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.Context().Value(auth.UserIDKey).(string)

    var req struct {
        ListID    int `json:"list_id"`
        ProblemID int `json:"problem_id"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    //Check if the list belongs to the user
    list, err := s.db.GetListByID(req.ListID, userID)
    if err != nil {
        log.Printf("Error checking list ownership: %v", err)
        http.Error(w, "Failed to add problem to list", http.StatusInternalServerError)
        return
    }
    if list == nil {
        http.Error(w, "List not found or access denied", http.StatusNotFound)
        return
    }

    err = s.db.AddProblemToList(req.ListID, req.ProblemID)
    if err != nil {
        log.Printf("Error adding problem to list: %v", err)
        http.Error(w, "Failed to add problem to list", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
}

func (s *Server) DeleteListHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.Context().Value(auth.UserIDKey).(string)
    
    vars := mux.Vars(r)
    listID, err := strconv.Atoi(vars["id"])
    if err != nil {
        http.Error(w, "Invalid list ID", http.StatusBadRequest)
        return
    }

    err = s.db.DeleteList(listID, userID)
    if err != nil {
        log.Printf("Error deleting list: %v", err)
        http.Error(w, "Failed to delete list", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
}

func (s *Server) RemoveProblemFromListHandler(w http.ResponseWriter, r *http.Request) {
    
    userID := r.Context().Value(auth.UserIDKey).(string)

    var req struct {
        ListID    int `json:"list_id"`
        ProblemID int `json:"problem_id"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        log.Printf("Error decoding JSON: %v", err)
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    //Check if the list belongs to the user
    list, err := s.db.GetListByID(req.ListID, userID)
    if err != nil {
        log.Printf("Error checking list ownership: %v", err)
        http.Error(w, "Failed to remove problem from list", http.StatusInternalServerError)
        return
    }
    if list == nil {
        http.Error(w, "List not found or access denied", http.StatusNotFound)
        return
    }
    
    err = s.db.RemoveProblemFromList(req.ListID, req.ProblemID)
    if err != nil {
        log.Printf("Error removing problem from list: %v", err)
        http.Error(w, "Failed to remove problem from list", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
}

func (s *Server) UpdateProblemCompletionStatusHandler(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    listItemID, err := strconv.Atoi(vars["id"])
    if err != nil {
        http.Error(w, "Invalid list item ID", http.StatusBadRequest)
        return
    }

    var requestBody struct {
        Completed bool `json:"completed"`
    }
    if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    err = s.db.UpdateProblemCompletionStatus(listItemID, requestBody.Completed)
    if err != nil {
        http.Error(w, "Failed to update completion status", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
}
