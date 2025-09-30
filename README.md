# IntelligentServices.Server - MunicipalHub


## Installation

1. Clone the repository:
```bash
git clone https://github.com/ICEP-DEV/IntelligentServices.Server
cd IntelligentServices.Server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=student_management
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGIN=http://localhost:3000
```


## Project Structure

```
student-management-backend/
├── config/             # Database connection setup
├── controllers/        # Business logic and Database Queries
├── database/          # SQL backup files
├── middleware/        # Authentication & error handling
├── routes/           # API endpoints
├── .env              # Environment variables
└── app.js            # Express app configuration
```


## Available Scripts

- `npm start` - Start server in production mode
- `npm run dev` - Start server in development mode with hot reload
- `npm test` - Run test suite

## Technologies Used

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Database
- **mysql2** - MySQL client with Promise support
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### RUN MIGRATION SCRIPT #########

npm install           # install deps #

node exportSeedData.js # create seeds #

###### USER SCRIPT SEED:MIGRATE ###########

npx sequelize-cli db:migrate # migrate #

npx sequelize-cli db:seed:all # run the seeders # # populate the database #

