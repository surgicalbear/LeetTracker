package cache

import (
    "context"
    "encoding/json"
    "time"

    "github.com/go-redis/redis/v8"
)

type Cache struct {
    client *redis.Client
}

func NewCache(addr string) *Cache {
    return &Cache{
        client: redis.NewClient(&redis.Options{
            Addr: addr,
        }),
    }
}

func (c *Cache) Set(key string, value interface{}, expiration time.Duration) error {
    json, err := json.Marshal(value)
    if err != nil {
        return err
    }

    return c.client.Set(context.Background(), key, json, expiration).Err()
}

func (c *Cache) Get(key string, dest interface{}) error {
    val, err := c.client.Get(context.Background(), key).Result()
    if err != nil {
        return err
    }

    return json.Unmarshal([]byte(val), dest)
}
