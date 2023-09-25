const COMMANDS = {
  HUNT: "hunt",
  CLUE: "clue",
  STATS: "stats",
};

const SUBCOMMANDS = {
  HUNT: {
    CREATE: "create",
    BEGIN: "begin",
    END: "end",
    LIST: "list",
    DELETE: "delete",
  },
  CLUE: {
    CREATE: "create",
    GUESS: "guess",
    LIST: "list",
    DELETE: "delete",
  },
  STATS: {
    SERVER: "server",
  },
};

const HUNT = {
  COLUMNS: {
    ID: "id",
    TITLE: "title",
    DESCRIPTION: "description",
    STATUS: "status",
  },
  STATUS: {
    INACTIVE: "INACTIVE",
    ACTIVE: "ACTIVE",
  },
};

const CLUE = {
  COLUMNS: {
    ID: "id",
    TITLE: "title",
    STATUS: "status",
    TEXT: "text",
    PASSWORD: "password",
    HUNT: "hunt_id",
    UNLOCKED_BY: "unlocked_by",
  },
  STATUS: {
    LOCKED: "LOCKED",
    UNLOCKED: "UNLOCKED",
    SOLVED: "SOLVED",
  },
};

const GUESS = {
  COLUMNS: {
    ID: "id",
    PASSWORD: "password",
    SUCCESS: "success",
    CLUE: "clue_id",
  },
};

const DISCORD = {
  USER: "user",
  GUILD: "guild",
  EMBED: {
    THUMBNAIL: "thumbnail",
    IMAGE: "image",
  },
};

const COLORS = {
  HUNT_STATUS: {
    ACTIVE: 0x246b50,
    INACTIVE: 0x632147,
  },
  CLUE_STATUS: {
    LOCKED: 0x632147,
    UNLOCKED: 0x8f7131,
    SOLVED: 0x246b50,
  },
  NOTIFICATION: 0x313e8f,
  WHISPER: 0x50318f,
};

const ICONS = {
  CORVID_SKELETON: "https://cdn.discordapp.com/emojis/975911441846657124.png",
  HUNT: "https://media.discordapp.net/attachments/1096461558466478141/1097190119968083978/hunt.png",
  CLUE: "https://media.discordapp.net/attachments/1096461558466478141/1097192112384135228/clue.png",
  SPARKLES: {
    BLUE: "https://media.discordapp.net/attachments/1096461558466478141/1097196385658486854/sparkles.png",
    GREEN:
      "https://media.discordapp.net/attachments/1096461558466478141/1097196235938598964/sparkles-start.png",
    RED: "https://media.discordapp.net/attachments/1096461558466478141/1097196261163159652/sparkles-end.png",
  },
};

const MESSAGING = {
  UNKNOWN_ERROR:
    "I'm a little birdbrained right now, sorry! Please tell Moeinich I'm not feeling well.",
};

module.exports = {
  COMMANDS,
  SUBCOMMANDS,
  HUNT,
  CLUE,
  GUESS,
  DISCORD,
  COLORS,
  ICONS,
  MESSAGING,
};
