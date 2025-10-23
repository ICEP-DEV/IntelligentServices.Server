import express from "express";
import {authenticateToken} from "../../middlewares/authenticateToken.js";
import { authorizeRole } from "../../middlewares/authorizeRole.js";
import { Query,QueryType } from "../../model/queries.js";

const router = express.Router();

router.get("/getqueries",
    authenticateToken,
    authorizeRole(["superadmin"]),
    async (req,res) => {

})