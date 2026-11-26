import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {hostedLiveChatUrl, isHostedChatConfigured, shouldCheckHostedChat} from './lib/hosted-chat';

async function start() {
  const container = document.getElementById('root')!;
  if (shouldCheckHostedChat(new URL(window.location.href))) {
    const status = document.createElement('p');
    status.className = 'startup-status';
    status.setAttribute('role', 'status');
    status.textContent = 'Opening NNIC Assist…';
    container.replaceChildren(status);
    try {
      if (await isHostedChatConfigured()) {
        window.location.replace(hostedLiveChatUrl);
        return;
      }
    } catch {
      // The guided workspace can run even if the hosted service is unavailable.
    }
  }
  createRoot(container).render(<App/>);
}

void start();
