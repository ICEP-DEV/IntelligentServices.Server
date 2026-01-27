import redisClient, {BLOCK_DURATION,BASE_TTL,MAX_ATTEMPTS} from "../config/redis.js";

export const checkLoginBlock = async (req, res, next) => {
    const key = `login_attempts:${req.ip}`;

    try {
        const attempts = await redisClient.get(key);
        
        if(attempts && parseInt(attempts) >= MAX_ATTEMPTS){
            const ttl = await redisClient.ttl(key);
            return res.status(429).json({
                error: "Too many Request",
                message: `Account temporarily blocked try again in ${ttl} seconds`
            })
        }
        next();
    } catch (error) {
        console.error("Login Limiter error: ", error);
        next() //white-edging case.
    }
};

export const trackFailedLogin = async (ip) => {
    const key = `login_attempts:${ip}`;
    const newCount = await redisClient.incr(key);
    if(newCount === 1){
        await redisClient.expire(key, BASE_TTL);
    }

    if(newCount >= MAX_ATTEMPTS){
        await redisClient.expire(key, BLOCK_DURATION);
        return {blocked : true, remaining: 0};
    }
    return { blocked: false, remaining: MAX_ATTEMPTS - newCount };
};

// --- HELPER: Reset on Success ---
export const resetLoginAttempts = async (ip) => {
    const key = `login_attempts:${ip}`;
    await redisClient.del(key);
};