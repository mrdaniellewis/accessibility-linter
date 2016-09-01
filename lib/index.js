const Runner = require('./runner');
const Logger = require('./logger');

const logger = new Logger();
const runner = new Runner({
  logger,
});
