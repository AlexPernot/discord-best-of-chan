import { Env } from "./types";

const BASE_URL = "https://discord.com/api";
const API_VERSION_NUMBER = 10;

export async function api(
  env: Env,
  route: string,
  method: string = "GET",
  body: any = undefined,
) {
  const url = `${BASE_URL}/v${API_VERSION_NUMBER}${route}`;

  return fetch(url, {
    headers: {
      Authorization: `Bot ${env.DISCORD_TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "DiscordBot (BestOfFetch, 1.0)",
    },
    method: method,
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((err) => console.error(err));
}
