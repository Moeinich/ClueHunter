const { ICONS, COLORS } = require("../Constants");
const NotificationEmbed = function ({ color, message, icon, ephemeral }) {
  const embedColor = color ?? ephemeral ? COLORS.WHISPER : COLORS.NOTIFICATION;
  return {
    author: {
      name: message,
      icon_url: icon ?? ICONS.SPARKLES.BLUE,
    },
    color: embedColor,
  };
};

module.exports = { NotificationEmbed };
