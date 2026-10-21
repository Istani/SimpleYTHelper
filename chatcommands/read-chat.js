#!/usr/bin/env node
"use strict";

/*
 * Read-only Socket.IO client for the kw.media chat feed.
 *
 * Usage:
 *   node chatcommands/read-chat.js <channel-id> [--url https://127.0.0.1:3005]
 *        [--origin https://kw.media] [--timeout 60] [--no-history]
 *
 * It only joins the selected channel and prints `log` (last 15 messages) and
 * `chat` (new messages). It never sends chat messages or commands.
 */

const io = require("socket.io-client");

function usage(exitCode) {
  const text = [
    "Usage: node chatcommands/read-chat.js <channel-id> [options]",
    "",
    "Options:",
    "  --url <url>         Socket endpoint (default: https://127.0.0.1:3005)",
    "  --origin <origin>   Origin sent to the socket server (default: https://kw.media)",
    "  --timeout <seconds> Stop after this many seconds (default: run until Ctrl+C)",
    "  --no-history        Do not print the initial `log` history",
    "  --help              Show this help"
  ].join("\n");
  console[exitCode === 0 ? "log" : "error"](text);
  process.exit(exitCode);
}

const args = process.argv.slice(2);
let channel = null;
let url = "https://127.0.0.1:3005";
let origin = "https://kw.media";
let timeoutSeconds = null;
let showHistory = true;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--help" || arg === "-h") usage(0);
  if (arg === "--no-history") {
    showHistory = false;
    continue;
  }
  if (["--url", "--origin", "--timeout"].includes(arg)) {
    const value = args[++i];
    if (!value) usage(1);
    if (arg === "--url") url = value;
    if (arg === "--origin") origin = value;
    if (arg === "--timeout") {
      timeoutSeconds = Number(value);
      if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
        console.error("--timeout must be a positive number of seconds.");
        process.exit(1);
      }
    }
    continue;
  }
  if (arg.startsWith("-")) usage(1);
  if (channel) usage(1);
  channel = arg;
}

if (!channel) usage(1);

function print(kind, message) {
  const stamp = message.created_at || new Date().toISOString();
  const service = message.service || "unknown";
  const author = message.user_name || message.user || "unknown";
  const content = message.content || "";
  console.log(`[${kind}] ${stamp} ${service} ${author}: ${content}`);
}

console.log(`Connecting read-only to ${url}; channel: ${channel}`);
const socket = io(url, {
  transports: ["websocket", "polling"],
  reconnection: true,
  rejectUnauthorized: false, // local 127.0.0.1 does not match the public TLS certificate
  extraHeaders: { Origin: origin }
});

socket.on("connect", () => {
  console.log(`Connected (${socket.id}); joining ${channel}.`);
  socket.send("join", channel);
});
socket.on("log", message => {
  if (showHistory) print("history", message);
});
socket.on("chat", message => print("chat", message));
socket.on("connect_error", error =>
  console.error(`Connection error: ${error.message}`)
);
socket.on("error", error => console.error(`Socket error: ${error}`));
socket.on("disconnect", reason => console.log(`Disconnected: ${reason}`));

function stop(code) {
  console.log("Stopping read-only client.");
  socket.close();
  process.exit(code);
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
if (timeoutSeconds !== null) setTimeout(() => stop(0), timeoutSeconds * 1000);
