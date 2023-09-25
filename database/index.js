const { Sequelize } = require("sequelize");
const { setupModel } = require("./setupModel");

/*
 *  Stands up the database and then sets up the approriate
 *  tables and models.
 */

// In a real app, you should keep the database connection URL as an environment variable.
// But for this example, we will just use a local SQLite database.
// const sequelize = new Sequelize(process.env.DB_CONNECTION_URL);
const sequelize = new Sequelize({
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  // SQLite only
  storage: "database.sqlite",
});

setupModel(sequelize);

// Export connection instance for global use
module.exports = sequelize;
