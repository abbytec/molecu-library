import "dotenv/config";
import { ServiceBroker } from "moleculer";
import config from "./moleculer.config";
import ApiService from "./services/api.service";

async function main() {
  const broker = new ServiceBroker(config);
  broker.createService(ApiService);
  await broker.start();
}
main().catch((e) => { console.error(e); process.exit(1); });
