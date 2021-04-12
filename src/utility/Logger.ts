import * as winston from "winston";

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${JSON.stringify(message)}`;
});

export const Logger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), myFormat),
  transports: [
    new winston.transports.File({
      level: "verbose",
      filename: "filelog-verbose.log",
      maxsize: 1024 * 1024 * 1024
    }),
    new winston.transports.File({
      level: "error",
      filename: "filelog-error.log",
      maxsize: 1024 * 1024 * 1024
    }),
  ],
});

export const CashMovement = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), myFormat),
  transports: [
    new winston.transports.File({
      filename: "cashmovement.log",
      maxsize: 1024 * 1024 * 1024
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  Logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
