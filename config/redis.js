import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// === Constants ==
export const MAX_ATTEMPTS = 3;
export const BLOCK_DURATION = 300; // 5 minutes
export const BASE_TTL = 3600; // 1 hour

const redisClient = createClient({
    url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Connect immediately
(async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log("Redis connected successfully");
    }
})();

export default redisClient;