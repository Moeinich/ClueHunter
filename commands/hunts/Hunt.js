const { SlashCommandBuilder } = require("discord.js");
const { models } = require("../../database");
const {
  COMMANDS,
  SUBCOMMANDS,
  HUNT,
  CLUE,
  DISCORD,
  COLORS,
  MESSAGING,
  ICONS,
} = require("../../Constants");
const { HuntEmbed } = require("../../components/HuntEmbed");
const { NotificationEmbed } = require("../../components/NotificationEmbed");

/*---------------------------------------------------------------------------------
 *  TODO:
 *   - Once a hunt is ended, you cannot begin it unless it is reset.
 *   - Reset (new subcommand) - Resetting a hunt resets in place - stats are not preserved
 *   - id (option for create command) - Copies over clues from the specified hunt,
 *      as well as other fields if not overwritten.
 *--------------------------------------------------------------------------------*/

module.exports = {
  data: new SlashCommandBuilder()
    /*---------------------------------------------------------------------------------
     *  COMMANDS
     *--------------------------------------------------------------------------------*/
    .setName(COMMANDS.HUNT)
    .setDescription("Manage your server's hunts.")
    /*-----------------------------------------------------
     *  COMMAND: create
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.HUNT.CREATE)
        .setDescription("Create a new hunt.")
        .addStringOption((option) =>
          option
            .setName(HUNT.COLUMNS.TITLE)
            .setDescription("Name your hunt.")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName(HUNT.COLUMNS.DESCRIPTION)
            .setDescription("A brief description of your hunt.")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName(DISCORD.EMBED.THUMBNAIL)
            .setDescription(
              "A thumbnail image url to display when the hunt details are viewed."
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName(DISCORD.EMBED.IMAGE)
            .setDescription(
              "A featured image url to display when the hunt details are viewed."
            )
            .setRequired(false)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: begin
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.HUNT.BEGIN)
        .setDescription("Begin a hunt.")
        .addIntegerOption((option) =>
          option
            .setName(HUNT.COLUMNS.ID)
            .setDescription("The ID of the hunt to begin.")
            .setRequired(true)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: end
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.HUNT.END)
        .setDescription("End a hunt.")
        .addIntegerOption((option) =>
          option
            .setName(HUNT.COLUMNS.ID)
            .setDescription("The ID of the hunt to end.")
            .setRequired(true)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: delete
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.HUNT.DELETE)
        .setDescription("Delete a hunt.")
        .addBooleanOption((option) =>
          option
            .setName("purge")
            .setDescription(
              "Delete all hunts on this server. (DESTRUCTIVE! YOU CANNOT GET THESE BACK!)"
            )
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName(HUNT.COLUMNS.ID)
            .setDescription(
              "The ID of the hunt to delete. If used alongside purge, this hunt alone will instead be saved."
            )
            .setRequired(false)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: list
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.HUNT.LIST)
        .setDescription("List all hunts.")
        .addIntegerOption((option) =>
          option
            .setName(HUNT.COLUMNS.ID)
            .setDescription(
              "Display details of a specific hunt by specifying the ID."
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
      /*-----------------------------------------------------
       *  RESPONSE: create
       *-----------------------------------------------------*/
      if (subcommand === SUBCOMMANDS.HUNT.CREATE) {
        const title = interaction.options.getString(HUNT.COLUMNS.TITLE);

        // Create a hunt
        const hunt = await models.Hunt.create({
          title: title,
          description: interaction.options.getString(HUNT.COLUMNS.DESCRIPTION),
          status: HUNT.STATUS.INACTIVE,
          guild: interaction.guild.id,
          thumbnail: interaction.options.getString(DISCORD.EMBED.THUMBNAIL),
          image: interaction.options.getString(DISCORD.EMBED.IMAGE),
        });
        // Generate an automatic name for the hunt if one was not provided.
        if (!hunt.title) {
          hunt.title = `Hunt ${hunt.id}`;
        }

        await hunt.save();

        // Reply
        const announcementEmbed = NotificationEmbed({
          message: `Created new hunt: ${hunt.title}!`,
          icon: ICONS.SPARKLES.GREEN,
        });
        const responseEmbed = await HuntEmbed(hunt);
        await interaction.reply({ embeds: [announcementEmbed, responseEmbed] });
        /*-----------------------------------------------------
         *  RESPONSE: begin
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.HUNT.BEGIN) {
        const id = interaction.options.getInteger(HUNT.COLUMNS.ID);
        const hunt = await models.Hunt.findByPk(id);

        // Argument checks
        if (!hunt || hunt.guild !== interaction.member.guild.id) {
          await interaction.reply(
            `Sorry, I couldn't find a hunt with that ID. Are you sure it was created in ${interaction.member.guild.name}?`
          );
        } else {
          // Begin hunt
          await beginHunt(hunt, interaction);
        }
        /*-----------------------------------------------------
         *  RESPONSE: end
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.HUNT.END) {
        const id = interaction.options.getInteger(HUNT.COLUMNS.ID, true);
        const hunt = await models.Hunt.findByPk(id);

        // Argument checks
        if (!hunt || hunt.guild !== interaction.member.guild.id) {
          await interaction.reply(
            `Sorry, I couldn't find a hunt with that ID. Are you sure it was created in ${interaction.member.guild.name}?`
          );
        } else {
          // End hunt
          await endHunt(hunt, interaction);
        }
        /*-----------------------------------------------------
         *  COMMAND: delete
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.HUNT.DELETE) {
        const purge = interaction.options.getBoolean("purge");
        const id = interaction.options.getInteger(HUNT.COLUMNS.ID);
        const hunt = id ? await models.Hunt.findByPk(id) : null;

        // Argument checks
        if (!(purge || id)) {
          await interaction.reply(
            "Please include ID of the Hunt you wish to delete, or confirm " +
              "you want to delete them all by including the `purge` flag set to `true`."
          );
        } else if (
          (id && !hunt) ||
          hunt.guild !== interaction.member.guild.id
        ) {
          await interaction.reply(
            `Sorry, I couldn't find a hunt with that ID. Are you sure it was created in ${interaction.member.guild.name}?`
          );
        } else {
          // Delete
          await deleteHunt({ interaction, purge, hunt });
        }

        /*-----------------------------------------------------
         *  RESPONSE: list
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.HUNT.LIST) {
        const id = interaction.options.getInteger(HUNT.COLUMNS.ID);
        const hunt = id ? await models.Hunt.findByPk(id) : undefined;

        // Argument checks
        if (
          (id && !hunt) ||
          (hunt && hunt.guild !== interaction.member.guild.id)
        ) {
          await interaction.reply(
            `Sorry, I couldn't find a hunt with ID ${id}. Are you sure it was created in ${interaction.member.guild.name}?`
          );
        } else {
          // List
          await listHunt({ interaction, hunt });
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

/*
 *  Sets the hunt to active, and updates all unblocked clues to UNLOCKED status.
 */
async function beginHunt(hunt, interaction) {
  // Update hunt status
  hunt.status = HUNT.STATUS.ACTIVE;
  await hunt.save(); // Make sure you use 'await' here to ensure the record is saved before proceeding

  // Unlock clues
  const cluesToUnlock = await models.Clue.findAll({
    where: { unlocked_by: null, status: CLUE.STATUS.LOCKED, hunt_id: hunt.id },
  });
  
  for (const unlockedClue of cluesToUnlock) {
    unlockedClue.status = CLUE.STATUS.UNLOCKED;
    await unlockedClue.save(); // Use 'await' here as well
  }

  // Announce
  const announcementEmbed = NotificationEmbed({
    message: `${hunt.title} has commenced!`,
    icon: ICONS.SPARKLES.GREEN,
  });
  const responseEmbed = await HuntEmbed(hunt);
  const clueUnlockEmbed = NotificationEmbed({
    message: `${cluesToUnlock.length} clue${
      cluesToUnlock.length > 1 ? "s" : ""
    } unlocked.`,
  });
  const embeds = [announcementEmbed, responseEmbed];
  if (cluesToUnlock.length > 0) {
    embeds.push(clueUnlockEmbed);
  }
  
  // Send the reply and store the message ID
  const reply = await interaction.reply({ embeds: embeds, fetchReply: true });
  hunt.embedMessageId = reply.id;
  await hunt.save();
}

/*
 *  Sets the hunt to inactive.
 */
async function endHunt(hunt, interaction) {
  // Update hunt status
  hunt.set({ status: HUNT.STATUS.INACTIVE });
  hunt.save();

  // Announce
  const announcementEmbed = NotificationEmbed({
    message: `${hunt.title} has ended!`,
    icon: ICONS.SPARKLES.RED,
  });
  const responseEmbed = await HuntEmbed(hunt);
  await interaction.reply({
    embeds: [announcementEmbed, responseEmbed],
  });
}

/*
 *  Deletes hunts.
 */
async function deleteHunt({ interaction, purge, hunt }) {
  if (purge) {
    // Delete all and reply.
    await purgeHunts({ interaction, hunt });
  } else if (hunt) {
    const huntName = hunt.title;
    // Delete one and reply.
    await hunt.destroy();
    const notificationEmbed = NotificationEmbed({
      message: `Deleted ${huntName}.`,
      icon: ICONS.SPARKLES.RED,
    });
    await interaction.reply({ embeds: [notificationEmbed] });
  }
}

// Deletes all hunts on the server, sparing one if specified.
async function purgeHunts({ interaction, hunt }) {
  // Fetch all server hunts.
  const guildHunts = await models.Hunt.findAll({
    where: { guild: interaction.member.guild.id },
  });
  const totalHunts = guildHunts.length;

  // Delete all server hunts
  guildHunts.forEach((deletedHunt) => {
    if (deletedHunt.id !== hunt?.id) {
      deletedHunt.destroy();
    }
  });

  // Reply
  const totalDeletedHunts = hunt ? totalHunts - 1 : totalHunts;
  const sparedClause = hunt ? `, sparing ${hunt.title}` : "";
  const pluralize = totalDeletedHunts > 1 ? "s" : "";
  const deleteText = `Deleted ${totalDeletedHunts} hunt${pluralize} from ${interaction.member.guild.name}${sparedClause}.`;

  const notificationEmbed = NotificationEmbed({
    message: deleteText,
    icon: ICONS.SPARKLES.RED,
  });
  const embeds = [notificationEmbed];
  if (hunt) {
    const huntEmbed = await HuntEmbed(hunt);
    embeds.push(huntEmbed);
  }
  interaction.reply({ embeds: embeds });
}

/*
 *  List hunts.
 */
async function listHunt({ interaction, hunt }) {
  if (!hunt) {
    await interaction.reply({ 
      content: "The specified hunt does not exist.",
      ephemeral: true 
    });
    return;
  }
  if (hunt) {
    // Fetch just the one hunt
    const embed = await HuntEmbed(hunt);
    // TODO: Also output a list of unlocked clues for this hunt.
    await interaction.reply({ embeds: [embed] });
  } else {
    // Fetch all hunts.
    const hunts = await models.Hunt.findAll({ include: models.Clue });
    const embeds = [];
    for (const hunt of hunts) {
      const view = await HuntEmbed(hunt);
      embeds.push(view);
    }
    await interaction.reply({ embeds: embeds });
  }
}
