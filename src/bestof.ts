import { Discord, Env } from "./types";
import { api } from "./api";
import Interaction = Discord.Interaction;

type MessageMapItem = {
  id: string;
  url: string;
  reactionTotal: number;
  content: string;
};

// Milliseconds since Discord Epoch, the first second of 2015
const DISCORD_EPOCH = 1420070400000;

// How many top messages we want to keep
const BESTOF_COUNT = 5;

// Messages with length over this will be truncated with an ellipsis
const MESSAGE_PREVIEW_LENGTH = 50;

const DEFAUT_LOCALE = "fr";

function getTimestampFromSnowflake(snowflake: string) {
  return (BigInt(snowflake) >> BigInt(22)) + BigInt(DISCORD_EPOCH);
}

function makeSnowflakeFromTimestamp(timestamp: number) {
  return "" + ((BigInt(timestamp) - BigInt(DISCORD_EPOCH)) << BigInt(22));
}

function sortAndLimitMessagesByReactionCount(messages: MessageMapItem[]) {
  // Naive implementation for now since we will likely not have a huge collection of messages *with reactions*
  const sortedMessages = messages.sort((a, b) => {
    if (a.reactionTotal > b.reactionTotal) {
      return -1;
    } else if (a.reactionTotal < b.reactionTotal) {
      return 1;
    }

    if (Number(a.id) > Number(b.id)) {
      return 1;
    } else if (Number(b.id) > Number(a.id)) {
      return -1;
    }

    return 0;
  });

  return sortedMessages.slice(0, BESTOF_COUNT);
}

function getInputChannelUrl(interaction: Interaction) {
  const inputChannelId = interaction.data.options?.find(
    (option) => option.name === "input_channel",
  )?.value;

  if (!inputChannelId) {
    throw new Error("Could not find input channel parameter.");
  }

  return `https://discord.com/channels/${interaction.guild_id}/${interaction.data.resolved?.channels?.[inputChannelId].id || ""}`;
}

function formatDateParameters(interaction: Interaction) {
  let str = "";

  const afterInput = interaction.data.options?.find(
    (option) => option.name === "after",
  )?.value;

  if (!afterInput) {
    throw new Error("Could not find after date parameter.");
  }

  const after = new Date(afterInput);

  const beforeInput = interaction.data.options?.find(
    (option) => option.name === "before",
  )?.value;

  const before = beforeInput ? new Date(beforeInput) : undefined;

  if (before) {
    str += `entre le ${after.toLocaleDateString(DEFAUT_LOCALE)} et le ${before.toLocaleDateString(DEFAUT_LOCALE)}`;
  } else {
    str += `à partir du ${after.toLocaleDateString(DEFAUT_LOCALE)}`;
  }

  return str;
}

function formatMessage(message: MessageMapItem) {
  if (message.content.length <= MESSAGE_PREVIEW_LENGTH) return message.content;

  return message.content.slice(0, MESSAGE_PREVIEW_LENGTH) + "...";
}

function formatMessages(interaction: Interaction, messages: MessageMapItem[]) {
  let str = `### ✨ Top des messages ${formatDateParameters(interaction)} dans ${getInputChannelUrl(interaction)} ✨\n`;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    str += `${i + 1}. [${formatMessage(message)}](${message.url}) (${message.reactionTotal} réaction${message.reactionTotal > 1 ? "s" : ""})\n`;
  }

  return str;
}

async function* fetchNextMessageBatch(
  env: Env,
  channelId: string,
  afterSnowflake: string,
  beforeSnowflake?: string,
) {
  let after = afterSnowflake;
  let continueFetching = true;

  while (continueFetching) {
    try {
      let res = (await api(
        env,
        `/channels/${channelId}/messages?limit=100&after=${after}`,
      )) as Discord.Message[];

      const filteredRes = beforeSnowflake
        ? res.filter((msg) => Number(msg.id) < Number(beforeSnowflake))
        : res;

      if (filteredRes.length === 0 || res.length !== filteredRes.length) {
        continueFetching = false;
      } else {
        // Find last message: the one with the biggest id
        const lastMessage = filteredRes.reduce(
          (prev, curr) => (BigInt(prev.id) > BigInt(curr.id) ? prev : curr),
          filteredRes[0],
        );
        after = lastMessage.id;
      }

      yield filteredRes;
    } catch (e) {
      console.error(e);
    }
  }
}

export async function handleInteraction(
  interaction: Discord.Interaction,
  env: any,
): Promise<string> {
  const inputChannelId = interaction.data.options?.find(
    (option) => option.name === "input_channel",
  )?.value;

  if (!inputChannelId) {
    throw new Error("Could not find input channel parameter.");
  }

  const after = interaction.data.options?.find(
    (option) => option.name === "after",
  )?.value;

  if (!after) {
    throw new Error("Could not find after date parameter.");
  }

  const afterTimestamp = new Date(after).getTime();

  const before = interaction.data.options?.find(
    (option) => option.name === "before",
  )?.value;

  const beforeTimestamp = before ? new Date(before).getTime() : undefined;

  const messagesMap: MessageMapItem[] = [];

  // 1. Get messages for the input channel via REST. In query, filter by date
  const msgBatchIter = fetchNextMessageBatch(
    env,
    inputChannelId,
    makeSnowflakeFromTimestamp(afterTimestamp),
    beforeTimestamp ? makeSnowflakeFromTimestamp(beforeTimestamp) : undefined,
  );

  for await (const msgBatch of msgBatchIter) {
    for (const msg of msgBatch) {
      // 2. For each message, count the reactions
      let reactionsTotal = 0;

      for (const reaction of msg.reactions) {
        reactionsTotal += reaction.count;
      }

      if (reactionsTotal > 0) {
        messagesMap.push({
          id: msg.id,
          url: `https://discord.com/channels/${interaction.guild_id}/${msg.channel_id}/${msg.id}`,
          reactionTotal: reactionsTotal,
          content: msg.content,
        });
      }
    }
  }

  if (messagesMap.length === 0) {
    return `Aucun message avec réaction n'a été trouvé ${formatDateParameters(interaction)} dans ${getInputChannelUrl(interaction)}`;
  }

  // 4. Order reactions and keep top messages
  const sortedMessages = sortAndLimitMessagesByReactionCount(messagesMap);

  // 5. format & return messages
  return formatMessages(interaction, sortedMessages);
}
