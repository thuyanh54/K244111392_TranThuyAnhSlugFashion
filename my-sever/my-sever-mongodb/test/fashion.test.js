const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createFashionSlug,
  parseFashionSlug,
  planFashionMetadata,
  ensureFashionMetadata,
} = require("../fashion-metadata");

test("Vietnamese titles produce readable slugs with numeric suffixes", () => {
  assert.equal(
    createFashionSlug("  Đầm Đỏ & Áo Khoác Nữ! ", 12),
    "dam-do-ao-khoac-nu-12",
  );
});
test("empty or punctuation-only titles receive a stable fallback", () => {
  assert.equal(createFashionSlug("", 1), "fashion-1");
  assert.equal(createFashionSlug("!!!", 2), "fashion-2");
});
test("same titles remain unique because IdF is appended", () => {
  assert.notEqual(
    createFashionSlug("Áo dài", 1),
    createFashionSlug("Áo dài", 2),
  );
});
test("parse last numeric segment even when title contains digits", () => {
  assert.deepEqual(parseFashionSlug("bo-suu-tap-2026-12"), {
    IdF: 12,
    slug: "bo-suu-tap-2026-12",
  });
});
test("malformed, fractional, non-positive and unsafe suffixes are rejected", () => {
  for (const slug of [
    "",
    "ao",
    "ao-0",
    "ao--1",
    "ao-01",
    "ao-1.5",
    "ao-9007199254740992",
    "Ao-1",
    "áo-1",
    null,
  ]) {
    assert.equal(parseFashionSlug(slug), null, String(slug));
  }
});
test("invalid IdF cannot generate a slug", () => {
  for (const id of [0, -1, 1.2, "1", NaN, Infinity])
    assert.throws(() => createFashionSlug("Áo", id), TypeError);
});
test("migration preserves valid IDs and assigns missing/duplicate IDs above current maximum", () => {
  const original = [
    { _id: "a", IdF: 8, fashion_subject: "Áo" },
    { _id: "b", IdF: 8, fashion_subject: "Áo" },
    { _id: "c", IdF: "9", fashion_subject: "Đầm" },
    { _id: "d", fashion_subject: "Váy" },
    { _id: "e", IdF: 2, fashion_subject: "Quần" },
    { _id: "f", IdF: -1 },
  ];
  const copy = structuredClone(original);
  const plan = planFashionMetadata(original);
  assert.deepEqual(
    plan.map((item) => item.IdF),
    [8, 9, 10, 11, 2, 12],
  );
  assert.equal(new Set(plan.map((item) => item.slug)).size, 6);
  assert.deepEqual(original, copy, "must not mutate source documents");
});
test("metadata planning is idempotent and supports an empty collection", () => {
  const source = [
    { _id: "a", fashion_subject: "Đầm" },
    { _id: "b", IdF: 2, fashion_subject: "Áo" },
  ];
  const first = planFashionMetadata(source).map((metadata, i) => ({
    ...source[i],
    ...metadata,
  }));
  assert.deepEqual(
    planFashionMetadata(first),
    first.map(({ _id, IdF, slug }) => ({ _id, IdF, slug })),
  );
  assert.deepEqual(planFashionMetadata([]), []);
});
test("exhausted safe integer IDs fail instead of creating imprecise duplicates", () => {
  assert.throws(
    () => planFashionMetadata([{ IdF: Number.MAX_SAFE_INTEGER }, {}]),
    RangeError,
  );
});

function fakeCollection(source, enforceUnique = false) {
  const records = structuredClone(source);
  const indexes = [];
  return {
    records,
    indexes,
    find: () => ({
      sort: () => ({ toArray: async () => structuredClone(records) }),
    }),
    findOne: async (query) =>
      records.find((item) =>
        Object.entries(query).every(
          ([key, value]) => String(item[key]) === String(value),
        ),
      ) || null,
    updateOne: async (query, update) => {
      const record = records.find((item) => item._id === query._id);
      if (
        enforceUnique &&
        records.some(
          (item) => item !== record && item.slug === update.$set.slug,
        )
      )
        throw Error("duplicate slug");
      Object.assign(record, update.$set);
    },
    createIndex: async (keys, options) => {
      indexes.push({ keys, options });
      const field = Object.keys(keys)[0];
      assert.equal(
        new Set(records.map((item) => item[field])).size,
        records.length,
      );
    },
  };
}
test("migration repairs swapped slugs without violating an existing unique slug index", async () => {
  const collection = fakeCollection(
    [
      { _id: "a", IdF: 1, fashion_subject: "Áo", slug: "dam-2" },
      { _id: "b", IdF: 2, fashion_subject: "Đầm", slug: "ao-1" },
    ],
    true,
  );
  assert.equal(await ensureFashionMetadata(collection), 2);
  assert.deepEqual(
    collection.records.map((item) => item.slug),
    ["ao-1", "dam-2"],
  );
  assert.equal(await ensureFashionMetadata(collection), 0);
  assert.deepEqual(collection.indexes[0], {
    keys: { IdF: 1 },
    options: { unique: true },
  });
  assert.deepEqual(collection.indexes[1], {
    keys: { slug: 1 },
    options: { unique: true },
  });
});
test("collection failure is surfaced before the server can start", async () => {
  await assert.rejects(
    ensureFashionMetadata({
      find() {
        throw Error("offline");
      },
    }),
    /offline/,
  );
});

test("API returns correct details and rejects incorrect/missing slugs", async (t) => {
  const { createApp } = require("../index");
  const collection = fakeCollection([
    {
      _id: "507f1f77bcf86cd799439011",
      IdF: 1,
      slug: "ao-dai-1",
      fashion_subject: "Áo dài",
    },
    {
      _id: "507f1f77bcf86cd799439012",
      IdF: 2,
      slug: "ao-dai-2",
      fashion_subject: "Áo dài",
    },
  ]);
  const server = createApp(collection).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const request = (path) =>
    fetch("http://127.0.0.1:" + server.address().port + path);
  const details = await request("/fashions/slug/ao-dai-2");
  assert.equal(details.status, 200);
  assert.equal((await details.json()).IdF, 2);
  for (const [path, status] of [
    ["/fashions/slug/wrong-title-2", 404],
    ["/fashions/slug/ao-dai-99", 404],
    ["/fashions/slug/ao-dai-0", 400],
    ["/fashions/slug/ao--2", 400],
    ["/fashions/abc", 400],
  ])
    assert.equal((await request(path)).status, status, path);
  assert.equal((await (await request("/fashions")).json()).length, 2);
  assert.equal(
    (await (await request("/fashions/507f1f77bcf86cd799439011")).json()).IdF,
    1,
  );
});
