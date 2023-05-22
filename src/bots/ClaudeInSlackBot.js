/* eslint-disable no-constant-condition */
import AsyncLock from "async-lock";
import Bot from "@/bots/Bot";
import { WebClient } from '@slack/web-api';
import store from "@/store";
// store.state.knowNothing.setting1
// store.state.knowNothing.setting2
const { slackUserToken, botUserId } = store.state.claudeInSlack;
export default class ClaudeInSlackBot extends Bot {
  static _brandId = "ClaudeInSlack"; // Brand id of the bot, should be unique. Used in i18n.
  static _className = "ClaudeInSlackBot"; // Class name of the bot
  static _logoFilename = "default-logo.svg"; // Place it in assets/bots/
  static _loginUrl = "https://example.com/";
  static _lock = new AsyncLock(); // AsyncLock for prompt requests

  constructor() {
    super();
  }

  /**
   * Check whether the bot is logged in, settings are correct, etc.
   * @returns {boolean} - true if the bot is available, false otherwise.
   * @sideeffect - Set this.constructor._isAvailable
   */
  async checkAvailability() {
    // Check:
    // 1. Whether the bot is logged in as needed
    // 2. Whether the bot settings are correct (e.g. API key is valid)
    // If yes:
    //   this.constructor._isAvailable = true;
    // else:
    //   this.constructor._isAvailable = false;

    this.constructor._isAvailable = true; // For simplicity, default to true
    return this.isAvailable(); // Always return like this
  }

  /**
   * Send a prompt to the bot and call onResponse(response, callbackParam)
   * when the response is ready.
   * @param {string} prompt
   * @param {function} onUpdateResponse params: callbackParam, Object {content, done}
   * @param {object} callbackParam - Just pass it to onUpdateResponse() as is
   */
  async _sendPrompt(prompt, onUpdateResponse, callbackParam) {
    return new Promise((resolve, reject) => {
      // Send the prompt to the bot and call onUpdateResponse() when the response is ready
      // onUpdateResponse(callbackParam, {content, done})
      //   callbackParam: Just pass it to onUpdateResponse() as is
      //   Object.content: Response text from the bot, even if it's not fully complete
      //   Object.done: true if the response is completed, false otherwise
      //
      // When everything is done, call resolve()
      // If there is an error, call reject(error)

      try {
        onUpdateResponse(callbackParam, {
          content: "Hello, world!",
          done: true,
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Should implement this method if the bot supports conversation.
   * The conversation structure is defined by the subclass.
   * @param null
   * @returns {any} - Conversation structure. null if not supported.
   */
  async createConversation() {
    return null;
  }
}

export class SlackBot {
  constructor({
    topics,
    user_token = slackUserToken,
    bot_user_id = botUserId,
    prompt = `以下list每个元素字符串的情绪转为emoji unicode值(\\U开头)，一行输出emoji字符串python list，不要换行，字符串用双引号扩起来`,
  }) {
    this.client = new WebClient(user_token);
    this.bot_user_id = bot_user_id;
    this.topics = topics;
    this.last = topics[topics.length - 1];
    this.data = '';
    this.prompt = prompt;
    this.d = {};
    if (!this.dm_channel_id) {
      console.log('Could not find DM channel with the bot.');
      return;
    }
  }

  async checkAvailability() {
    this.dm_channel_id = await this.find_direct_message_channel(this.bot_user_id);
    this.constructor._isAvailable = !!this.dm_channel_id; // For simplicity, default to true
    return this.isAvailable(); // Always return like this
  }

  async send_message(text) {
    try {
      return await this.client.chat.postMessage({
        text: text, 
        channel: this.dm_channel_id
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
      .filter(msg => msg.user === this.bot_user_id)
      .map(msg => msg.text);

    return data;
  }

  async get_new_messages(last_message_timestamp) {
    while (true) {
      const messages = await this.fetch_messages(last_message_timestamp);
      if (messages && !messages[messages.length - 1].endsWith('Typing…_')) {
        return messages[messages.length - 1];
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
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

    while (true) {
      let prompt;
      if (missing.length) {
        prompt = `${this.prompt}：${missing}`;
        this.last = missing[missing.length - 1];
      } else if (ini) {
        prompt = `${this.prompt}：${this.topics}`;
        ini = false;
      } else {
        prompt = '显示剩下的部分';
      }
      
      const new_message = await this.get_message(prompt);
      this.data += new_message;

      if (this.data.includes(this.last) || new_message.includes('抱歉,后续没有')) {
        const l = this.data.match(/".+?(?=,|\n)/g);

        for (const item of l) {
          const it = item.split(':');
          const ind = it.length === 3 ? 1 : 0;
          this.d[it[ind].slice(1, -1)] = it[ind + 1].trim().slice(1, -1);
        }

        missing = this.topics.filter(t => !this.d[t]);
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
    while (true) {
      const prompt = prompt('USER: ');
      const response = await this.send_message(prompt);
      if (response) {
        const last_message_timestamp = response.ts;
        const new_message = await this.get_new_messages(last_message_timestamp);
        console.log(`Claude: ${new_message}`);
      }
    }
  }
}
