/* eslint-disable no-unused-vars */
// import store from "@/store";
import { ipcMain } from "electron"
import { App } from "@slack/bolt"
const SLACK_USER_TOKEN = "xoxp-5192708081924-5190227275250-5175689156935-c05d4e702c5dd246ab5f05a8740f01af"
const BOT_USER_ID = "U055L36GMFV"



// your bot token
const slackUserToken = "xoxb-<your-token>";

// main process event IPC channel
const SLACK_EVENT_CHANNEL = "slack-event";
const SLACK_CALL_CHANNEL = "slack-call";
export class SlackBot {
  constructor({
    topics,
    user_token = slackUserToken,
    bot_user_id = "botUserId",
    prompt = `以下list每个元素字符串的情绪转为emoji unicode值(\\U开头)，一行输出emoji字符串python list，不要换行，字符串用双引号扩起来`,
    WebClient = null,
  }) {
    this.client = new WebClient(user_token);
    this.bot_user_id = bot_user_id;
    this.topics = topics;
    this.last = topics[topics.length - 1];
    this.data = "";
    this.prompt = prompt;
    this.d = {};
    if (!this.dm_channel_id) {
      console.log("Could not find DM channel with the bot.");
      return;
    }
  }

  async checkAvailability() {
    this.dm_channel_id = await this.find_direct_message_channel(
      this.bot_user_id,
    );
    this.constructor._isAvailable = !!this.dm_channel_id; // For simplicity, default to true
    return this.isAvailable(); // Always return like this
  }

  async send_message(text) {
    try {
      return await this.client.chat.postMessage({
        text: text,
        channel: this.dm_channel_id,
      });
    } catch (error) {
      console.log(`Error sending message: ${error}`);
    }
  }

  async fetch_messages(last_message_timestamp) {
    const response = await this.client.conversations.history({
      channel: this.dm_channel_id,
      oldest: last_message_timestamp,
    });

    const data = response.messages
      .filter((msg) => msg.user === this.bot_user_id)
      .map((msg) => msg.text);

    return data;
  }

  async get_new_messages(last_message_timestamp) {
    const has_reply = true;
    while (has_reply) {
      const messages = await this.fetch_messages(last_message_timestamp);
      if (messages && !messages[messages.length - 1].endsWith("Typing…_")) {
        return messages[messages.length - 1];
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  async find_direct_message_channel(user_id) {
    try {
      const response = await this.client.conversations.open({ users: user_id });
      return response.channel.id;
    } catch (error) {
      console.log(`Error opening DM channel: ${error}`);
    }
  }

  async program_style() {
    let ini = true;
    let missing = [];

    const has_reply = true;
    while (has_reply) {
      let prompt;
      if (missing.length) {
        prompt = `${this.prompt}：${missing}`;
        this.last = missing[missing.length - 1];
      } else if (ini) {
        prompt = `${this.prompt}：${this.topics}`;
        ini = false;
      } else {
        prompt = "显示剩下的部分";
      }

      const new_message = await this.get_message(prompt);
      this.data += new_message;

      if (
        this.data.includes(this.last) ||
        new_message.includes("抱歉,后续没有")
      ) {
        const l = this.data.match(/".+?(?=,|\n)/g);

        for (const item of l) {
          const it = item.split(":");
          const ind = it.length === 3 ? 1 : 0;
          this.d[it[ind].slice(1, -1)] = it[ind + 1].trim().slice(1, -1);
        }

        missing = this.topics.filter((t) => !this.d[t]);
        if (!missing.length) {
          return this.d;
        }
      }
    }
  }

  async get_message(text) {
    const response = await this.send_message(text);
    if (response) {
      const last_message_timestamp = response.ts;
      const new_message = await this.get_new_messages(last_message_timestamp);
      return new_message;
    }
  }

  async input_style() {
    const has_reply = true;
    while (has_reply) {
      const prompt = prompt("USER: ");
      const response = await this.send_message(prompt);
      if (response) {
        const last_message_timestamp = response.ts;
        const new_message = await this.get_new_messages(last_message_timestamp);
        console.log(`Claude: ${new_message}`);
      }
    }
  }
}

export function handle_IPC() {
  // const { slackUserToken, botUserId } = store.state.claudeInSlack;
  const app = new App({
    // signingSecret: SLACK_SIGNING_SECRET,
    // token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_USER_TOKEN,
    token: BOT_USER_ID,
  });
  // /* Add functionality here */

  (async () => {
    // Start the app
    await app.start(3188);

    console.log("⚡️ Bolt app is running!");
  })();
  // ipcMain.handle(
  //   SLACK_CALL_CHANNEL,
  //   async (event, channel, method, ...args) => {
  //     const payload = { channel };
  //     payload[method] = args[0];
  //     if (
  //       args.length >= 2 &&
  //       typeof args[1] === "object" &&
  //       !Array.isArray(args[1])
  //     ) {
  //       Object.assign(payload, args[1]);
  //     }
  //     try {
  //       // Call slack API and send response to renderer process
  //       const response = await web.conversations.sendMessage(payload);
  //       event.sender.send(SLACK_EVENT_CHANNEL, null, response);
  //     } catch (error) {
  //       // Send rejected promise error message back that can be handled in the calling code
  //       event.sender.send(SLACK_EVENT_CHANNEL, error.message, null);
  //     }
  //   },
  // );
}
