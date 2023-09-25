const { HUNT, DISCORD } = require("../../Constants");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "Hunt",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: HUNT.COLUMNS.ID,
      },
      guild: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
        field: DISCORD.GUILD,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
        field: HUNT.COLUMNS.TITLE,
      },
      description: {
        allowNull: true,
        type: DataTypes.TEXT,
        field: HUNT.COLUMNS.DESCRIPTION,
      },
      status: {
        type: DataTypes.ENUM(HUNT.STATUS.INACTIVE, HUNT.STATUS.ACTIVE),
        allowNull: false,
        field: HUNT.COLUMNS.STATUS,
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
        field: DISCORD.EMBED.THUMBNAIL,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
        field: DISCORD.EMBED.IMAGE,
      },
      embedMessageId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
        field: 'embed_message_id',
      },
    },
    {
      timestamps: false,
    }
  );
};
