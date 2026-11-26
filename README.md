# NNIC Assist

NNIC Assist provides Live AI directly on GitHub Pages and a guided conversation demo that also runs offline. It contains the CAPPI, DRATF refurbishment, and A-SMGCS walkthroughs, progressive responses, local chat history, and three formatted PDF briefs.

## Run without installing anything

1. On GitHub, select **Code → Download ZIP**.
2. Extract the ZIP to a folder on your computer.
3. Double-click **index.html** to open it in Chrome or Edge.
4. Start a new conversation. Press **Tab** to fill the suggested question and **Enter** to send it.
5. Follow the nine-turn walkthrough. Use each document card to open or download the PDF.

Keep the reports folder beside index.html for the three PDF links. React, icons, styles, scripts and the chart are included in the HTML. After downloading, no internet, API key, Node.js, Python, installation, or local server is required. There are no external fonts or CDN requests at startup. The downloaded HTML opens in Guided demo.

If your computer associates HTML with another program, right-click the file and choose **Open with → Google Chrome / Microsoft Edge**. A mobile device can use **Use suggestion** instead of Tab. The button beside NNIC Assist shows or hides navigation. On a desktop, the browser remembers that preference when local storage is available.

Guided history is saved locally in this browser where supported. Browsers may restrict localStorage or clipboard access for file:// pages. Moving the HTML file may start a separate history. You can still select and copy text manually and download the conversation. No conversations are stored in this repository.

## What this edition does

On GitHub Pages, Live AI uses the workspace login, shared CAAP Works references and shared request allowance. The backend keeps the OpenAI key and handles model calls. The visible conversation stays in tab memory and clears on refresh, sign-out or tab close. The backend keeps the latest reply with the authenticated session so you can ask for a rewrite or summary. Signing out deletes the session record. The offline guided walkthrough includes prepared responses and PDF briefs.

The guided chat also answers short public questions about CAAP and common aviation terms. It includes clickable official references and supports follow-up questions about air navigation and pilot licensing. Other questions receive a few relevant conversation options. In Live AI on either site, a factual question checks the shared workspace references first. If they cannot support an answer, the chat says so and tries a brief public web search. Click a numbered citation to open its source. You can also ask directly for a web lookup. An unfamiliar topic may use one model request to prepare the search and another to run it. Private reference passages stay out of web searches, and a public page cannot establish an unpublished project decision.

## Edit and rebuild (developers)

Install Node.js 22 or newer. Internet is needed for the first dependency installation:

```sh
npm install
npm run build
```

Then reopen **index.html**. Once the dependencies are installed, rebuilding can run offline. End users do not need to run these commands.

- `src/App.tsx`: chat interface and keyboard behavior
- `src/lib/guided.ts`: nine-turn script, prepared replies, and PDF mapping
- `src/lib/project-demos.ts`: project prompt library
- `src/styles.css`: self-contained application CSS
- `reports/`: PDF briefs linked from the demo
- `build.mjs`: bundles the app into the Pages entry point

The GitHub Pages frontend connects directly to the existing API at https://nnic-assist.mervyn27.chatgpt.site. Credentials, private references and model code belong on that server.

## Presentation flow

CAPPI status → checklist bar chart → PDF brief → DRATF progress → BOQ review → PDF brief → A-SMGCS review → vendor evidence → PDF brief.

## GitHub Pages

Open [Live AI on GitHub Pages](https://mervyn15.github.io/nnic-assist/?mode=live) and sign in using the workspace account. The chat, settings and reference files open inside GitHub Pages. Select the mode beside NNIC Assist or under Settings to switch. The root entry point remembers a mode selected on this browser. Explicit mode links take precedence.

For presentations, use the [guided demo](https://mervyn15.github.io/nnic-assist/?mode=guided). The second CAPPI question shows a bar chart of 14 checklist items. Both HTML builds support the chart and all three PDF briefs.

The repository publishes from the main branch root. Run the build before publishing source changes. Only the public HTTPS Pages origin can connect to the hosted API. Local HTML files open the offline guided workspace.
