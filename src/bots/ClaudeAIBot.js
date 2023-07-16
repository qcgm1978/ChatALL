import Bot from "@/bots/Bot";
import i18n from "@/i18n";
import AsyncLock from "async-lock";
import axios from "axios";
import queryString from "query-string";
import { SSE } from "sse.js";
/* 
利用 WebSocket 协议进行服务端主动推送更新通知,步骤如下:

前端打开到服务端的 WebSocket 长连接
前端通过 HTTP POST 请求提交数据或进行操作
操作完成后,服务端通过 WebSocket 连接主动推送一个更新通知
前端接收到更新通知事件后,发送 HTTP GET 请求获取最新数据
服务端响应 GET 请求,返回更新后的数据
前端使用新数据更新页面
*/
export default class ClaudeAIBot extends Bot {
  static _brandId = "claudeAI"; // Brand id of the bot, should be unique. Used in i18n.
  static _className = "ClaudeAIBot"; // Class name of the bot
  static _logoFilename = "anthropic_app_icon.png"; // Place it in public/bots/
  static _loginUrl = "https://claude.ai/login";
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
    await axios
      .get("https://statsig.anthropic.com/v1/rgstr")
      .then((response) => {
        if (response.success) {
            this.constructor._isAvailable = true;
        } else {
          this.constructor._isAvailable = false;
        }
      })
      .catch((error) => {
        console.error("Error ClaudeAIBot check login:", error);
        this.constructor._isAvailable = false;
      });
    return this.isAvailable(); // Always return like this
  }

  /**
   * Send a prompt to the bot and call onResponse(response, callbackParam)
   * when the response is ready.
   * @param {string} prompt
   * @param {function} onUpdateResponse params: callbackParam, Object {content, done}
   * @param {object} callbackParam - Just pass it to onUpdateResponse() as is
   */
  // eslint-disable-next-line
  async _sendPrompt(prompt, onUpdateResponse, callbackParam) {
    const context = await this.getChatContext();

    const config={"completion":{"prompt":"hello","timezone":"Asia/Shanghai","model":"claude-2","incremental":true},"organization_uuid":context.parent_id,"conversation_uuid":context.id,"text":"hello","attachments":[]}
    const prompterResponse = await axios.post(
      "https://claude.ai/api/append_message",
      config,
    );

    if (prompterResponse.status !== 200) {
      throw new Error(prompterResponse);
    }

    const assistantResponse = await axios.post(
      "https://open-assistant.io/api/chat/assistant_message",
      {
        chat_id: context.id,
        model_config_name: "OA_SFT_Llama_30B_6",
        content: prompt,
        parent_id: prompterResponse.data.id,
        plugins: [],
        sampling_parameters: {
          top_k: 50,
          top_p: 0.95,
          typical_p: null,
          temperature: 0.75,
          repetition_penalty: 1.2,
          max_new_tokens: 1024,
        },
      },
    );

    if (assistantResponse.status !== 200) {
      throw new Error(prompterResponse);
    }

    this.setChatContext({
      ...context,
      parent_id: assistantResponse.data.id, // save assistant response id for next prompt parent_id
    });

    const headers = {
      accept: "*/*",
    };
    const payload = {
      chat_id: context.id,
      message_id: assistantResponse.data.id,
    };
    return new Promise((resolve, reject) => {
      try {
        const source = new SSE(
          `wss://nexus-websocket-a.intercom.io/pubsub/5-KcWwmKiWOp_tzJYYsvdRzgOoX41WIvRiiAaPmhnRCsGT8R0l9GyE2ncDDzMMUWRh5LpRy_GQrEoq7g_r3fnwRKSZXZ1kwut8FGuU?X-Nexus-New-Client=true&X-Nexus-Version=0.10.0&user_role=undefined?${queryString.stringify(
            payload,
          )}`,
          {
            headers,
            withCredentials: true,
          },
        );
        let text = "";
        source.addEventListener("message", (event) => {
          let data;
          try {
            // handle event data: ": ping - 2023-07-14 13:28:17.735145"
            data = JSON.parse(event.data);
          } catch {
            return;
          }
          switch (data.event_type) {
            case "pending":
              onUpdateResponse(callbackParam, {
                content: i18n.global.t("openAssistant.queue", {
                  ...data,
                }),
                done: false,
              });
              break;
            case "token":
              text += data.text;
              onUpdateResponse(callbackParam, {
                content: text,
                done: false,
              });
              break;
            case "message":
              onUpdateResponse(callbackParam, {
                content: data.message.content, // full message
                done: true,
              });
              break;
            default:
              break;
          }
          resolve();
        });
        source.addEventListener("error", (event) => {
          console.error(event);
          reject(this.getSSEDisplayError(event));
        });
        source.stream();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Should implement this method if the bot supports conversation.
   * The conversation structure is defined by the subclass.
   * @param null
   * @returns {any} - Conversation structure. null if not supported.
   */
  async createChatContext() {
    let context = null;
    await axios.post("https://open-assistant.io/api/chat").then((response) => {
      if (response.status === 200) {
        context = {
          ...response.data,
        };
      }
    });
    return context;
  }
}
