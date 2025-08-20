import type { ServiceSchema } from "moleculer";
import { connectMongo } from "../db.js";
import { Book } from "../models/Book.js";
import { fetchAsBase64 } from "../utils/images.js";

const LibraryService: ServiceSchema = {
	name: "library",
	async started() {
		try {
			await connectMongo(process.env.MONGODB_URI!);
			this.logger.info("Connected to MongoDB successfully");
		} catch (error) {
			this.logger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to connect to MongoDB");
			throw error;
		}
	},
	actions: {
		// POST save
		async save(ctx) {
			const { ol_key, title, author, year, review, rating, coverId, coverUrl } = ctx.params;

			// si no hay portada guardada, intentar bajar:
			let coverBase64: string | null = null;
			if (coverUrl) {
				try {
					ctx.broker.logger.info(`Downloading cover from URL: ${coverUrl}`);
					coverBase64 = await fetchAsBase64(coverUrl);
					ctx.broker.logger.info(`Cover downloaded successfully, length: ${coverBase64?.length}`);
				} catch (e) {
					ctx.broker.logger.error(`Failed to download cover from URL: ${coverUrl}`, e);
					coverBase64 = null;
				}
			} else if (coverId) {
				const url = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
				try {
					ctx.broker.logger.info(`Downloading cover from OpenLibrary: ${url}`);
					coverBase64 = await fetchAsBase64(url);
					ctx.broker.logger.info(`Cover downloaded successfully, length: ${coverBase64?.length}`);
				} catch (e) {
					ctx.broker.logger.error(`Failed to download cover from OpenLibrary: ${url}`, e);
					coverBase64 = null;
				}
			}

			const doc = await Book.findOneAndUpdate(
				{ ol_key },
				{ ol_key, title, author, year: year ?? null, review: review ?? "", rating: rating ?? 0, coverBase64 },
				{ new: true, upsert: true }
			);
			return doc;
		},

		// GET one
		async get(ctx) {
			const id = String(ctx.params.id);
			const doc = await Book.findById(id);
			if (!doc) throw new Error("Not found");
			return doc;
		},

		// PUT update (solo review/rating)
		async update(ctx) {
			const id = String(ctx.params.id);
			const { review, rating } = ctx.params;
			const doc = await Book.findByIdAndUpdate(id, { review, rating }, { new: true });
			if (!doc) throw new Error("Not found");
			return doc;
		},

		// DELETE
		async remove(ctx) {
			const id = String(ctx.params.id);
			const r = await Book.findByIdAndDelete(id);
			return { ok: !!r };
		},

		// GET list (q, sort, withReview)
		async list(ctx) {
			const { q, sort, withReview, page = 1, limit = 20 } = ctx.params;
			const filter: any = {};
			if (q) {
				filter.$or = [{ title: { $regex: q, $options: "i" } }, { author: { $regex: q, $options: "i" } }];
			}
			if (withReview === "true") filter.review = { $ne: "" };

			const sortObj: any = {};
			if (sort === "rating_asc") sortObj.rating = 1;
			if (sort === "rating_desc") sortObj.rating = -1;

			const skip = (Number(page) - 1) * Number(limit);
			const [items, total] = await Promise.all([
				Book.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
				Book.countDocuments(filter),
			]);
			return { total, items, page: Number(page), limit: Number(limit) };
		},

		// GET cover image (binary from base64)
		async cover(ctx) {
			const id = String(ctx.params.id);
			ctx.broker.logger.info(`Looking for cover with ID: ${id}`);
			const doc = await Book.findById(id).lean();
			ctx.broker.logger.info(`Found doc: ${!!doc}, has coverBase64: ${!!doc?.coverBase64}`);
			if (doc?.coverBase64) {
				ctx.broker.logger.info(`CoverBase64 length: ${doc.coverBase64.length}, starts with: ${doc.coverBase64.substring(0, 50)}`);
			}
			if (!doc?.coverBase64) {
				throw new Error("Cover not found");
			}
			return doc.coverBase64;
		},

		async findByOlKey(ctx) {
			const { ol_key } = ctx.params;
			const doc = await Book.findOne({ ol_key }, { _id: 1 }).lean();
			return doc?._id ?? null;
		},
	},
};

export default LibraryService;
