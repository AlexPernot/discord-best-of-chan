import { ApplicationCommandOptionType } from "./types";

export const BESTOF_COMMAND = {
  name: "best-of",
  // Chat command
  type: 1,
  description: "Ranks a channel's most reacted messages on a given period.",
  options: [
    {
      // TODO : restrict channels
      name: "input_channel",
      description: "The channel where the messages will be read",
      type: ApplicationCommandOptionType.CHANNEL,
      required: true,
    },
    {
      name: "after",
      description:
        "Ranks messages after this date (format: YYYY-MM-DD HH:MM:SS)",
      type: ApplicationCommandOptionType.STRING,
      required: true,
    },
    {
      name: "before",
      description:
        "Ranks messages before this date (format: YYYY-MM-DD HH:MM:SS). Defaults to current date",
      type: ApplicationCommandOptionType.STRING,
    },
    {
      // TODO : restrict channels
      name: "output_channel",
      description:
        "The channel where the ranking will be posted. Defaults to the channel where the command is used",
      type: ApplicationCommandOptionType.CHANNEL,
    },
  ],
};
