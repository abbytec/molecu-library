import "dotenv/config";
import { ServiceBroker } from "moleculer";
import config from "./moleculer.config.js";

// importa tus servicios
import ApiService from "./services/api.service.js";
import OpenLibraryService from "./services/openLibrary.service.js";
import LibraryService from "./services/library.service.js";
import SearchService from "./services/search.service.js";

async function main() {
	const broker = new ServiceBroker(config);

	// registrar cada service
	broker.createService(OpenLibraryService);
	broker.createService(LibraryService);
	broker.createService(SearchService);
	broker.createService(ApiService);

	await broker.start();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
