/**
 * In-memory coverage accounting for the DOM translator.
 *
 * Nothing is persisted: every window/activation starts a fresh report, which is
 * what the status view and the "export untranslated" button read from.
 */

export interface MissEntry {
	text: string;
	count: number;
	routes: Set<string>;
	firstSeenAt: number;
	lastSeenAt: number;
}

export interface CoverageSummary {
	hits: number;
	uniqueHits: number;
	misses: number;
	uniqueMisses: number;
	topMisses: { text: string; count: number; routes: string[] }[];
}

export class CoverageCollector {
	private readonly hitCounts = new Map<string, number>();
	private readonly missCounts = new Map<string, MissEntry>();
	private startedAt = Date.now();

	recordHit(text: string): void {
		if (!text) return;
		this.hitCounts.set(text, (this.hitCounts.get(text) ?? 0) + 1);
	}

	recordMiss(text: string, route: string): void {
		if (!text) return;
		const now = Date.now();
		const entry = this.missCounts.get(text);
		if (entry) {
			entry.count += 1;
			entry.routes.add(route);
			entry.lastSeenAt = now;
			return;
		}
		this.missCounts.set(text, { text, count: 1, routes: new Set([route]), firstSeenAt: now, lastSeenAt: now });
	}

	reset(): void {
		this.hitCounts.clear();
		this.missCounts.clear();
		this.startedAt = Date.now();
	}

	get hits(): number {
		let total = 0;
		for (const count of this.hitCounts.values()) total += count;
		return total;
	}

	get misses(): number {
		let total = 0;
		for (const entry of this.missCounts.values()) total += entry.count;
		return total;
	}

	get uniqueMisses(): number {
		return this.missCounts.size;
	}

	/** Misses sorted by frequency, then alphabetically, capped for display. */
	topMisses(limit = 50): { text: string; count: number; routes: string[] }[] {
		return [...this.missCounts.values()]
			.sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
			.slice(0, limit)
			.map(entry => ({ text: entry.text, count: entry.count, routes: [...entry.routes].sort() }));
	}

	summary(limit = 50): CoverageSummary {
		return {
			hits: this.hits,
			uniqueHits: this.hitCounts.size,
			misses: this.misses,
			uniqueMisses: this.uniqueMisses,
			topMisses: this.topMisses(limit),
		};
	}

	/** Stable JSON document used by the export button. */
	exportDocument(dictionarySize: number, ruleCount: number): string {
		return JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				startedAt: new Date(this.startedAt).toISOString(),
				dictionarySize,
				ruleCount,
				hits: this.hits,
				uniqueHits: this.hitCounts.size,
				misses: this.misses,
				uniqueMisses: this.uniqueMisses,
				route: typeof location === "undefined" ? undefined : location.pathname,
				untranslated: [...this.missCounts.values()]
					.sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
					.map(entry => ({ text: entry.text, count: entry.count, routes: [...entry.routes].sort() })),
			},
			null,
			2,
		);
	}
}
