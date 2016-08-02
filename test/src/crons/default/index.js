'use strict';

const chai = require('chai');
const expect = chai.expect;
const fixtures = require('./fixtures.json');
const _ = require('lodash');
const proxy = require('proxyquire').noCallThru();
const spies = require('chai-spies');
const monitorHelper = require('src/helpers/monitor')();

describe('Cron jobs', () => {
  before(() => chai.use(spies));

  const getCronProxy = (mock) => proxy('src/crons/default', {
    'build/config.json': {
      sandbox: {}
    },
    'src/storage/webtask': {
      init: () => {},
      getStoredData: () => mock.getStoredData || [],
      storeData: () => mock.storeData || Promise.resolve()
    },
    sandboxjs: {
      fromToken: () => {}
    },
    'src/helpers': function() {
      return {
        monitor: {
          MFA_STATE_ENABLED: monitorHelper.MFA_STATE_ENABLED,
          MFA_STATE_DISABLED: monitorHelper.MFA_STATE_DISABLED,
          getDifference: monitorHelper.getDifference,
          getMonitoringResult: () => mock.getMonitoringResult || Promise.resolve()
        },
        notifier: {
          notify: mock.notify
        }
      };
    }
  });
  const runProxyTest = (data) => {
    const getMonitoringResult = data.getMonitoringResult;
    const getStoredData = data.getStoredData;
    const notify = (diff, isMFAEnabled) => {
      if (isMFAEnabled) {
        expect(diff).to.be.eql(data.fixtures.diffMFAEnabled);
      } else {
        expect(diff).to.be.eql(data.fixtures.diffMFADisabled);
      }

      return Promise.resolve();
    };
    const cron = getCronProxy({
      getMonitoringResult: getMonitoringResult,
      getStoredData: getStoredData,
      notify: notify
    });

    cron({}, data.cb);
  };

  describe('Default', () => {
    it('should return all users from the service when database is empty', (done) => {
      runProxyTest({
        getMonitoringResult: Promise.resolve(fixtures.allUsersWithoutMFANotInDb.services),
        getStoredData: Promise.resolve(fixtures.allUsersWithoutMFANotInDb.db),
        fixtures: {
          diffMFAEnabled: fixtures.allUsersWithoutMFANotInDb.diffMFAEnabled,
          diffMFADisabled: fixtures.allUsersWithoutMFANotInDb.diffMFADisabled
        },
        cb: done
      });
    });

    it('should not return users received from the service when all users are in database', (done) => {
      runProxyTest({
        getMonitoringResult: Promise.resolve(fixtures.allUsersWithoutMFAInDb.services),
        getStoredData: Promise.resolve(fixtures.allUsersWithoutMFAInDb.db),
        fixtures: {
          diffMFAEnabled: fixtures.allUsersWithoutMFAInDb.diffMFAEnabled,
          diffMFADisabled: fixtures.allUsersWithoutMFAInDb.diffMFADisabled
        },
        cb: done
      });
    });

    it('should detect when new user without MFA was found and DB is not empty', (done) => {
      runProxyTest({
        getMonitoringResult: Promise.resolve(fixtures.newUsersWithoutMFA_DbNotEmpty.services),
        getStoredData: Promise.resolve(fixtures.newUsersWithoutMFA_DbNotEmpty.db),
        fixtures: {
          diffMFAEnabled: fixtures.newUsersWithoutMFA_DbNotEmpty.diffMFAEnabled,
          diffMFADisabled: fixtures.newUsersWithoutMFA_DbNotEmpty.diffMFADisabled
        },
        cb: done
      });
    });

    it('should detect when MFA was enabled for a user and database was not empty', (done) => {
      runProxyTest({
        getMonitoringResult: Promise.resolve(fixtures.newUsersWithMFA_DbNotEmpty.services),
        getStoredData: Promise.resolve(fixtures.newUsersWithMFA_DbNotEmpty.db),
        fixtures: {
          diffMFAEnabled: fixtures.newUsersWithMFA_DbNotEmpty.diffMFAEnabled,
          diffMFADisabled: fixtures.newUsersWithMFA_DbNotEmpty.diffMFADisabled
        },
        cb: done
      });
    });

    it('should detect error when reading from database failed', (done) => {
      runProxyTest({
        getStoredData: Promise.reject(new Error()),
        cb: (err) => {
          expect(err).to.be.instanceof(Error);
          done();
        }
      });
    });

    it('should detect error when sending notification (MFA disabled) failed', (done) => {
      runProxyTest({
        notify: (diff, isMFAEnabled) => {
          if (isMFAEnabled) {
            return Promise.resolve();
          }

          return Promise.reject(new Error());
        },
        cb: (err) => {
          expect(err).to.be.instanceof(Error);
          done();
        }
      });
    });

    it('should detect error when sending notification (MFA enabled) failed', (done) => {
      runProxyTest({
        notify: (diff, isMFAEnabled) => {
          if (isMFAEnabled) {
            return Promise.reject(new Error());
          }

          return Promise.resolve();
        },
        cb: (err) => {
          expect(err).to.be.instanceof(Error);
          done();
        }
      });
    });

    it('should detect error when storing data in database failed', (done) => {
      runProxyTest({
        storeData: Promise.reject(new Error()),
        cb: (err) => {
          expect(err).to.be.instanceof(Error);
          done();
        }
      });
    });
  });
});
