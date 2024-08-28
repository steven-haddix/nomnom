// This exist because Drizzle doesn't seem to provide a way to map enums between the App and Drizzle
// https://github.com/drizzle-team/drizzle-orm/discussions/1914#discussioncomment-9600199
// biome-ignore lint/suspicious/noExplicitAny: Copied code not concerned right now
export function enumToPgEnum<T extends Record<string, any>>(
	myEnum: T,
): [T[keyof T], ...T[keyof T][]] {
	// biome-ignore lint/suspicious/noExplicitAny: Copied code not concerned right now
	return Object.values(myEnum).map((value: any) => `${value}`) as any;
}
