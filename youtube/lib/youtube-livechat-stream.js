"use strict";

const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const googleProtoFiles = require("google-proto-files");

const PROTO_PATH = path.join(__dirname, "proto", "stream_list.proto");
const TARGET = "dns:///youtube.googleapis.com:443";
const TERMINAL_STATUS_CODES = new Set([
  grpc.status.NOT_FOUND,
  grpc.status.PERMISSION_DENIED,
  grpc.status.FAILED_PRECONDITION
]);

function loadService() {
  const definition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: false,
    oneofs: true,
    includeDirs: [googleProtoFiles.getProtoPath("..")]
  });
  return grpc.loadPackageDefinition(definition).youtube.api.v3
    .V3DataLiveChatMessageService;
}

class YouTubeLiveChatStream {
  constructor(options) {
    this.liveChatId = options.liveChatId;
    this.getAccessToken = options.getAccessToken;
    this.onResponse = options.onResponse;
    this.onTerminalError = options.onTerminalError || (() => {});
    this.onReconnect = options.onReconnect || (() => {});
    this.reconnectDelayMs = options.reconnectDelayMs || 5000;
    this.maxReconnectDelayMs = options.maxReconnectDelayMs || 60000;
    this.pageToken = options.pageToken || "";
    this.closed = false;
    this.call = null;
    this.timer = null;
    this.attempt = 0;
    const Service = loadService();
    this.client = new Service(TARGET, grpc.credentials.createSsl());
  }

  start() {
    this.connect();
  }

  stop() {
    this.closed = true;
    clearTimeout(this.timer);
    if (this.call) this.call.cancel();
    this.client.close();
  }

  async connect() {
    if (this.closed) return;
    let accessToken;
    try {
      accessToken = await this.getAccessToken();
    } catch (error) {
      return this.scheduleReconnect(error);
    }
    if (!accessToken)
      return this.scheduleReconnect(new Error("Missing OAuth access token"));

    const metadata = new grpc.Metadata();
    metadata.add("authorization", `Bearer ${accessToken}`);
    const request = {
      liveChatId: this.liveChatId,
      pageToken: this.pageToken || undefined,
      part: ["id", "snippet", "authorDetails"]
    };
    let completed = false;
    this.call = this.client.StreamList(request, metadata);
    this.call.on("data", async response => {
      if (response.nextPageToken) this.pageToken = response.nextPageToken;
      this.attempt = 0;
      try {
        await this.onResponse(response);
      } catch (error) {
        console.error("LiveChat stream response handling failed:", error);
      }
    });
    this.call.on("error", error => {
      completed = true;
      this.handleError(error);
    });
    this.call.on("end", () => {
      if (!completed && !this.closed) this.scheduleReconnect();
    });
  }

  handleError(error) {
    if (this.closed || error.code === grpc.status.CANCELLED) return;
    if (TERMINAL_STATUS_CODES.has(error.code)) {
      this.onTerminalError(error);
      return;
    }
    this.scheduleReconnect(error);
  }

  scheduleReconnect(error) {
    if (this.closed) return;
    const delay = Math.min(
      this.reconnectDelayMs * Math.pow(2, this.attempt++),
      this.maxReconnectDelayMs
    );
    this.onReconnect(error, delay, this.pageToken);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.connect(), delay);
  }
}

module.exports = { YouTubeLiveChatStream, TERMINAL_STATUS_CODES };
