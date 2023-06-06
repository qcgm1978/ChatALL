<template>
  <div class="bot-logos margin-bottom">
    <v-select
      :items="botsOptions"
      item-title="name"
      item-value="id"
      hide-details
      :model-value="selectedOptions"
      multiple
      @update:model-value="toggleSelected($event)"
    ></v-select>
  </div>
    <footer>
      <v-textarea
        v-model="prompt"
        auto-grow
        max-rows="8.5"
        rows="1"
        density="comfortable"
        hide-details
        variant="solo"
        :placeholder="$t('footer.promptPlaceholder')"
        autofocus
        @keydown="filterEnterKey"
        style="min-width: 390px"
      ></v-textarea>
      <v-btn
        color="primary"
        elevation="2"
        class="margin-bottom"
        :disabled="
          prompt.trim() === '' || Object.values(activeBots).every((bot) => !bot)
        "
        @click="sendPromptToBots"
      >
        {{ $t("footer.sendPrompt") }}
      </v-btn>
    </footer>
    <MakeAvailableModal
      v-model:open="isMakeAvailableOpen"
      :bot="clickedBot"
      @done="checkAllBotsAvailability(clickedBot)"
    />

</template>

<script setup>
import { ref, computed, onBeforeMount, reactive } from "vue";
import { useStore } from "vuex";
import i18n from "../../i18n";

import _bots from "@/bots";
import MakeAvailableModal from "@/components/MakeAvailableModal.vue";

const props = defineProps(["changeColumns", ]);
const store = useStore();
const bots = ref(_bots.all);
const bots_val = bots.value.map((d) => ({
  logo: d.getLogo(),
  fullname: d.getFullname(),
  name: d.getFullname(),
  classname: d.getClassname(),
  id: d.getClassname(),
  isSelected: false,
}));
const botsOptions = computed((_) => bots_val);
const selectedOptions = computed((_) =>
  bots_val.filter((d) =>
    Object.keys(store.state.selectedBots)
      .filter((k) => store.state.selectedBots[k])
      .includes(d.classname),
  ),
);
const activeBots = reactive({});
const prompt = ref("");
const selectedBots = computed(() => store.state.selectedBots);
const clickedBot = ref(null);
const isMakeAvailableOpen = ref(false);
const confirmModal = ref(null);
const setBotSelected = (uuid) => store.commit("SET_BOT_SELECTED", uuid);
function toggleSelected(botIds) {
  bots_val.forEach(({ id }) => {
    setBotSelected({ botId: id, selected: botIds.includes(id) });
  });
  checkAllBotsAvailability();
}

async function checkAllBotsAvailability(specifiedBot = null) {
  try {
    let botsToCheck = bots.value.filter(
      (bot) => store.state.selectedBots[bot.getClassname()],
    );
    if (specifiedBot) {
      // If a bot is specified, only check bots of the same brand
      botsToCheck = botsToCheck.filter(
        (bot) => bot.constructor._brandId === specifiedBot.constructor._brandId,
      );
    }
    const checkAvailabilityPromises = botsToCheck.map((bot) =>
      bot
        .checkAvailability()
        .then(() => updateActiveBots())
        .catch((error) => {
          isMakeAvailableOpen.value = true;
          console.error(
            `Error checking login status for ${bot.getFullname()}:`,
            error,
          );
        }),
    );
    await Promise.allSettled(checkAvailabilityPromises).then(adaptColumns);
  } catch (error) {
    console.error("Error checking login status for bots:", error);
  }
}
function adaptColumns(ps) {
  const num = ps.map((d) => d.status == "fulfilled").length;
  props.changeColumns(num >= 3 ? 3 : num);
}

function updateActiveBots() {
  for (const bot of bots.value) {
    activeBots[bot.getClassname()] =
      bot.isAvailable() && selectedBots.value[bot.getClassname()];
  }
}

// Send the prompt when the user presses enter and prevent the default behavior
// But if the shift, ctrl, alt, or meta keys are pressed, do as default
function filterEnterKey(event) {
  if (
    event.keyCode == 13 &&
    !event.shiftKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey
  ) {
    event.preventDefault();
    sendPromptToBots();
  }
}

function sendPromptToBots() {
  if (prompt.value.trim() === "") return;
  if (Object.values(activeBots).every((bot) => !bot)) return;

  const toBots = bots.value.filter((bot) => activeBots[bot.getClassname()]);

  store
    .dispatch("sendPrompt", {
      prompt: prompt.value,
      bots: toBots,
    })
    .then((that) => {
      confirmErrorBot(that);
    });

  // Clear the textarea after sending the prompt
  prompt.value = "";
}
async function confirmErrorBot(that) {
  let failed = [];
  Promise.allSettled(that)
    .then((results) => {
      for (let result of results) {
        if (result.status === "fulfilled") {
          // 处理resolve的Promise
        } else {
          // 处理reject的Promise
          const bot = result.reason;
          const fullName = bot.getFullname();
          const classname = bot.getClassname();
          failed.push({ fullName, classname });
        }
      }
      return failed;
    })
    .then(async (data) => {
      if (data.length) {
        const names = data.map((d) => d.fullName).join(",");
        const err = i18n.global.t("error.failedConnectUrl", {
          url: names,
        });
        const msg = i18n.global.t("header.clearBot");
        const result = await confirmModal.value.showModal(
          `${err}\n${msg}`,
          500,
        );
        if (result) {
          data.forEach((d) => {
            setBotSelected({ botId: d.classname, selected: false });
          });
          updateActiveBots();
        }
      }
    });
}


onBeforeMount(() => {
  checkAllBotsAvailability();
});
</script>

<style>
footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: transparent;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: 8px 16px;
    gap: 8px;
    box-sizing: border-box;
}

.bot-logos {
  position: relative;
  top: -120px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.bot-logos img {
    opacity: 0.3;
    width: 36px;
    height: 36px;
    cursor: pointer;
}

img.selected {
    opacity: 1;
}

.margin-bottom {
    margin-bottom: 5px;
}

/* Override default style of vuetify v-textarea */
.v-textarea--auto-grow textarea{
    overflow: auto !important;
}
</style>
