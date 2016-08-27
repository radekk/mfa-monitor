'use strict';

const fixtures = require('./fixtures.json');
const helper = require('src/helpers')().monitor;
const proxy = require('proxyquire').noCallThru();
const Promise = require('bluebird').Promise;

describe('Helpers', () => {
  const getMonitorProxy = (params, wtcb) => proxy('src/helpers/monitor.js', {
    sandboxjs: {
      Webtask: function() {
        if (typeof wtcb === 'function') { return {run: wtcb}; }

        return {run: function() {}};
      }
    }
  })(params);

  describe('Monitor', () => {
    describe('getDifference', () => {
      it('should return no difference for the same arrays for one service', () => {
        const data = [{name: 'github', accounts: ['john', 'mark', 'thomas']}];
        const diff = helper.getDifference(data, data);

        expect(diff).to.be.an(Array);
        expect(diff).to.have.length(0);
      });

      it('should return no difference for the same arrays for multiple services', () => {
        const data = [
          {name: 'github', accounts: ['john', 'mark', 'thomas']},
          {name: 'google', accounts: ['kevin', 'kate']},
          {name: 'slack', accounts: ['josh', 'brian']}
        ];
        const diff = helper.getDifference(data, data);

        expect(diff).to.be.an(Array);
        expect(diff).to.have.length(0);
      });

      it('should return a user who is not present in database for one service', () => {
        const stored = [{name: 'github', accounts: ['john', 'mark', 'thomas']}];
        const latest = [{name: 'github', accounts: ['john', 'brian']}];
        const diff = helper.getDifference(latest, stored);

        expect(diff).to.be.an(Array);
        expect(diff).to.have.length(1);

        expect(diff[0].name).to.be.equal('github');

        expect(diff[0].accounts).to.be.an(Array);
        expect(diff[0].accounts).to.have.length(1);
        expect(diff[0].accounts[0]).to.be.equal('brian');
      });

      it('should return a user who is not present in database for multiple services', () => {
        const stored = [
          {name: 'github', accounts: ['john', 'mark', 'thomas']},
          {name: 'google', accounts: ['kate', 'chris']}
        ];
        const latest = [
          {name: 'github', accounts: ['john', 'jerry', 'thomas']},
          {name: 'google', accounts: ['kate', 'chris', 'alex']}
        ];
        const diff = helper.getDifference(latest, stored);
        const serviceA = diff.filter(service => service.name === 'github').pop();
        const serviceB = diff.filter(service => service.name === 'google').pop();

        expect(diff).to.be.an(Array);
        expect(diff).to.have.length(2);

        expect(serviceA.accounts).to.be.an(Array);
        expect(serviceA.accounts).to.have.length(1);
        expect(serviceA.accounts[0]).to.be.equal('jerry');

        expect(serviceB.accounts).to.be.an(Array);
        expect(serviceB.accounts).to.have.length(1);
        expect(serviceB.accounts[0]).to.be.equal('alex');
      });

      it('should return newly detected service if not present in database', () => {
        const stored = [{name: 'github', accounts: ['john', 'mark', 'thomas']}];
        const latest = [
          {name: 'github', accounts: ['john', 'mark', 'thomas']},
          {name: 'google', accounts: ['alex', 'chris']}
        ];
        const diff = helper.getDifference(latest, stored);

        expect(diff).to.be.an(Array);
        expect(diff).to.have.length(1);

        expect(diff[0].name).to.be.equal('google');
        expect(diff[0].accounts).to.be.an(Array);
        expect(diff[0].accounts).to.have.length(2);
        expect(diff[0].accounts).to.eql(['alex', 'chris']);
      });
    });

    describe('getMonitoringResult', (done) => {
      it('should reject Promise when Webtask (monitor) returned an error', (done) => {
        const errorMessage = 'Monitoring Webtask failed';
        const cb = () => new Promise.resolve({error: {text: errorMessage}});
        const monitor = getMonitorProxy(fixtures.config_multiple_mixed_wt, cb).getMonitoringResult;

        monitor().catch((err) => {
          expect(err).to.be.eql(errorMessage);
          done();
        });
      });

      it('should reject Promise when error was thrown from the Webtask (monitor) ', (done) => {
        const errorMessage = 'Monitoring Webtask failed';
        const cb = () => { throw new Error(errorMessage); };
        const monitor = getMonitorProxy(fixtures.config_multiple_mixed_wt, cb).getMonitoringResult;

        monitor().catch((err) => {
          expect(err.message).to.be.eql(errorMessage);
          done();
        });
      });

      it('should resolve Promise when Webtask (monitor) was executed successfully', (done) => {
        const cb = () => new Promise.resolve(fixtures.monitor_webtask_result);
        const monitor = getMonitorProxy(fixtures.config_multiple_mixed_wt, cb).getMonitoringResult;

        monitor().then((result) => {
          expect(result).to.be.eql(fixtures.monitor_webtask_promise_result);
          done();
        });
      });
    });
  });
});
