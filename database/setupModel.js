const { DataTypes } = require("sequelize");
const { CLUE, GUESS } = require("../Constants");

/*
 * Runs when the app first starts.
 * Sets up the objects models and defines their relationships.
 */
function setupModel(sequelize) {
  /*------------------------------------
   * Declare Models
   *-----------------------------------*/
  const Hunt = require("./models/hunt.model.js")(sequelize, DataTypes);
  const Clue = require("./models/clue.model.js")(sequelize, DataTypes);
  const Guess = require("./models/guess.model.js")(sequelize, DataTypes);

  /*------------------------------------
   * Declare Models
   *-----------------------------------*/
  // A hunt has many clues
  Hunt.hasMany(Clue, { foreignKey: CLUE.COLUMNS.HUNT });
  Clue.belongsTo(Hunt, { foreignKey: CLUE.COLUMNS.HUNT });

  // A clue can unlock many other clues
  Clue.hasMany(Clue, { as: "Unlocks", foreignKey: CLUE.COLUMNS.UNLOCKED_BY });

  // There can be many guesses per clue
  Clue.hasMany(Guess, { foreignKey: GUESS.COLUMNS.CLUE });
  Guess.belongsTo(Clue, { foreignKey: GUESS.COLUMNS.CLUE });
}

module.exports = { setupModel };
