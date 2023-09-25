const { ICONS, CLUE, COLORS } = require("../Constants");
const { models } = require("../database");
const ClueEmbed = async function (clue) {
  const color =
    clue.status === CLUE.STATUS.LOCKED
      ? COLORS.CLUE_STATUS.LOCKED
      : clue.status === CLUE.STATUS.UNLOCKED
      ? COLORS.CLUE_STATUS.UNLOCKED
      : COLORS.CLUE_STATUS.SOLVED;
  const passGuesses = await models.Guess.findAll({
    where: { clue_id: clue.id, success: true },
  });
  const failGuesses = await models.Guess.findAll({
    where: { clue_id: clue.id, success: false },
  });
  return {
    author: {
      name: "Clue",
      icon_url: ICONS.CLUE,
    },
    color: color,
    title: clue.title,
    description: clue.text,
    thumbnail: {
      url: clue.thumbnail,
    },
    image: {
      url: clue.image,
    },
    fields: [
      {
        name: "Status",
        value: clue.status,
        inline: true,
      },
      {
        name: "ID",
        value: clue.id,
        inline: true,
      },
      {
        name: "\u200b",
        value: `Total Guesses: ${passGuesses.length + failGuesses.length}`,
        inline: false,
      },
      {
        name: "Successes",
        value: passGuesses.length,
        inline: true,
      },
      {
        name: "Failures",
        value: failGuesses.length,
        inline: true,
      },
    ],
  };
};

module.exports = { ClueEmbed };
