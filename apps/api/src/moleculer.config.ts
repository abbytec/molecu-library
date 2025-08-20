import { BrokerOptions } from "moleculer";
import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const config: BrokerOptions = {
	nodeID: `api-${process.pid}`,
	transporter: undefined, // local (sin Redis/NATS)
	requestTimeout: 4000,
	retryPolicy: { enabled: false },
	logger: [
		{
			type: "Pino",
			options: {
				pino: pino({
					level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
					transport: isDev ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } } : undefined,
				}),
			},
		},
	],
	logLevel: isDev ? "debug" : "info",
	tracing: false,
};

export default config;
