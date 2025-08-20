export interface Book {
	ol_key: string;
	title: string;
	author: string;
	year: number | null;
	review: string;
	rating: number;
	coverBase64?: string | null;
	coverUrl?: string;
}

export interface BookWithId extends Book {
	_id: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface BookInput {
	ol_key: string;
	title: string;
	author: string;
	year?: number;
	review?: string;
	rating?: number;
	coverId?: string;
	coverUrl?: string;
}

export interface BookUpdate {
	review?: string;
	rating?: number;
}

export const BOOK_CONSTRAINTS = {
	RATING: {
		MIN: 0,
		MAX: 5,
	},
	REVIEW: {
		MAX_LENGTH: 1000,
	},
} as const;

export function isValidRating(rating: number): boolean {
	return rating >= BOOK_CONSTRAINTS.RATING.MIN && rating <= BOOK_CONSTRAINTS.RATING.MAX;
}

export function isValidReview(review: string): boolean {
	return review.length <= BOOK_CONSTRAINTS.REVIEW.MAX_LENGTH;
}
