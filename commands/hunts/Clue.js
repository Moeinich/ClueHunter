const { SlashCommandBuilder} = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const { Op } = require('sequelize');
const { HuntEmbed } = require('../../components/HuntEmbed');
const { PrettyEmbed } = require('../../components/PrettyEmbed');
const { models } = require("../../database");
const {
  COMMANDS,
  SUBCOMMANDS,
  CLUE,
  MESSAGING,
  ICONS,
} = require("../../Constants");
const { ClueEmbed } = require("../../components/ClueEmbed");
const { NotificationEmbed } = require("../../components/NotificationEmbed");
const { getUserHandle, getAvatarImageUrl } = require("../../DiscordTools");

/*---------------------------------------------------------------------------------
 *  TODO:
 *   - Ensure that clues may only be guessed whilw their hunt is active,
 *   as inactive / ended hunts will preserve their state.
 *--------------------------------------------------------------------------------*/

module.exports = {
  data: new SlashCommandBuilder()
    /*---------------------------------------------------------------------------------
     *  COMMANDS
     *--------------------------------------------------------------------------------*/
    .setName(COMMANDS.CLUE)
    .setDescription("Manage your hunt's clues.")
    /*-----------------------------------------------------
     *  COMMAND: create
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.CLUE.CREATE)
        .setDescription("Create a new clue.")
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.HUNT)
            .setDescription(
              "The id of the hunt this clue should be added to. (required)"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName(CLUE.COLUMNS.TITLE)
            .setDescription("A title for your clue. (optional)")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName(CLUE.COLUMNS.TEXT)
            .setDescription(
              "Any text you would like your clue to display. (optional)"
            )
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.UNLOCKED_BY)
            .setDescription(
              "The id of a clue that must be solved before this one is visible. (optional)"
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName(CLUE.COLUMNS.PASSWORD)
            .setDescription("A magic word that solves the clue. (optional)")
            .setRequired(false)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: guess
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.CLUE.GUESS)
        .setDescription("Guess the magic word.")
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.ID)
            .setDescription("The id of the clue you are guessing. (required)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName(CLUE.COLUMNS.PASSWORD)
            .setDescription("Your guess. (required)")
            .setRequired(true)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: list
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.CLUE.LIST)
        .setDescription("Display available clues in a hunt")
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.HUNT)
            .setDescription("View all clues in a hunt. (required)")
            .setRequired(true)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: delete
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.CLUE.DELETE)
        .setDescription("Delete clues.")
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.ID)
            .setDescription("Delete a clue. (optional)")
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.HUNT)
            .setDescription("Delete all clues in a hunt. (optional)")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("purge")
            .setDescription("Delete all clues across all hunts on this server.")
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
      if (subcommand === SUBCOMMANDS.CLUE.CREATE) {
        // Check for permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
          await interaction.reply({
              content: "You don't have the required permissions to create a clue.",
              ephemeral: true
          });
          return;
      }       
        // Fetch options
        const huntId = interaction.options.getInteger(CLUE.COLUMNS.HUNT, true);
        const title = interaction.options.getString(CLUE.COLUMNS.TITLE, false);
        const text = interaction.options.getString(CLUE.COLUMNS.TEXT, false);
        const unlockedBy = interaction.options.getInteger(
          CLUE.COLUMNS.UNLOCKED_BY,
          false
        );
        const password = interaction.options.getString(
          CLUE.COLUMNS.PASSWORD,
          false
        );

        // Create clue
        const hunt = await models.Hunt.findByPk(huntId);
        const clue = await hunt.createClue({
          title: title,
          text: text,
          status: CLUE.STATUS.LOCKED,
          password: password,
        });
        if (!clue.title) {
          clue.title = `Clue ${clue.id}`;
        }

        // Lock this clue behind another clue, if specified
        if (unlockedBy) {
          const blockingClue = unlockedBy
            ? await models.Clue.findByPk(unlockedBy)
            : undefined;
          blockingClue.addUnlocks(clue);
        }

        await clue.save();

        // Respond
        const announcementEmbed = NotificationEmbed({
          message: `Created new clue: ${clue.title}!`,
          icon: ICONS.SPARKLES.GREEN,
        });
        const responseEmbed = await ClueEmbed(clue);
        await interaction.reply({ embeds: [announcementEmbed, responseEmbed] });
        /*-----------------------------------------------------
         *  RESPONSE: guess
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.CLUE.GUESS) {
        const clueId = interaction.options.getInteger(CLUE.COLUMNS.ID, true);
        const password = interaction.options.getString(CLUE.COLUMNS.PASSWORD, true);
    
        const clue = await models.Clue.findByPk(clueId);
        await documentGuess(clue, password, interaction);
    
        if (clue.status === CLUE.STATUS.LOCKED) {
            await interaction.reply({ 
                content: 'You need to unlock that clue first!',
                ephemeral: true
            });
        } else if (isCorrectGuess(clue, password)) {
            await solveClue(clue, interaction);
        } else {
            // Select a random funny response
            const randomResponse = WRONG_GUESS_RESPONSES[Math.floor(Math.random() * WRONG_GUESS_RESPONSES.length)];
    
            const notificationEmbed = NotificationEmbed({
                message: `${getUserHandle(interaction)}: ${randomResponse}`,
                icon: getAvatarImageUrl(interaction.member),
            });
            await interaction.reply({ 
                embeds: [notificationEmbed], 
            });
        }
        /*-----------------------------------------------------
         *  RESPONSE: list
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.CLUE.LIST) {
        const clueId = interaction.options.getInteger(CLUE.COLUMNS.ID, false);
        const huntId = interaction.options.getInteger(CLUE.COLUMNS.HUNT, false);
        const clues = [];

        if (clueId) {
          // Fetch one clue
          const clue = await models.Clue.findByPk(clueId);
          clues.push(clue);
        } else if (huntId) {
          // Scope by hunt
          const huntClues = await models.Clue.findAll({
            where: { 
              hunt_id: huntId,
              status: { [Op.ne]: 'LOCKED' }  // Excludes clues with status "LOCKED"
            },
          });
          
          huntClues.forEach((clue) => clues.push(clue));
        } else {
          // All clues on server.
          const serverClues = await models.Clue.findAll({
            include: { model: models.Hunt, required: true },
          });
          for (const clue of serverClues) {
            const hunt = await clue.getHunt();
            if (hunt.guild === interaction.member.guild.id) {
              clues.push(clue);
            }
          }
        }

        // Check clues were found
        if (!clues.length) {
          await interaction.reply({
            content: "Could not find any matching clues on this server. Try widening your search!",
            ephemeral: true
          });
        } else {
          // Generate embeds
          const clueEmbeds = [];
          for (const clue of clues) {
            const embed = await ClueEmbed(clue);
            clueEmbeds.push(embed);
          }
          // Reply
          await interaction.reply({ embeds: clueEmbeds, ephemeral: true });
        }
        /*-----------------------------------------------------
         *  RESPONSE: delete
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.CLUE.DELETE) {
        // Check for permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
          await interaction.reply({
              content: "You don't have the required permissions to delete a clue.",
              ephemeral: true
          });
          return;
      }     
        const clueId = interaction.options.getInteger(CLUE.COLUMNS.ID, false);
        const huntId = interaction.options.getInteger(CLUE.COLUMNS.HUNT, false);
        const purge = interaction.options.getBoolean("purge");

        const earmarkedClue = clueId
          ? await models.Clue.findByPk(clueId)
          : null;
        const clueTitle = earmarkedClue?.title;

        // Ensure we're only modifying hunts from this server
        const hunt = huntId ? await models.Hunt.findByPk(huntId) : null;
        if (hunt && hunt?.guild !== interaction.member.guild.id) {
          await interaction.reply(
            `${hunt.title} is managed by another server.`
          );
        } else {
          if (purge) {
            // Delete all clues on server
            const serverClues = await models.Clue.findAll({
              include: { model: models.Hunt, required: true },
            });
            for (const clue of serverClues) {
              const clueHunt = await clue.getHunt();
              if (
                clueHunt.guild === interaction.member.guild.id &&
                clue.id !== clueId &&
                clue.hunt_id !== huntId
              ) {
                await clue.destroy();
              }
            }
            await interaction.reply(`Deleted all clues.`);
          } else if (huntId) {
            // Delete all clues in hunt
            const cluesByHunt = await hunt.getClues();
            for (const deletedClue in cluesByHunt) {
              if (deletedClue.id !== clueId) {
                await deletedClue.destroy();
              }
            }

            await interaction.reply(`Deleted all clues in ${hunt.title}.`);
          } else if (clueId) {
            // Delete individual clue
            await earmarkedClue.destroy();
            await interaction.reply(`${clueTitle} has been deleted.`);
          }
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
async function solveClue(clue, interaction) {
  // Update clue status
  clue.status = CLUE.STATUS.SOLVED;
  await clue.save();

  // Check if all clues in the hunt are solved
  const hunt = await clue.getHunt();
  const unsolvedClues = await models.Clue.count({
      where: {
          hunt_id: hunt.id,
          status: { [Op.notIn]: [CLUE.STATUS.SOLVED] }
      }
  });

  let notificationMessage = "";
  let embeds = [];
  let replyContent = "";  // Initialize a variable to hold your main reply's content

  
  // If there are more clues left
  if (unsolvedClues >= 1) {
      const randomPositiveResponse = RIGHT_GUESS_RESPONSES[Math.floor(Math.random() * RIGHT_GUESS_RESPONSES.length)];
      notificationMessage = `${getUserHandles(interaction)}, ${randomPositiveResponse}`;
  
      // Unlock clues that were waiting on this one
      const cluesToUnlock = await models.Clue.findAll({
          where: {
              unlocked_by: clue.id,
              status: CLUE.STATUS.LOCKED,
          },
      });
  
      for (const unlockedClue of cluesToUnlock) {
          unlockedClue.status = CLUE.STATUS.UNLOCKED;
          await unlockedClue.save();
      }
  
      if (cluesToUnlock.length > 0) {
      notificationMessage += `\n\n🔓 Next clue available! Check the next clue below or use /clue list <huntid> to see the next one!`;
  
      const notificationEmbed = PrettyEmbed({
          title: "Clue Step Solved!",
          message: notificationMessage,
          footer: "Continue your hunt, there's more steps to solve!",
          icon: ICONS.SPARKLES.GREEN,
      });
      embeds.push(notificationEmbed);

      //Embed the next clue!
      const cluesToEmbed = [];
      // Scope by hunt
      const huntClues = await models.Clue.findAll({
        where: { 
          hunt_id: hunt.id,
          status: 'UNLOCKED'  // Only fetch clues with status "UNLOCKED"
        },
      });
      huntClues.forEach((clue) => cluesToEmbed.push(clue));

      // Check clues were found
      if (!cluesToEmbed.length) {
        replyContent = "Could not find any matching clues on this server. Try widening your search!";
    } else {
        // Generate embeds for the clues
        for (const clue of cluesToEmbed) {
            const embed = await ClueEmbed(clue);
            embeds.push(embed);
        }
    }
    }

  } else if (unsolvedClues === 0) { // No more clues left
      const huntCompleteEmbed = PrettyEmbed({
          title: "The hunt is over!",
          message: `Congratulations ${getUserHandles(interaction)}, You solved the last clue!`,
          footer: "🤩 All clues in this hunt have been solved, thanks for playing!",
          icon: ICONS.TROPHY,
      });
      embeds.push(huntCompleteEmbed);
  }
  
  // Respond
  await interaction.reply({ content: replyContent, embeds: embeds });
  

  // Update the hunt embed
  const messageId = hunt.embedMessageId;
  const message = await interaction.channel.messages.fetch(messageId);
  const refreshedHunt = await models.Hunt.findByPk(hunt.id, { include: models.Clue });  // Refetch the hunt
  const huntUpdateEmbed = await HuntEmbed(refreshedHunt);
  await message.edit({ embeds: [huntUpdateEmbed] })
}

async function documentGuess(clue, password, interaction) {
  // Save guesses to database for public shaming purposes
  const guess = await clue.createGuess({
    user: interaction.user.toString(),
    password: password,
    success: isCorrectGuess(clue, password),
  });
  guess.save();
}

function isCorrectGuess(clue, password) {
  return clue.password && clue.password === password;
}

function getUserHandles(interaction) {
  return `<@${interaction.user.id}>`;
}

const WRONG_GUESS_RESPONSES = [
  "did you even try or was that a pocket guess? 🤨",
  "oh look, another wrong guess! What a surprise.",
  "was that your best shot? Yikes.",
  "if I had a dime for every time you guessed wrong... 🤔",
  "keep going, maybe you'll get it in the next 100 tries!",
  "wow, you're really consistent at being wrong.",
  "maybe guessing games just aren't your thing.",
  "I've seen better guesses from a potato.",
  "you're setting records... in wrong guesses!",
  "wrong again! I'd say I'm surprised, but..."
];

const RIGHT_GUESS_RESPONSES = [
  `solved a clue! Well, even a broken clock is right twice a day.`,
  `solved a clue! Finally! Was starting to think you'd never get one.`,
  `solved a clue! Surprised you got that one. Were you peeking?`,
  `solved a clue! You actually got it? Blind luck, I assume.`,
  `solved a clue! Took you long enough!`,
  `solved a clue! Wait, that was correct? I wasn't expecting that.`,
  `solved a clue! Guess miracles do happen.`,
  `solved a clue! Congrats! It only took you... how many tries?`,
  `solved a clue! You got it right. Mark this day in history.`,
  `solved a clue! Oh, you actually knew this one? Color me surprised.`
];
