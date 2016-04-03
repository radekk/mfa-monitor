'use strict';

module.exports = (params) => ({
  monitor: require('./monitor')(params),
  notifier: require('./notifier')(params)
});
