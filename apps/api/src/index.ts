import "dotenv/config";
import { ServiceBroker } from "moleculer";
import config from "./moleculer.config";

// importa tus servicios
import ApiService from "./services/api.service";
import OpenLibraryService from "./services/openLibrary.service";
import LibraryService from "./services/library.service";
import SearchService from "./services/search.service";

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
