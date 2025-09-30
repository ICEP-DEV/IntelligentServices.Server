import fs from 'fs';
import path from 'path';
import process from 'process';
import { Sequelize } from 'sequelize';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Read config.json safely without 'assert'
const configPath = path.join(__dirname, '../config/config.json');
const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const config = configFile[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Auto-import all models
fs.readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
  .forEach(async file => {
    const module = await import(path.join(__dirname, file));
    const model = module.default(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Run associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
export { sequelize };
