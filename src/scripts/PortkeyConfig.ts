export const PortkeyConfig = {
  basePath: "https://api.portkey.ai/v1/proxy",
  baseOptions: {
    headers: {
      "x-portkey-api-key": process.env.PORTKEY_API_KEY,
      "x-portkey-mode": "proxy openai",
    },
  }
}