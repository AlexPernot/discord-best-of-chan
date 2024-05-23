import { Discord, Env } from "./types";
import { api } from "./api";

type MessageMapItem = {
  msgId: string;
  reactionTotal: number;
  content: string;
};

// Milliseconds since Discord Epoch, the first second of 2015
const DISCORD_EPOCH = 1420070400000;

function getTimestampFromSnowflake(snowflake: string) {
  return (BigInt(snowflake) >> BigInt(22)) + BigInt(DISCORD_EPOCH);
}

function makeSnowflakeFromTimestamp(timestamp: number) {
  return "" + ((BigInt(timestamp) - BigInt(DISCORD_EPOCH)) << BigInt(22));
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

      if (beforeSnowflake) {
        for (let i = 0; i < res.length; i++) {
          const msg = res[i];
          if (Number(msg.id) > Number(beforeSnowflake)) {
            res = res.slice(0, i);
            continueFetching = false;
            break;
          }
        }
      }

      if (res.length === 0) {
        continueFetching = false;
      } else {
        after = res[res.length - 1].id;
      }

      yield res;
    } catch (e) {
      console.error(e);
    }
  }
}

export async function handleInteraction(
  interaction: Discord.Interaction,
  env: any,
): Promise<string> {
  //console.log(interaction.data);

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
          msgId: msg.id,
          reactionTotal: reactionsTotal,
          content: msg.content,
        });
      }
    }
  }

  // 4. Order reactions (keep 5 top messages)

  // 5. format & return messages

  return JSON.stringify(messagesMap);
}
