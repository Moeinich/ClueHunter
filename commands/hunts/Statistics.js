const { SlashCommandBuilder } = require("discord.js");
const { models } = require("../../database");
const {
  COMMANDS,
  SUBCOMMANDS,
  DISCORD,
  CLUE,
  HUNT,
  MESSAGING,
} = require("../../Constants");

module.exports = {
  data: new SlashCommandBuilder()
    /*---------------------------------------------------------------------------------
     *  COMMANDS
     *--------------------------------------------------------------------------------*/
    .setName(COMMANDS.STATS)
    .setDescription("View hunt statistics.")
    /*-----------------------------------------------------
     *  COMMAND: server
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.STATS.SERVER)
        .setDescription("View hunt statistics for the server.")
        .addStringOption((option) =>
          option
            .setName(DISCORD.USER)
            .setDescription(
              "See statistics for a specific user on this server."
            )
            .setRequired(false)
        )
    ),
  /*---------------------------------------------------------------------------------
   *  RESPONSES
   *--------------------------------------------------------------------------------*/
  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const guild = interaction.guild.id;
      /*-----------------------------------------------------
       *  RESPONSE: server
       *-----------------------------------------------------*/
      if (subcommand === SUBCOMMANDS.STATS.SERVER) {
        // Retrieve all hunts for this server.
        const hunts = await models.Hunt.findAll({
          where: {
            guild: guild,
          },
        });
        await interaction.reply(
          `This server has created a total of ${hunts.length} hunts.`
        );
        const user = interaction.options.getString(DISCORD.USER, false);
        if (user) {
          // TODO
          await interaction.followUp(
            `Sorry! User-specific statistics haven't been implemented yet.`
          );
        } else {
          await interaction.followUp(
            `.\n
                    Active Hunts: ${
                      hunts.filter((hunt) => hunt.status === HUNT.STATUS.ACTIVE)
                        .length
                    }\n
                    Inactive Hunts: ${
                      hunts.filter(
                        (hunt) => hunt.status === HUNT.STATUS.INACTIVE
                      ).length
                    }\n
                    `
          );
        }
      }
    } catch (error) {
      console.error(error);
      interaction.reply(MESSAGING.UNKNOWN_ERROR);
    }
  },
};

/*---------------------------------------------------------------------------------
 *  HELPER FUNCTIONS
 *--------------------------------------------------------------------------------*/
