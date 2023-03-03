import debug from "debug";
import createServer from "./server";

const debugLog: debug.IDebugger = debug('app');
const app = createServer() // new
app.listen(3000, () => {
  debugLog('Server started on port 3000');
})