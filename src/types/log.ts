export type LogObject = {
	request: {
		/**
		 * The IP address of the client that made the request.
		 */
		ip?: string;
		/**
		 * The unique ID of the request.
		 */
		requestID?: string | undefined;
		/**
		 * The HTTP method used in the request.
		 */
		method: string;
		/**
		 * The headers included in the request.
		 */
		headers?: Record<string, string>;
		/**
		 * The URL of the request.
		 */
		url: {
			/**
			 * The path of the URL.
			 */
			path: string;
			/**
			 * The params string of the URL.
			 */
			params: Record<string, string>; // | Record<string, never>;
		};
	};
	response: {
		/**
		 * The status code of the response.
		 */
		status_code: number | string | undefined;
		/**
		 * The time it took to process the request and generate the response, in milliseconds.
		 */
		time: number;
	};
	/**
	 * An optional error message associated with the request.
	 */
	error?: string | object | Error;
};
