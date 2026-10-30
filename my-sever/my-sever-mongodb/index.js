const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { MongoClient, ObjectId } = require("mongodb");
const {
  ensureFashionMetadata,
  parseFashionSlug,
} = require("./fashion-metadata");

function createApp(collection) {
  const app = express();
  app.use(morgan("dev"));
  app.use(cors());
  app.get("/", (_req, res) => res.json({ message: "Fashion API" }));
  app.get("/fashions", async (_req, res, next) => {
    try {
      res.json(await collection.find({}).sort({ IdF: 1 }).toArray());
    } catch (error) {
      next(error);
    }
  });
  app.get("/fashions/slug/:slug", async (req, res, next) => {
    try {
      const identity = parseFashionSlug(req.params.slug);
      if (!identity)
        return res
          .status(400)
          .json({ message: "Slug không hợp lệ. Ví dụ: ao-khoac-nu-1." });
      // Match numeric suffix AND full slug; an incorrect title must not show another item.
      const fashion = await collection.findOne(identity);
      if (!fashion)
        return res
          .status(404)
          .json({ message: "Không tìm thấy mẫu thời trang này." });
      res.json(fashion);
    } catch (error) {
      next(error);
    }
  });
  app.get("/fashions/:id", async (req, res, next) => {
    try {
      if (!/^[a-f0-9]{24}$/i.test(req.params.id))
        return res.status(400).json({ message: "Mã MongoDB không hợp lệ." });
      const fashion = await collection.findOne({
        _id: new ObjectId(req.params.id),
      });
      if (!fashion)
        return res
          .status(404)
          .json({ message: "Không tìm thấy mẫu thời trang này." });
      res.json(fashion);
    } catch (error) {
      next(error);
    }
  });
  app.use((error, _req, res, _next) => {
    console.error("Fashion API error:", error);
    res
      .status(500)
      .json({ message: "Không thể tải dữ liệu. Vui lòng thử lại sau." });
  });
  return app;
}

async function startServer() {
  const client = new MongoClient(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  );
  try {
    await client.connect();
    const collection = client
      .db(process.env.MONGODB_DATABASE || "FashionData")
      .collection("Fashion");
    // Repair IDs/slugs and create unique indexes BEFORE accepting requests.
    const updated = await ensureFashionMetadata(collection);
    const port = Number(process.env.PORT || 3002);
    const server = createApp(collection).listen(port, () =>
      console.log(
        `Fashion API: http://localhost:${port}; updated ${updated} records`,
      ),
    );
    server.on("error", async (error) => {
      console.error(error);
      await client.close();
      process.exitCode = 1;
    });
    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.once(signal, () =>
        server.close(async () => {
          await client.close();
        }),
      );
    }
  } catch (error) {
    await client.close();
    console.error("Cannot start Fashion API:", error);
    process.exitCode = 1;
  }
}
if (require.main === module) startServer();
module.exports = { createApp };
