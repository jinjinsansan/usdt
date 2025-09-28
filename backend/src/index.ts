import 'dotenv/config';

import { createServer } from './server.js';

const port = Number(process.env.PORT ?? 4000);

const app = createServer();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`USDT tracker backend listening on port ${port}`);
});
