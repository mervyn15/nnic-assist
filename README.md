# NNIC Assist

An offline edition of the NNIC Assist guided conversation demo. It contains the CAPPI, DRATF refurbishment, and A-SMGCS walkthroughs, progressive responses, local chat history, and three formatted PDF briefs.

## Run without installing anything

1. On GitHub, select **Code → Download ZIP**.
2. Extract the ZIP to a folder on your computer.
3. Double-click **index.html** to open it in Chrome or Edge.
4. Start a new conversation. Press **Tab** to fill the suggested question and **Enter** to send it.
5. Follow the nine-turn walkthrough. Use each document card to open or download the PDF.

Keep the reports folder beside index.html for the three PDF links. React, icons, styles, scripts and the chart are included in the HTML. After downloading, no internet, API key, Node.js, Python, installation, or local server is required. There are no external fonts or CDN requests at startup. GitHub Pages and the downloaded HTML both open in Guided demo. **Settings → Continue guided demo** returns to the local conversation. Only **Open hosted live chat** opens the hosted site, in a new tab. No demo messages are transferred.

If your computer associates HTML with another program, right-click the file and choose **Open with → Google Chrome / Microsoft Edge**. A mobile device can use **Use suggestion** instead of Tab. The button beside NNIC Assist shows or hides navigation. On a desktop, the browser remembers that preference when local storage is available.

History is stored only in the browser where supported. Browsers may restrict localStorage or clipboard access for file:// pages. Moving the HTML file may start a separate history. You can still select and copy text manually and download the conversation. No conversations are stored in this repository.

## What this edition does

This is a controlled, scripted walkthrough, not live AI or a connection to project systems. Project scenarios are presentation material, not verified current project records. The PDF cards open existing prepared briefs in the reports folder. No API calls or paid usage are enabled. There is no database or cloud sync.

Questions outside the three guided topics get a message explaining how to check the records in live chat. For a follow-up, the conversation remembers the last recognized project until you change topics.

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

The live hosted site remains at https://nnic-assist.mervyn27.chatgpt.site. This repository is an offline frontend edition, not an automatic deployment source for that site. Hosting integration, credentials, and server-side OpenAI code are intentionally excluded from this offline edition.

## Presentation flow

CAPPI status → checklist bar chart → PDF brief → DRATF progress → BOQ review → PDF brief → A-SMGCS review → vendor evidence → PDF brief.

## GitHub Pages

Open [NNIC Assist on GitHub Pages](https://mervyn15.github.io/nnic-assist/) to start the demo. No hosted-service check runs on startup. The second suggested CAPPI question displays a built-in bar chart of the 14 checklist items named in the walkthrough. The bars count checklist items, not project progress.

The root `index.html` is the GitHub Pages entry point. `npm run build` updates this file. The previous standalone `NNIC-Assist-Offline.html` with embedded PDFs remains available; use `index.html` for the chart walkthrough.

To publish when Pages is available for this repository: open Settings > Pages, choose Deploy from a branch, and select `main` with `/ (root)`. The site needs no API key or backend.

The demo uses system fonts. The build checks CSS syntax and rejects external stylesheet dependencies.
