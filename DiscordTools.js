function getUserHandle(member) {
    return member.nickname ?? member.user.username;
}

function getAvatar(member) {
    return member.avatar ?? member.user.avatar;
}

// TODO: Would be nice if this used server avatars too.
function getAvatarImageUrl(member) {
    // const guildAvatar = `https://cdn.discordapp.com/avatars/guilds/${member.guild.id}/users/${member.user.id}/avatars/${member.avatar}.png`;
    return `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`;
    // console.log(guildAvatar, userAvatar);
    // return member.avatar
    //     ? guildAvatar
    //     : member.user.avatar
    //         ? userAvatar
    //         : '';
}

module.exports = { getUserHandle, getAvatar, getAvatarImageUrl };