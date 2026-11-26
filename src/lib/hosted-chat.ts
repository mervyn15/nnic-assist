export const hostedLiveChatUrl = 'https://nnic-assist.mervyn27.chatgpt.site/?mode=live';

export function shouldCheckHostedChat(url: URL) {
  return url.origin === 'https://mervyn15.github.io'
    && /^\/nnic-assist\/(index\.html)?$/.test(url.pathname)
    && url.searchParams.get('mode') !== 'guided';
}

export async function isHostedChatConfigured() {
  const response = await fetch(new URL('/api/status', hostedLiveChatUrl), {
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(2500),
  });
  return response.ok && (await response.json()).live === true;
}
