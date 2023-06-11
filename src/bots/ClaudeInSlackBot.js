import AsyncLock from "async-lock";
// const { ipcRenderer } = require('electron')
const { ipcRenderer } = window.require("electron");
import Bot from "@/bots/Bot";
// main process event IPC channel
// const SLACK_EVENT_CHANNEL = 'slack-event'
const SLACK_CALL_CHANNEL = "slack-call";
export default class ClaudeInSlackBot extends Bot {
  static _brandId = "ClaudeInSlack"; // Brand id of the bot, should be unique. Used in i18n.
  static _className = "ClaudeInSlackBot"; // Class name of the bot
  static _logoFilename = "slack.svg"; // Place it in assets/bots/
  static _loginUrl = "https://example.com/";
  static _lock = new AsyncLock(); // AsyncLock for prompt requests
  // todo 根据此prompt进行数据存储
  static_save_data_prompt = "这句话不要回复，也不要进行任何解释：";
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

    // example call method of Slack in renderer
    try {
      await this.slackSendMessage();
    } catch (e) {
      print(e);
    }

    this.constructor._isAvailable = true; // For simplicity, default to true
    return this.isAvailable(); // Always return like this
  }
  async slackSendMessage(messageObject) {
    try {
      // ipcRenderer.invoke("get-webhook", 'hello1');
      // console.log("Slack message sent successfully!");
    } catch (error) {
      console.error("Error while sending message to Slack:", error);
    }
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
        const url = `http://127.0.0.1:8010/ask_claude?prompt=${encodeURIComponent(
          prompt,
        )}`;
        fetch(url)
          .then((res) => res.json())
          .then((answer) => {
            onUpdateResponse(callbackParam, {
              content: answer,
              done: true,
            });
            resolve();
          });
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
