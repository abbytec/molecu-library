import { BrokerOptions } from "moleculer";

const isDev = process.env.NODE_ENV !== "production";

const config: BrokerOptions = {
  nodeID: `api-${process.pid}`,
  transporter: undefined, // local (sin Redis/NATS)
  logLevel: "info",
  tracing: false
};

export default config;
