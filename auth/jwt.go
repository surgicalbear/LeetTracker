package auth

import (
    "encoding/json"
    "errors"
    "net/http"
    "github.com/dgrijalva/jwt-go"
    "github.com/auth0/go-jwt-middleware"
    "context"
    "log"
)

type Jwks struct {
    Keys []JSONWebKeys `json:"keys"`
}

type JSONWebKeys struct {
    Kty string   `json:"kty"`
    Kid string   `json:"kid"`
    Use string   `json:"use"`
    N   string   `json:"n"`
    E   string   `json:"e"`
    X5c []string `json:"x5c"`
}

type contextKey string
const UserIDKey contextKey = "userID"

func NewJWTMiddleware() func(http.Handler) http.Handler {
    return jwtmiddleware.New(jwtmiddleware.Options{
        ValidationKeyGetter: func(token *jwt.Token) (interface{}, error) {
            return GetPemCert(token)
        },
        SigningMethod: jwt.SigningMethodRS256,
        UserProperty: "user",
        ErrorHandler: func(w http.ResponseWriter, r *http.Request, err string) {
            log.Printf("JWT Error: %s", err)
            http.Error(w, err, http.StatusUnauthorized)
        },
    }).Handler
}

func UserIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        user := r.Context().Value("user")
        if user == nil {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }

        token := user.(*jwt.Token)
        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            http.Error(w, "Invalid token claims", http.StatusUnauthorized)
            return
        }

        sub, ok := claims["sub"].(string)
        if !ok {
            http.Error(w, "User ID not found in token", http.StatusUnauthorized)
            return
        }

        ctx := context.WithValue(r.Context(), UserIDKey, sub)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func GetPemCert(token *jwt.Token) (interface{}, error) {
    cert := ""
    resp, err := http.Get("https://dev-k44w50mxzfvvi0x3.us.auth0.com/.well-known/jwks.json")

    if err != nil {
        return cert, err
    }
    defer resp.Body.Close()

    var jwks = Jwks{}
    err = json.NewDecoder(resp.Body).Decode(&jwks)

    if err != nil {
        return cert, err
    }

    for k := range jwks.Keys {
        if token.Header["kid"] == jwks.Keys[k].Kid {
            cert = "-----BEGIN CERTIFICATE-----\n" + jwks.Keys[k].X5c[0] + "\n-----END CERTIFICATE-----"
        }
    }

    if cert == "" {
        err := errors.New("Unable to find appropriate key.")
        return cert, err
    }

    result, _ := jwt.ParseRSAPublicKeyFromPEM([]byte(cert))
    return result, nil
}
