import express from 'express';

function isDeliveryRequest(value, idempotencyKey) {
  return value
    && value.event_id === idempotencyKey
    && value.event_type === 'community.message.delivery-requested.v1'
    && value.schema_version === 1
    && typeof value.target?.channel_id === 'string'
    && value.target.channel_id.length > 0
    && typeof value.content === 'string'
    && value.content.length > 0
    && value.content.length <= 2000;
}

export function createDiscordAdapterApp({ ledger, authenticate }) {
  if (typeof authenticate !== 'function') {
    throw new TypeError('authenticate must be a function');
  }

  const app = express();
  app.use(express.json({ limit: '16kb' }));

  app.get('/healthz', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.post('/internal/v1/deliveries', async (request, response, next) => {
    try {
      const isAuthenticated = await authenticate({ authorization: request.get('authorization') });
      if (!isAuthenticated) {
        return response.status(401).json({ error: 'unauthorized' });
      }

      const idempotencyKey = request.get('Idempotency-Key');
      if (!idempotencyKey || !isDeliveryRequest(request.body, idempotencyKey)) {
        return response.status(400).json({ error: 'invalid_delivery_request' });
      }

      const acceptance = await ledger.accept({
        eventId: request.body.event_id,
        payload: request.body,
      });

      if (acceptance.outcome === 'conflict') {
        return response.status(409).json({ error: 'idempotency_key_payload_conflict' });
      }

      return response.status(202).json({
        event_id: request.body.event_id,
        adapter_delivery_id: acceptance.deliveryId,
        status: 'accepted',
        accepted_at: acceptance.acceptedAt,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    response.status(503).json({ error: 'adapter_temporarily_unavailable' });
  });

  return app;
}
