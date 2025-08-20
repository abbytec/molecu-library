import { Schema, model, Document } from "mongoose";

export interface BookDoc extends Document {
  ol_key: string;
  title: string;
  author: string;
  year: number | null;
  coverBase64: string | null;
  review: string;
  rating: number;
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
    rating: { type: Number, default: 0, min: 0, max: 5 }
  },
  { timestamps: true }
);

BookSchema.index({ title: "text", author: "text" });

export const Book = model<BookDoc>("Book", BookSchema);
