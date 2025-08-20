import { Schema, model, Document } from "mongoose";
import { Book as SharedBook, BOOK_CONSTRAINTS } from "@molecu-library/shared";

export interface BookDoc extends Document, SharedBook {
	createdAt: Date;
	updatedAt: Date;
}

const BookSchema = new Schema<BookDoc>(
	{
		ol_key: { type: String, required: true, index: true, unique: true },
		title: { type: String, required: true, text: true },
		author: { type: String, required: true, text: true },
		year: { type: Number, default: null },
		coverBase64: { type: String, default: null },
		review: { type: String, default: "" },
		rating: {
			type: Number,
			default: 0,
			min: BOOK_CONSTRAINTS.RATING.MIN,
			max: BOOK_CONSTRAINTS.RATING.MAX,
		},
	},
	{ timestamps: true }
);

BookSchema.index({ title: "text", author: "text" });

export const Book = model<BookDoc>("Book", BookSchema);
