package server

import (
    "fmt"
    "net/http"
    "os"
    "strconv"
    "time"

    "github.com/gorilla/mux"
    "github.com/rs/cors"
    "LeetTracker/auth"
    "LeetTracker/internal/database"
)

type Server struct {
    port int
    db   database.Service
}

func NewServer() *http.Server {
    port, _ := strconv.Atoi(os.Getenv("PORT"))
    if port == 0 {
        port = 8080
    }
    s := &Server{
        port: port,
        db:   database.New(),
    }

    jwtMiddleware := auth.NewJWTMiddleware()

    r := mux.NewRouter()
    RegisterRoutes(r, s, jwtMiddleware)

    // remove -- only in dev
    corsWrapper := cors.New(cors.Options{
        AllowedMethods: []string{"GET", "POST", "DELETE", "PUT"},
        AllowedHeaders: []string{"Content-Type", "Origin", "Accept", "*"},
    })

    srv := &http.Server{
        Addr:         fmt.Sprintf(":%d", port),
        Handler:      corsWrapper.Handler(r),
        IdleTimeout:  time.Minute,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 30 * time.Second,
    }

    return srv
}
