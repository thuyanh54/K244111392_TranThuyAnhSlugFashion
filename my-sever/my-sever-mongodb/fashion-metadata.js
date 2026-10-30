"use strict";

// IdF is a positive, safe JavaScript integer; MongoDB _id remains unchanged.
function validId(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function createFashionSlug(subject, id) {
  if (!validId(id)) throw new TypeError("IdF must be a positive safe integer");
  const title =
    String(subject ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "fashion";
  return `${title}-${id}`;
}

function parseFashionSlug(slug) {
  if (typeof slug !== "string") return null;
  const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)-([1-9]\d*)$/.exec(slug);
  if (!match) return null;
  const id = Number(match[2]);
  return validId(id) ? { IdF: id, slug } : null;
}

// Preserve existing valid IDs. Assign only missing, invalid or duplicate IDs.
function planFashionMetadata(fashions) {
  let nextId = fashions.reduce(
    (max, item) => (validId(item.IdF) ? Math.max(max, item.IdF) : max),
    0,
  );
  const used = new Set();
  return fashions.map((fashion) => {
    let IdF = fashion.IdF;
    if (!validId(IdF) || used.has(IdF)) {
      if (nextId === Number.MAX_SAFE_INTEGER)
        throw new RangeError("IdF range exhausted");
      IdF = ++nextId;
    }
    used.add(IdF);
    return {
      _id: fashion._id,
      IdF,
      slug: createFashionSlug(fashion.fashion_subject, IdF),
    };
  });
}

async function ensureFashionMetadata(collection) {
  const fashions = await collection.find({}).sort({ _id: 1 }).toArray();
  const plan = planFashionMetadata(fashions);
  const changed = plan.filter(
    (item, index) =>
      item.IdF !== fashions[index].IdF || item.slug !== fashions[index].slug,
  );
  // Temporary unique slugs avoid collisions when repairing swapped old slugs.
  // Reserve all old and target values before choosing temporary values.
  const reserved = new Set([
    ...fashions.map((item) => item.slug),
    ...plan.map((item) => item.slug),
  ]);
  for (const item of changed) {
    let temporary = `migration-${item._id}`;
    while (reserved.has(temporary)) temporary += "-x";
    reserved.add(temporary);
    await collection.updateOne(
      { _id: item._id },
      { $set: { slug: temporary } },
    );
  }
  for (const item of changed) {
    await collection.updateOne(
      { _id: item._id },
      { $set: { IdF: item.IdF, slug: item.slug } },
    );
  }
  await collection.createIndex({ IdF: 1 }, { unique: true });
  await collection.createIndex({ slug: 1 }, { unique: true });
  return changed.length;
}

module.exports = {
  createFashionSlug,
  parseFashionSlug,
  planFashionMetadata,
  ensureFashionMetadata,
};
