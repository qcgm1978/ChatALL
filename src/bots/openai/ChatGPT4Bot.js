import axios from "axios";
import store from "@/store";
import i18n from "@/i18n";
import ChatGPTBot from "./ChatGPTBot";

export default class ChatGPT4Bot extends ChatGPTBot {
  static _className = "ChatGPT4Bot"; // Class name of the bot
  static _logoFilename = "chatgpt-4-logo.png"; // Place it in public/bots/
  static _model = "gpt-4";

  constructor() {
    super();
  }

  async confirmBeforeUsing(confirmModal) {
    if (
      store.state.chatgpt.riskConfirmed ||
      (this.constructor._model !== "gpt-4" &&
        this.constructor._model !== "gpt-4-browsing" &&
        this.constructor._model !== "gpt-4-mobile")
    )
      return true;

    const confirmed = await confirmModal.showModal(
      i18n.global.t("chatGpt.riskWarningTitle"),
      i18n.global.t("chatGpt.riskWarningText"),
    );

    store.state.chatgpt.riskConfirmed = confirmed;
    return confirmed;
  }

  async checkAvailability() {
    const reserved = this.constructor._isAvailable; // To supress the availablity changing
    const isAvailable = await super.checkAvailability();
    if (this.getClassname() == 'ChatGPTBrowsingBot') {
      this.constructor._isAvailable = isAvailable;
    }else if (isAvailable) {
      this.constructor._isAvailable = reserved;
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        };
        const response = await axios.get(
          "https://chat.openai.com/backend-api/accounts/check",
          { headers },
        );
        const isPaidSubscriptionActive =
          response.data.account_plan.is_paid_subscription_active;
        this.constructor._isAvailable = isPaidSubscriptionActive;
      } catch (error) {
        console.error("Error fetching paid status:", error);
        this.constructor._isAvailable = false;
      }
    } else {
      this.constructor._isAvailable = false;
    }
    return this.isAvailable();
  }
}
