import { Discord } from "./types";

export const BESTOF_COMMAND = {
  name: "best-of",
  // Chat command
  type: 1,
  description: "Ranks a channel's most reacted messages on a given period.",
  options: [
    {
      name: "input_channel",
      description: "The channel where the messages will be read",
      type: Discord.ApplicationCommandOptionType.CHANNEL,
      required: true,
      // Only allow public channels & threads
      channel_types: [0, 11],
    },
    {
      name: "after",
      description:
        "Ranks messages after this date (format: YYYY-MM-DD HH:MM:SS)",
      type: Discord.ApplicationCommandOptionType.STRING,
      required: true,
    },
    {
      name: "before",
      description:
        "Ranks messages before this date (format: YYYY-MM-DD HH:MM:SS). Defaults to current date",
      type: Discord.ApplicationCommandOptionType.STRING,
    },
    {
      name: "output_channel",
      description:
        "The channel where the ranking will be posted. Defaults to the channel where the command is used",
      type: Discord.ApplicationCommandOptionType.CHANNEL,
      // Only allow public channels
      channel_types: [0],
    },
  ],
};
