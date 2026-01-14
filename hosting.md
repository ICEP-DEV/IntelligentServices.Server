<!-- trunk-ignore-all(markdownlint/MD041) -->
## TODO

## 🚀 DevOps & Hosting

### Step 1: Data Hosting (Aiven.io)

1. **Database Provisioning** Create the Aiven DB instance and update your `.env` file with the new connection string to point to the cloud.
2. **Schema Initialization** Sequelize doesn't have a built-in initial migration to build all entities. To speed up the process, temporarily modify `server.js` (Line 124):

- **Change:** `sequelize.authenticate()`
- **To:** `sequelize.sync({ alter: true })`

3. **Initial Build** Run `npm start` to trigger the initial schema build. This will automatically create all tables in the Aiven cloud.
4. **Enforce Migrations** Switch back to `sequelize.authenticate()` in `server.js`. This ensures all future database changes are enforced via formal migrations.
5. **Final Verification** Re-run `npm start` to start the local server. A clean console with no errors indicates the process ran perfectly.

### Step 2: Server Hosting —
