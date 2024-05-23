export interface Env {
  DISCORD_APPLICATION_ID: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_TOKEN: string;
}

export namespace Discord {
  export enum ApplicationCommandOptionType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4, // Any integer between -2^53 and 2^53
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7, // Includes all channel types + categories
    ROLE = 8,
    MENTIONABLE = 9, // Includes users and roles
    NUMBER = 10, // Any double between -2^53 and 2^53
    ATTACHMENT = 11,
  }

  export type User = {
    avatar: string;
    discriminator: string;
    id: string;
    public_flags: number;
    username: string;
  };

  export type Member = {
    avatar: string | null;
    deaf: boolean;
    is_pending: boolean;
    joined_at: string;
    mute: boolean;
    nick: string | null;
    pending: boolean;
    permissions: string;
    premium_since: string | null;
    roles: string[];
    user?: User;
  };

  export type Channel = {
    flags: number;
    guild_id: string;
    icon_emoji: { id: string | null; name: string };
    id: string;
    last_message_id: string;
    name: string;
    nsfw: boolean;
    parent_id: string;
    permissions: string;
    position: number;
    rate_limit_per_user: number;
    theme_color: string | null;
    topic: string | null;
    type: number;
  };

  export type CommandOption = {
    name: string;
    value: string;
    type: ApplicationCommandOptionType;
  };

  export type InteractionData = {
    id: string;
    name: string;
    options?: CommandOption[];
    resolved?: {
      members?: {
        [id: string]: Member;
      };
      users?: {
        [id: string]: User;
      };
      channels?: {
        [id: string]: Channel;
      };
    };
    target_id: string;
    type: number;
  };

  export type Interaction = {
    application_id: string;
    channel_id: string;
    data: InteractionData;
    guild_id: string;
    guild_locale: string;
    app_permissions: string;
    id: string;
    locale: string;
    member: Member;
    token: string;
    type: number;
    version: number;
  };

  export type Reactions = {
    emoji: { id: null; name: string };
    count: number;
    count_details: { burst: number; normal: number };
    burst_colors: [];
    me_burst: boolean;
    burst_me: boolean;
    me: boolean;
    burst_count: number;
  };

  export type Message = {
    type: number;
    channel_id: string;
    content: string;
    attachments: [];
    embeds: [];
    timestamp: string;
    edited_timestamp: null;
    flags: number;
    components: [];
    id: string;
    author: User;
    mentions: [];
    mention_roles: [];
    pinned: boolean;
    mention_everyone: boolean;
    tts: boolean;
    reactions: Reactions[];
  };
}
