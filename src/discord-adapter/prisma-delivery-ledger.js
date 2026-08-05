function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function isUniqueConstraint(error) {
  return error?.code === 'P2002';
}

function acceptedAtIso(value) {
  return new Date(value).toISOString();
}

export class PrismaDeliveryLedger {
  constructor({ prisma, now = () => new Date() }) {
    this.prisma = prisma;
    this.now = now;
  }

  async accept({ eventId, payload }) {
    const acceptedAt = this.now();
    try {
      const record = await this.prisma.adapterDelivery.create({
        data: {
          eventId,
          payload,
          status: 'accepted',
          acceptedAt,
        },
      });
      return {
        outcome: 'accepted',
        deliveryId: record.id,
        acceptedAt: acceptedAtIso(record.acceptedAt),
      };
    } catch (error) {
      if (!isUniqueConstraint(error)) throw error;
    }

    const record = await this.prisma.adapterDelivery.findUnique({ where: { eventId } });
    if (!record || canonicalJson(record.payload) !== canonicalJson(payload)) {
      return { outcome: 'conflict' };
    }

    return {
      outcome: 'duplicate',
      deliveryId: record.id,
      acceptedAt: acceptedAtIso(record.acceptedAt),
    };
  }
}
