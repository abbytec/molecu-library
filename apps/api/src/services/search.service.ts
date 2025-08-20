import type { ServiceSchema } from "moleculer";
import { connectMongo } from "../db.js";
import { Search } from "../models/Search.js";

const SearchService: ServiceSchema = {
	name: "search",
	async started() {
		try {
			await connectMongo(process.env.MONGODB_URI!);
			this.logger.info("Search service connected to MongoDB successfully");
		} catch (error) {
			this.logger.error({ error: error instanceof Error ? error.message : String(error) }, "Search service failed to connect to MongoDB");
			throw error;
		}
	},
	actions: {
		async push(ctx) {
			const { userKey, query } = ctx.params;
			if (!userKey || !query) return;

			await Search.create({ userKey, query });

			const extraIds = await Search.find({ userKey }).sort({ createdAt: -1 }).skip(20).select("_id").lean();

			if (extraIds.length > 0) {
				await Search.deleteMany({ _id: { $in: extraIds.map((e) => e._id) } });
			}
		},
		async last5(ctx) {
			const { userKey } = ctx.params;
			if (!userKey) return [];
			const items = await Search.find({ userKey }).sort({ createdAt: -1 }).limit(5).lean();
			return items.map((i) => i.query);
		},
	},
};

export default SearchService;
