const { EmbedBuilder } = require('discord.js');
const db = require('../data/database');

module.exports = {
  name: 'warnings',
  description: 'Lista os avisos de um usuário no servidor.',
  usage: '${currentPrefix}warnings <@usuário>',
  userPermissions: ['ManageMessages'],
  botPermissions: ['ManageMessages'],
  deleteMessage: true,
  
  async execute(message) {
    
    const user = message.mentions.members.first();
    if (!user) {
      const embedErro = new EmbedBuilder()
        .setColor('#FF4C4C')
        .setAuthor({
          name: 'Mencione um usuário para visualizar os avisos.',
          iconURL: 'https://bit.ly/43PItSI',
        });
      return message.reply({ embeds: [embedErro], allowedMentions: { repliedUser: false } });
    }

    
    const warnings = db
      .prepare('SELECT * FROM warnings WHERE user_id = ? AND guild_id = ?')
      .all(user.id, message.guild.id);

    if (warnings.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('Sem Avisos')
        .setDescription(`${user} não possui avisos.`)
        .setFooter({
          text: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }

    const embed = new EmbedBuilder()
      .setColor('#FE3838')
      .setTitle(`Avisos para ${user.displayName}`)
      .setDescription(
        warnings
          .map(
            (warn, index) =>
              `**#${index + 1}**\n` +
              `**Motivo:** ${warn.reason}\n` +
              `**Moderador:** <@${warn.moderator_id}>\n` +
              `**Data:** <t:${Math.floor(warn.timestamp / 1000)}:F>\n`
          )
          .join('\n\n')
      )
      .setFooter({
        text: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    message.channel.send({ embeds: [embed], allowedMentions: { repliedUser: false } });
  },
};
