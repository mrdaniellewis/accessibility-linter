import { docUrl } from '../../package.json';

function log(type, element, message, rule) {
  console[type](message, element, rule.name, `${docUrl}#${rule.name}`); // eslint-disable-line no-console
}

export default {
  info({ element, message, rule }) {
    log('info', element, message, rule);
  },

  warn({ element, message, rule }) {
    log('warn', element, message, rule);
  },

  error({ element, message, rule }) {
    log('error', element, message, rule);
  },
};

