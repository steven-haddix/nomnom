// Telynex uses http server and Bun doesn't provide a timeout so adding it here
const _createServer = require("http").createServer;

require("http").createServer = () => {
	const res = _createServer();
	res.timeout = 0;
	return res;
};
