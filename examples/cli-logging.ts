import { template } from '../src';

const logTemplate = template<{
  level: string;
  timestamp: Date;
  message: string;
  duration?: number;
}>(
  "[{timestamp|date:short}] [{level|pad:5}] {message}",
  { locale: "en-US" }
);

const logWithDuration = template<{
  level: string;
  timestamp: Date;
  message: string;
  duration: number;
}>(
  "[{timestamp|date:short}] [{level|pad:5}] {message} ({duration|number}ms)",
  { locale: "en-US" }
);

console.log('=== CLI Logging Examples ===\n');

console.log(logTemplate({
  level: "INFO",
  timestamp: new Date(),
  message: "Server started",
}));

console.log(logWithDuration({
  level: "ERROR",
  timestamp: new Date(),
  message: "Connection failed",
  duration: 1234,
}));

console.log(logWithDuration({
  level: "WARN",
  timestamp: new Date(),
  message: "Memory usage high",
  duration: 567,
}));

console.log(logWithDuration({
  level: "DEBUG",
  timestamp: new Date(),
  message: "Request processed",
  duration: 42,
}));
