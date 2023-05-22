<template>
  <v-list-subheader>{{ bot.getBrandName() }}</v-list-subheader>
  <v-list-item>
    <v-list-item-title>SLACK_USER_TOKEN & BOT_USER_ID</v-list-item-title>
    <v-list-item-subtitle>{{
      $t("settings.secretPrompt")
    }}</v-list-item-subtitle>
    <v-text-field
      v-model="claudeInSlack.slackUserToken"
      outlined
      dense
      hide-details
      label="SLACK_USER_TOKEN"
      :placeholder="'应用程序可以通过OAuth授权流程向Slack API发送请求。在授权过程中，将会提供一个SLACK_USER_TOKEN，形如：xoxp-rqGemDwWZdalj-9CVAE2bWaOkeB-OACaQYKWnrzBlZYsDDopAYyVEPKNqjVwj'"
      @change="setSlackUserToken($event.target.value)"
    ></v-text-field>
    <v-text-field
      v-model="claudeInSlack.botUserId"
      outlined
      dense
      hide-details
      label="BOT_USER_ID"
      :placeholder="'Claude App页面点击对话上方的Claude图表弹出窗口中的Member ID：U1FSPFC4J6L'"
      @change="setBotUserId($event.target.value)"
    ></v-text-field>
  </v-list-item>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import Bot from "@/bots/ClaudeInSlackBot";
export default {
  data() {
    return {
      bot: Bot.getInstance(),
    };
  },
  methods: {
    ...mapMutations(["setClaudeInSlack"]),
    setSlackUserToken(value) {
      this.setClaudeInSlack({
        ...this.claudeInSlack,
        slackUserToken: value,
      });
    },
    setBotUserId(value) {
      this.setClaudeInSlack({
        ...this.claudeInSlack,
        botUserId: value,
      });
    },
  },
  computed: {
    ...mapState(["claudeInSlack"]),
  },
};
</script>
