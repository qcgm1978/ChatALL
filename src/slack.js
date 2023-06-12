const { App } = require('@slack/bolt');
// 创建 IncomingWebhook 实例，提供您的 Slack Webhook URL
const url = 'https://hooks.slack.com/services/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';

// 创建 RTMClient 实例，提供您的 Slack 应用的令牌
const SLACK_USER_TOKEN = "xoxb-5192708081924-5183649584310-WNsF5MB1rnW6D2aQrxgsW2FH"
const SLACK_BOT_TOKEN='xoxb-5192708081924-5183649584310-WNsF5MB1rnW6D2aQrxgsW2FH'

const app = new App({
  signingSecret: 'xoxp-5192708081924-5190227275250-5175689156935-c05d4e702c5dd246ab5f05a8740f01af',
  token:SLACK_USER_TOKEN,
});

const app_id = 'U055L36GMFV';
// app.client.users.list().then(data => {
//   console.log(data)
// })
// 向Claude app发送私密消息
app.client.chat.postEphemeral({
  token: SLACK_BOT_TOKEN,
  channel: app_id,
  text: 'Hello, Claude app!',
  user: 'U055L6P837C'
}).then((result) => {
  console.log('Message sent:', result);
}).catch((error) => {
  console.error('Error sending message:', error);
});
(async () => {
  // Start the app
  await app.start(3188);

  console.log('⚡️ Bolt app is running!');
  // Reverse all messages the app can hear
  // app_slack.message(async ({ message, say }) => {
  //   const enableSay = message.subtype === undefined || message.subtype === 'bot_message';
  //   console.log(enableSay)
  // // Filter out message events with subtypes (see https://api.slack.com/events/message)
  // if (enableSay) {
  //   const reversedText = [...message.text].reverse().join("");
  //   const said=await say(reversedText);
  //   console.log(said)
  // }
// });
})();