const axios = require('axios');

const WEBHOOK = process.env.WEBHOOK;

function monitorBot(client) {
  if (!client || typeof client.on !== 'function') {
    throw new Error('O client não foi inicializado corretamente.');
  }

  console.log('[INFO] Monitorando o bot...');

  client.on('ready', () => {
    console.log(`[INFO] Punishment está online: ${client.user.tag}`);
    sendWebhookNotification('Punishment está online!', 'O bot está funcionando normalmente.');
  });

  client.on('shardDisconnect', (event, shardId) => {
    console.error(`[ALERTA] Shard ${shardId} desconectada!`);
    sendWebhookNotification(
      'Punishment desconectado!',
      `A shard ${shardId} foi desconectada. Verifique imediatamente.`
    );
  });

  client.on('error', (error) => {
    console.error(`[ERROR] Erro detectado: ${error.message}`);
    sendWebhookNotification('Punishment erro!', `Erro detectado: ${error.message}`);
  });

  client.on('warn', (info) => {
    console.warn(`[WARN] Aviso: ${info}`);
    sendWebhookNotification('Punishment aviso!', `Aviso detectado: ${info}`);
  });
}

async function sendWebhookNotification(title, description) {
  if (!WEBHOOK) {
    console.warn('[WARN] URL do Webhook não configurada.');
    return;
  }

  const embed = {
    color: 0xff0000,
    title,
    description,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Punishment Monitoramento',
    },
  };

  try {
    await axios.post(WEBHOOK, {
      username: 'Punishment Status',
      avatar_url: 'https://bit.ly/3CSNQFw',
      embeds: [embed],
    });
    console.log('[INFO] Notificação enviada via Webhook.');
  } catch (error) {
    console.error('[ERROR] Falha ao enviar notificação via Webhook:', error.message);
  }
}

module.exports = monitorBot;
