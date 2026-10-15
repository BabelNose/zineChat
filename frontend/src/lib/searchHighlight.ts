function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escapes `text` for safe HTML rendering, then wraps any occurrence of a word
 * from `query` in a <mark> tag. Intended for use with `{@html ...}`.
 */
export function highlightMatches(text: string, query: string): string {
	const escaped = escapeHtml(text);

	const terms = [...new Set(query.trim().split(/\s+/).filter(Boolean))]
		.map(escapeRegExp)
		.sort((a, b) => b.length - a.length);

	if (terms.length === 0) {
		return escaped;
	}

	const pattern = new RegExp(`(${terms.join('|')})`, 'gi');
	return escaped.replace(pattern, '<mark>$1</mark>');
}
