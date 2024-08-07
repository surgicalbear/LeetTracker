package server

import (
    "github.com/gorilla/mux"
    "net/http"
    "LeetTracker/auth"
)

func RegisterRoutes(r *mux.Router, s *Server, jwtMiddleware func(http.Handler) http.Handler) {
    r.Handle("/", http.FileServer(http.Dir("./views/")))
    r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./static/"))))
    //testers
    r.HandleFunc("/hello", HelloWorldHandler).Methods("GET")
    r.HandleFunc("/health", HealthHandler(s.db)).Methods("GET")
    //actual routes
    //r.Handle("/products", jwtMiddleware(http.HandlerFunc(ProductsHandler))).Methods("GET")
    r.Handle("/products", jwtMiddleware(auth.UserIDMiddleware(http.HandlerFunc(ProductsHandler)))).Methods("GET")
    r.Handle("/products/{slug}/feedback", jwtMiddleware(http.HandlerFunc(AddFeedbackHandler))).Methods("POST")
    r.HandleFunc("/fetch-leetcode-problems", s.FetchLeetCodeProblemsHandler).Methods("GET")
    //redis
    r.HandleFunc("/invalidate-leetcode-cache", s.InvalidateLeetCodeCacheHandler).Methods("POST")
    //Lists
    r.Handle("/lists", jwtMiddleware(auth.UserIDMiddleware(http.HandlerFunc(s.CreateListHandler)))).Methods("POST")
    r.Handle("/lists/{id}/items", jwtMiddleware(auth.UserIDMiddleware(http.HandlerFunc(s.GetListItemsHandler)))).Methods("GET")
    r.HandleFunc("/leetcode-problems", s.GetLeetCodeProblemsHandler).Methods("GET")
}
