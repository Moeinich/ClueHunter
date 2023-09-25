const { GUESS, DISCORD} = require("../../Constants");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "Guess",
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                field: GUESS.COLUMNS.ID,
            },
            user: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false,
                field: DISCORD.USER,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false,
                field: GUESS.COLUMNS.PASSWORD,
            },
            success: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                field: GUESS.COLUMNS.SUCCESS,
            }
        },
        {
            timestamps: false,
        }
    );
};