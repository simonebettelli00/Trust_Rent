import http from "http";
import app from "./app.js";
import initSocket from "./socket/index.js";

const PORT = process.env.PORT || 4000;

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server in ascolto su http://localhost:${PORT}`);
});
