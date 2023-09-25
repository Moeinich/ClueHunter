const { ICONS, COLORS } = require("../Constants");

const PrettyEmbed = function ({ color, title, message, footer, icon, ephemeral }) {
  const embedColor = color ?? (ephemeral ? COLORS.WHISPER : COLORS.NOTIFICATION);
  return {
    description: message,
    footer: {
      text: footer
    },
    author: {
      name: title,
      icon_url: icon ?? ICONS.SPARKLES.BLUE,
    },
    color: embedColor,
  };
};

module.exports = { PrettyEmbed };
