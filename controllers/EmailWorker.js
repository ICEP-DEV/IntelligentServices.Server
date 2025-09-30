import { Worker } from "bullmq";
import { sendEmail } from "../routes/reset.js";
import connection from "../config/redis.js";

const worker = new Worker('emailQueue', async job => {
    if(job.name === 'sendForgotPassword') {
        const {to, token, firstname} = job.data;
        await sendEmail(to,token,firstname);
        console.log(`Forgot-password email sent to ${to}`);
    }
}, { connection });