/**
 * Utilidades de validación compartidas
 */

import { BOOK_CONSTRAINTS } from "../types/book";
import { SEARCH_CONSTRAINTS } from "../types/search";

// Validador genérico
export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

// Validación de libro
export function validateBook(book: { title?: string; author?: string; rating?: number; review?: string }): ValidationResult {
	const errors: string[] = [];

	if (!book.title?.trim()) {
		errors.push("El título es requerido");
	}

	if (!book.author?.trim()) {
		errors.push("El autor es requerido");
	}

	if (book.rating !== undefined && !Number.isInteger(book.rating)) {
		errors.push("La calificación debe ser un número entero");
	}

	if (book.rating !== undefined && (book.rating < BOOK_CONSTRAINTS.RATING.MIN || book.rating > BOOK_CONSTRAINTS.RATING.MAX)) {
		errors.push(`La calificación debe estar entre ${BOOK_CONSTRAINTS.RATING.MIN} y ${BOOK_CONSTRAINTS.RATING.MAX}`);
	}

	if (book.review && book.review.length > BOOK_CONSTRAINTS.REVIEW.MAX_LENGTH) {
		errors.push(`La reseña no puede exceder ${BOOK_CONSTRAINTS.REVIEW.MAX_LENGTH} caracteres`);
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

// Validación de búsqueda
export function validateSearchQuery(query: string): ValidationResult {
	const errors: string[] = [];

	if (!query?.trim()) {
		errors.push("La consulta de búsqueda es requerida");
	}

	if (query && query.length < SEARCH_CONSTRAINTS.QUERY.MIN_LENGTH) {
		errors.push(`La consulta debe tener al menos ${SEARCH_CONSTRAINTS.QUERY.MIN_LENGTH} carácter`);
	}

	if (query && query.length > SEARCH_CONSTRAINTS.QUERY.MAX_LENGTH) {
		errors.push(`La consulta no puede exceder ${SEARCH_CONSTRAINTS.QUERY.MAX_LENGTH} caracteres`);
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

// Utilidad para sanitizar strings
export function sanitizeString(str: string): string {
	return str?.trim().replace(/\s+/g, " ") || "";
}

// Utilidad para validar email (si lo necesitas más adelante)
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}
