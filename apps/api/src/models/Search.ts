import { Schema, model, Document } from "mongoose";

export interface SearchDoc extends Document {
	userKey: string;
	query: string;
	createdAt: Date;
}

const SearchSchema = new Schema<SearchDoc>(
	{
		userKey: { type: String, index: true },
		query: { type: String, required: true },
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
);
SearchSchema.index({ userKey: 1, createdAt: -1 });
export const Search = model<SearchDoc>("Search", SearchSchema);
