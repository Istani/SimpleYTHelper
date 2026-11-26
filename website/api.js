const crypto = require("crypto");
const express = require("express");
const ApiKey = require("./models/syth_api_key.js");
const ApiUsage = require("./models/syth_api_usage.js");
const Login = require("./models/syth_login.js");
const Token = require("./models/syth_token.js");
const Channel = require("./models/channel.js");
const Member = require("./models/member.js");
const Video = require("./models/videos.js");
const Playlist = require("./models/playlists.js");
const RpgChar = require("./models/rpg_char.js");
const ChannelAnalyticsHistory = require("./models/channel_analytics_history.js");
const VideoAnalyticsHistory = require("./models/video_analytics_history.js");
const LiveChatEvent = require("./models/live_chat_event.js");
const Broadcast = require("./models/broadcast.js");

function keyHash(value) {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}

function sessionUser(req) {
  if (!req.session || !req.session.user) return null;
  return Array.isArray(req.session.user)
    ? req.session.user[0]
    : req.session.user;
}

function isApiAdmin(user) {
  return !!(user && (user.is_api_admin || user.is_admin));
}

function requireSessionUser(req, res, next) {
  if (!sessionUser(req)) return res.redirect("/Login");
  next();
}

function createCsrfToken(req) {
  if (!req.session.api_csrf_token) {
    req.session.api_csrf_token = crypto.randomBytes(24).toString("hex");
  }
  return req.session.api_csrf_token;
}

function requireCsrf(req, res, next) {
  if (
    !req.session ||
    !req.session.api_csrf_token ||
    req.body.csrf_token !== req.session.api_csrf_token
  ) {
    return res.status(403).send("Ungültige Anfrage. Bitte Seite neu laden.");
  }
  next();
}

async function channelIdsForUser(userId) {
  const tokens = await Token.query()
    .where("user_id", userId)
    .select("service_user");
  return tokens.map(token => token.service_user).filter(Boolean);
}

function noRowsQuery(Model, column) {
  return Model.query().where(column, "__syth_no_owned_resource__");
}

function parseCursor(value) {
  if (value === undefined || value === "") return null;
  const match = /^c_(\d+)$/.exec(value);
  if (!match) return undefined;
  const cursor = Number(match[1]);
  return Number.isSafeInteger(cursor) ? cursor : undefined;
}

function apiLiveEvent(event) {
  let details = event.details || null;
  if (typeof details === "string") {
    try {
      details = JSON.parse(details);
    } catch (error) {
      details = null;
    }
  }
  return {
    id: event.source_event_id || String(event.id),
    type: event.type,
    publishedAt: event.published_at
      ? new Date(event.published_at).toISOString()
      : null,
    service: event.service,
    channelId: event.channel_id,
    roomId: event.room_id,
    author: event.author_id
      ? {
          id: event.author_id,
          handle: event.author_handle || null,
          displayName: event.author_display_name || null,
          isOwner: !!event.author_is_owner,
          isModerator: !!event.author_is_moderator,
          isMember: !!event.author_is_member
        }
      : null,
    text: event.text || "",
    details: event.details || null
  };
}

function createApiRouter() {
  const router = express.Router();

  router.use(function(req, res, next) {
    res.set("Access-Control-Allow-Origin", "*");
    res.set(
      "Access-Control-Allow-Headers",
      "X-SYTH-API-Key, Authorization, Content-Type"
    );
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  router.use(async function(req, res, next) {
    const presented =
      req.get("x-syth-api-key") ||
      (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!presented) return res.status(401).json({ error: "missing_api_key" });

    try {
      const apiKey = await ApiKey.query().findOne({
        key_hash: keyHash(presented)
      });
      if (!apiKey || apiKey.revoked_at)
        return res.status(401).json({ error: "invalid_api_key" });
      const owner = await Login.query().findById(apiKey.owner_id);
      if (!owner) return res.status(401).json({ error: "invalid_api_key" });

      req.api = { key: apiKey, owner: owner, isAdmin: isApiAdmin(owner) };
      const startedAt = Date.now();
      res.on("finish", function() {
        ApiKey.query()
          .findById(apiKey.id)
          .patch({ last_used_at: new Date() })
          .catch(function() {});
        ApiUsage.query()
          .insert({
            api_key_id: apiKey.id,
            owner_id: owner.id,
            requested_user_id: req.api.targetUserId || owner.id,
            method: req.method,
            endpoint: req.baseUrl + req.path,
            response_status: res.statusCode,
            duration_ms: Date.now() - startedAt,
            response_bytes: Number(res.get("content-length")) || 0,
            is_admin_request: req.api.isAdmin
          })
          .catch(function() {});
      });
      next();
    } catch (error) {
      next(error);
    }
  });

  router.use(async function(req, res, next) {
    const requested = req.query.userId;
    if (requested === undefined || requested === "") {
      req.api.targetUserId = req.api.owner.id;
      return next();
    }
    const targetId = Number(requested);
    if (!Number.isSafeInteger(targetId) || targetId < 1)
      return res.status(400).json({ error: "invalid_user_id" });
    if (!req.api.isAdmin && targetId !== req.api.owner.id)
      return res.status(403).json({ error: "forbidden_user_scope" });
    const target = await Login.query().findById(targetId);
    if (!target) return res.status(404).json({ error: "user_not_found" });
    req.api.targetUserId = targetId;
    next();
  });

  router.get("/live/status", async function(req, res, next) {
    try {
      const ids = await channelIdsForUser(req.api.targetUserId);
      const channels = ids.length
        ? await Channel.query()
            .whereIn("channel_id", ids)
            .select("service", "channel_id", "channel_title")
        : [];
      const activeYoutube = ids.length
        ? await Broadcast.query()
            .where("service", "youtube")
            .whereIn("owner", ids)
            .where("liveChatId", "!=", "")
            .whereNotNull("liveChatId")
            .whereNull("actualEndTime")
            .select("owner", "b_id", "b_title", "liveChatId", "actualStartTime")
        : [];
      const broadcastsByChannel = new Map(
        activeYoutube.map(broadcast => [broadcast.owner, broadcast])
      );
      const data = channels.map(channel => {
        const broadcast = broadcastsByChannel.get(channel.channel_id);
        return {
          service: channel.service,
          channelId: channel.channel_id,
          channelTitle: channel.channel_title,
          live: !!broadcast,
          chatOpen: broadcast ? true : null,
          broadcast: broadcast
            ? {
                id: broadcast.b_id,
                title: broadcast.b_title,
                roomId: broadcast.liveChatId,
                startedAt: broadcast.actualStartTime || null
              }
            : null
        };
      });
      res.json({ data: data, meta: { requestedUserId: req.api.targetUserId } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/live/chat", async function(req, res, next) {
    try {
      const cursor = parseCursor(req.query.after);
      if (cursor === undefined)
        return res.status(400).json({ error: "invalid_cursor" });
      const ids = await channelIdsForUser(req.api.targetUserId);
      const requestedChannel = req.query.channelId;
      if (requestedChannel && !ids.includes(requestedChannel))
        return res.status(403).json({ error: "forbidden_channel_scope" });
      const channelIds = requestedChannel ? [requestedChannel] : ids;
      if (!channelIds.length)
        return res.json({
          data: [],
          meta: { requestedUserId: req.api.targetUserId, nextCursor: "c_0", pollAfterMs: 1500 }
        });

      const baseQuery = LiveChatEvent.query().whereIn("channel_id", channelIds);
      if (cursor === null) {
        const latest = await baseQuery.clone().max("id as id").first();
        return res.json({
          data: [],
          meta: {
            requestedUserId: req.api.targetUserId,
            nextCursor: "c_" + (latest && latest.id ? latest.id : 0),
            pollAfterMs: 1500
          }
        });
      }
      const events = await baseQuery
        .where("id", ">", cursor)
        .orderBy("id", "asc")
        .limit(200);
      const nextCursor = events.length
        ? events[events.length - 1].id
        : cursor;
      res.json({
        data: events.map(apiLiveEvent),
        meta: {
          requestedUserId: req.api.targetUserId,
          nextCursor: "c_" + nextCursor,
          pollAfterMs: 1500,
          hasMore: events.length === 200
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/me", async function(req, res, next) {
    try {
      const user = await Login.query()
        .findById(req.api.targetUserId)
        .select("id", "user", "created_at", "updated_at");
      res.json({ data: user, meta: { requestedUserId: req.api.targetUserId } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/channels", async function(req, res, next) {
    try {
      const ids = await channelIdsForUser(req.api.targetUserId);
      const data = ids.length
        ? await Channel.query().whereIn("channel_id", ids)
        : [];
      res.json({ data: data, meta: { requestedUserId: req.api.targetUserId } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/members", async function(req, res, next) {
    try {
      const ids = await channelIdsForUser(req.api.targetUserId);
      const data = ids.length
        ? await Member.query()
            .whereIn("owner", ids)
            .orderBy("since", "desc")
        : [];
      res.json({ data: data, meta: { requestedUserId: req.api.targetUserId } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/videos", async function(req, res, next) {
    try {
      const ids = await channelIdsForUser(req.api.targetUserId);
      const data = ids.length
        ? await Video.query()
            .whereIn("owner", ids)
            .orderBy("publishedAt", "desc")
        : [];
      res.json({ data: data, meta: { requestedUserId: req.api.targetUserId } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/playlists", async function(req, res, next) {
    try {
      const ids = await channelIdsForUser(req.api.targetUserId);
      const data = ids.length
        ? await Playlist.query().whereIn("owner", ids)
        : [];
      res.json({ data: data, meta: { requestedUserId: req.api.targetUserId } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/analytics/channels", async function(req, res, next) {
    try {
      const ids = await channelIdsForUser(req.api.targetUserId);
      const data = ids.length
        ? await ChannelAnalyticsHistory.query()
            .whereIn(
              "id",
              ChannelAnalyticsHistory.query()
                .max("id as id")
                .whereIn("channel_id", ids)
                .groupBy("channel_id")
            )
            .orderBy("timestamp", "desc")
            .orderBy("id", "desc")
            .select(
              "service",
              "channel_id",
              "period_start",
              "period_end",
              "views",
              "comments",
              "likes",
              "dislikes",
              "estimatedMinutesWatched",
              "averageViewDuration",
              "averageViewPercentage",
              "subscribersGained",
              "subscribersLost",
              "grossRevenue",
              "estimatedRevenue",
              "timestamp"
            )
        : [];
      res.json({ data: data, meta: { requestedUserId: req.api.targetUserId } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/analytics/videos", async function(req, res, next) {
    try {
      const ids = await channelIdsForUser(req.api.targetUserId);
      const data = ids.length
        ? await VideoAnalyticsHistory.query()
            .whereIn(
              "id",
              VideoAnalyticsHistory.query()
                .max("id as id")
                .whereIn("channel_id", ids)
                .groupBy("service", "video_id")
            )
            .orderBy("timestamp", "desc")
            .orderBy("id", "desc")
            .select(
              "service",
              "channel_id",
              "video_id",
              "period_start",
              "period_end",
              "views",
              "comments",
              "likes",
              "dislikes",
              "estimatedMinutesWatched",
              "averageViewDuration",
              "averageViewPercentage",
              "timestamp"
            )
        : [];
      res.json({ data: data, meta: { requestedUserId: req.api.targetUserId } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/rpg/characters", async function(req, res, next) {
    try {
      const data = await RpgChar.query()
        .where("owner", req.api.targetUserId)
        .eager("inventory");
      res.json({ data: data, meta: { requestedUserId: req.api.targetUserId } });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createApiRouter,
  createCsrfToken,
  isApiAdmin,
  keyHash,
  requireCsrf,
  requireSessionUser,
  sessionUser
};
