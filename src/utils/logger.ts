import { Elysia } from "elysia";
import { ElysiaLogging } from "@otherguy/elysia-logging";
import { type Logger, LogFormat } from "@otherguy/elysia-logging";
import { createPinoLogger, pino } from "@bogeychan/elysia-logger";
import type { LogObject } from "@/types/log";

// Define Pino logger
/*
export const logger = pino({
	// Use the LOG_LEVEL environment variable, or default to "info"
	level: Bun.env.LOG_LEVEL ?? "info",

	// Rename 'msg' to 'message'
	messageKey: "message",

	// Rename 'err' to 'error'
	errorKey: "error",

	// Rename 'time' to 'ts'
	timestamp: () => `,"ts":"${Date.now()}"`,

	formatters: {
		//Use `level` label instead of integer values
		level: (label) => {
			return { level: label };
		},
	},

	// Define a custom "http" level
	customLevels: {
		http: 35, // same as `info`
	},
});

export const httpPlugin = ElysiaLogging(logger as Logger, {
	// Use the pino "http" custom level defined above
	level: "http",

	// Access logs in JSON format
	format: LogFormat.JSON,
});

*/

export const logger = createPinoLogger({
	serializers: {
		request: (req) => req,
	},
	// Use the LOG_LEVEL environment variable, or default to "info"
	level: Bun.env.LOG_LEVEL ?? "info",

	// Rename 'msg' to 'message'
	messageKey: "message",

	// Rename 'err' to 'error'
	errorKey: "error",

	// Rename 'time' to 'ts'
	timestamp: () => `,"ts":"${Date.now()}"`,

	formatters: {
		//Use `level` label instead of integer values
		level: (label) => {
			return { level: label };
		},
	},

	// Define a custom "http" level
	customLevels: {
		http: 35, // same as `info`
	},
});

const NANOSECOND = 1;
const MICROSECOND = 1e3 * NANOSECOND;
const MILLISECOND = 1e3 * MICROSECOND;
const SECOND = 1e3 * MILLISECOND;

/**
 * Formats a duration in nanoseconds to a human-readable string.
 *
 * @param durationInNanoseconds - The duration in nanoseconds to format.
 *
 * @returns A string representing the formatted duration.
 */
export function formatDuration(durationInNanoseconds: number): string {
	if (durationInNanoseconds >= SECOND) {
		return `${(durationInNanoseconds / SECOND).toPrecision(2)}s`;
	}

	if (durationInNanoseconds >= MILLISECOND) {
		return `${(durationInNanoseconds / MILLISECOND).toPrecision(4)}ms`;
	}

	if (durationInNanoseconds >= MICROSECOND) {
		return `${(durationInNanoseconds / MICROSECOND).toPrecision(4)}µs`;
	}

	return `${durationInNanoseconds.toPrecision(4)}ns`;
}

export class Log {
	// Properties
	private logObject: LogObject;

	// Constructor
	constructor(log: LogObject) {
		this.logObject = log;
	}

	// Getters and setters
	public set error(error: string | object | Error) {
		this.logObject.error = error;
	}

	public get log(): LogObject {
		return this.logObject;
	}

	/**
	 * Simply return the log object and let the logger pretty print it
	 *
	 * @returns Log object as is
	 */
	formatJson(): LogObject {
		return {
			...{
				message: `${this.logObject.request.method} ${this.logObject.request.url.path} completed with status ${this.logObject.response.status_code} in ${formatDuration(this.logObject.response.time)}`,
			},
			...this.logObject,
		};
	}
}

export const logPlugin = logger.into({
	autoLogging: {
		ignore: (ctx) => {
			// Construct log object
			const logObject: Log = new Log({
				request: {
					ip: (ctx.ip as string) || "",
					method: ctx.request.method,
					url: {
						path: ctx.path,
						params: Object.fromEntries(
							new URLSearchParams(new URL(ctx.request.url).search),
						),
					},
				},
				response: {
					status_code: ctx.set.status,
					// @ts-expect-error - TODO: fix typing for startTime
					time: performance.now() - ctx.store.startTime,
				},
			});

			if (ctx.request.headers.has("x-request-id")) {
				logObject.log.request.requestID =
					ctx.request.headers.get("x-request-id") || undefined;
			}

			// Include headers
			for (const header of ["x-forwarded-for", "authorization"]) {
				if (ctx.request.headers.has(header)) {
					logObject.log.request.headers = {
						...logObject.log.request.headers,
						[header]: ctx.request.headers.get(header) || "",
					};
				}
			}

			if (ctx.isError) {
				if (
					(ctx.store as { error?: string | Error | object }).error !== undefined
				) {
					logObject.error = (
						ctx.store as { error: string | Error | object }
					).error;
				}

				const message = logObject.formatJson();
				logger.error(ctx);
				logger.error(message);
				return true;
			}

			//const message = logObject.formatJson();

			//logger.info(message);
			return true;
		},
	},
});
