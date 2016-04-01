'use strict';

const Promise = require('bluebird').Promise;
let db;

module.exports = {
  init: (storage) =>
    db = storage,

  getStoredData: () =>
    new Promise((resolve, reject) =>
      db.get((err, data) => {
        if (err) return reject(err);
        resolve(data || []);
      })
  ),

  storeData: (data) =>
    new Promise((resolve, reject) =>
      db.set(data, {force: 1}, err => {
        if (err) return reject(err);
        resolve();
      })
  )
};
