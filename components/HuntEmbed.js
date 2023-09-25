const { models } = require("../database");
const { CLUE, HUNT, COLORS, ICONS } = require("../Constants");
const HuntEmbed = async function (hunt) {
  const lockedClues = await models.Clue.findAll({
    where: { status: CLUE.STATUS.LOCKED, hunt_id: hunt.id },
  });
  const unlockedClues = await models.Clue.findAll({
    where: { status: CLUE.STATUS.UNLOCKED, hunt_id: hunt.id },
  });
  const solvedClues = await models.Clue.findAll({
    where: { status: CLUE.STATUS.SOLVED, hunt_id: hunt.id },
  });
  const color =
    hunt.status === HUNT.STATUS.ACTIVE
      ? COLORS.HUNT_STATUS.ACTIVE
      : COLORS.HUNT_STATUS.INACTIVE;

  return {
    author: {
      name: "Hunt",
      icon_url: ICONS.HUNT,
    },
    color: color,
    title: hunt.title,
    description: hunt.description,
    thumbnail: {
      url: hunt.thumbnail,
    },
    image: {
      url: hunt.image,
    },
    fields: [
      {
        name: "Status",
        value: hunt.status,
        inline: true,
      },
      {
        name: "ID",
        value: hunt.id,
        inline: true,
      },
      {
        name: "\u200b",
        value: `Total Clues: ${
          lockedClues.length + unlockedClues.length + solvedClues.length
        }`,
        inline: false,
      },
      {
        name: "Locked",
        value: lockedClues.length,
        inline: true,
      },
      {
        name: "Unlocked",
        value: unlockedClues.length,
        inline: true,
      },
      {
        name: "Solved",
        value: solvedClues.length,
        inline: true,
      },
    ],
  };
};

module.exports = { HuntEmbed };
