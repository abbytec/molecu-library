import { BookWithId } from "./book.js";

export interface ApiResponse<T = any> {
	ok: boolean;
	data?: T;
	message?: string;
	error?: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page?: number;
	limit?: number;
	hasNext?: boolean;
	hasPrev?: boolean;
}

export interface LibraryApiResponse extends PaginatedResponse<BookWithId> {}

export interface BookApiResponse extends ApiResponse<BookWithId> {}

export interface ApiError {
	code?: string;
	message: string;
	details?: any;
}

export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
} as const;

export interface AuthData {
	userKey: string;
	isAuthenticated: boolean;
}
