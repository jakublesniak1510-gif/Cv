import net from 'node:net';

// Wolny port od systemu (listen(0)) zamiast losowania z zakresu: testy uruchamiane równolegle nie trafiają na zajęty port.
export const freePort = () => new Promise((ok, no) => {
  const s = net.createServer();
  s.unref(); s.on('error', no);
  s.listen(0, () => { const { port } = s.address(); s.close(() => ok(port)); });
});
