const { EmbedBuilder } = require('discord.js');
const db = require('../data/database');

module.exports = {
  name: 'mod-stats',
  description: 'Exibe estatísticas da moderação no servidor.',
  usage: '${currentPrefix}mod-stats',
  permissions: 'Gerenciar Servidor',
  async execute(message) {
    if (!message.member.permissions.has('ManageGuild')) {
      const embedErroMinimo = new EmbedBuilder()
        .setColor('#FF4C4C')
        .setAuthor({
          name: 'Você não possui permissão para usar este comando.',
          iconURL: 'https://bit.ly/43PItSI',
        });

      return message.reply({ embeds: [embedErroMinimo], allowedMentions: { repliedUser: false } });
    }

    try {
      const guildId = message.guild.id;

      const totalActions = db
        .prepare('SELECT COUNT(*) AS count FROM mod_actions WHERE guild_id = ?')
        .get(guildId);

      const actionsByType = db
        .prepare('SELECT action_type, COUNT(*) AS count FROM mod_actions WHERE guild_id = ? GROUP BY action_type')
        .all(guildId);

      const actionsByModerator = db
        .prepare(
          'SELECT moderator_id, COUNT(*) AS count FROM mod_actions WHERE guild_id = ? GROUP BY moderator_id ORDER BY count DESC LIMIT 5'
        )
        .all(guildId);

      const recentActions = db
        .prepare(
          'SELECT moderator_id, action_type, target_id, reason, timestamp FROM mod_actions WHERE guild_id = ? ORDER BY timestamp DESC LIMIT 5'
        )
        .all(guildId);

      let typeStats = '';
      for (const action of actionsByType) {
        typeStats += `**${action.action_type}:** \`${action.count}\`\n`;
      }

      let moderatorStats = '';
      for (const mod of actionsByModerator) {
        const user = await message.guild.members.fetch(mod.moderator_id).catch(() => null);
        const username = user ? user.user.tag : 'Usuário desconhecido';
        moderatorStats += `**${username}:** \`${mod.count}\` ações\n`;
      }

      let recentStats = '';
      for (const action of recentActions) {
        const moderator = await message.guild.members.fetch(action.moderator_id).catch(() => null);
        const target = await message.guild.members.fetch(action.target_id).catch(() => null);
        const moderatorName = moderator ? moderator.user.tag : 'Desconhecido';
        const targetName = target ? target.user.tag : 'Desconhecido';
        recentStats += `**${action.action_type}:** \`${moderatorName} -> ${targetName}\`\nMotivo: \`${action.reason || 'Nenhum'}\`\n\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle('Estatísticas de Moderação')
        .setColor('#fe3838')
        .addFields(
          { name: '<:1000043480:1336455409904517151> Total de Ações', value: `\`${totalActions.count || 0}\``, inline: true },
          { name: '<:1000043157:1336324220770062497> Ações por Tipo', value: typeStats || '`Nenhuma ação registrada.`', inline: true },
          { name: '<:1000043165:1336327290446942280> Top Moderadores', value: moderatorStats || '`Nenhuma ação registrada.`', inline: false },
          { name: '<:1000043158:1336324199202947144> Ações Recentes', value: recentStats || '`Nenhuma ação registrada.`', inline: false }
        )
        .setFooter({
          text: `${message.author.username}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      return message.channel.send({ embeds: [embed], allowedMentions: { repliedUser: false } });
    } catch (error) {
      console.error(`[ERROR] Falha ao gerar estatísticas:`, error);
      const embedErroMinimo = new EmbedBuilder()
        .setColor('#FF4C4C')
        .setAuthor({
          name: 'Não foi possível gerar as estatísticas de moderação devido a um erro.',
          iconURL: 'https://bit.ly/43PItSI',
        });

      return message.reply({ embeds: [embedErroMinimo], allowedMentions: { repliedUser: false } });
    }
  },
};
