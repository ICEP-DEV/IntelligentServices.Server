import { Query} from "../../model/queries.js";
import { geocodeAddress } from "../../config/nomanatim.js";
import express from "express";

const router = express.Router();

// Geocode an address
router.get("/geocode", async (req, res) => {

    const queries = await Query.findAll({
        attributes: [
        'query_id', 
        'query_address',
        'query_description',
        "region",
        "query_status",
        "priority_status"]
    });

    const results = [];

    for (const query of queries) {
        const geocodeResult = await geocodeAddress(query.query_address);
        results.push({
            query_id: query.query_id,
            query_address: query.query_address,
            query_description: query.query_description,
            region: query.region,
            query_status: query.query_status,
            priority_status: query.priority_status,
            geocode: geocodeResult
        });
    }

    res.json(results);
});

export default router;
