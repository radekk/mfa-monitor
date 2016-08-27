'use strict';

const chai = require('chai');
const expect = chai.expect;
const fixtures = require('./fixtures.json');
const proxy = require('proxyquire').noCallThru();

describe('Helpers', () => {
  const getNotifierProxy = (params, wtcb) => proxy('src/helpers/notifier', {
    sandboxjs: {
      Webtask: function() {
        if (typeof wtcb === 'function') { wtcb(); }

        return {run: function() {}};
      }
    }
  })(params);

  describe('Notifier', () => {
    it('should resolve Promise with False value when data not set', (done) => {
      const notifier = getNotifierProxy(fixtures.config_empty_wt_list).notify;

      notifier([]).then((data) => {
        expect(data).to.be.false;
        done();
      });
    });

    it('should reject Promise when Webtask (notifier) execution failed', (done) => {
      const errorMessage = 'Webtask execution failed.';
      const cb = () => { throw new Error(errorMessage); };
      const notifier = getNotifierProxy(fixtures.config_multiple_mixed_wt, cb).notify;

      notifier(['']).catch((err) => {
        expect(err.message).to.be.eql(errorMessage);
        done();
      });
    });

    it('should resolve Promise successfully when Webtask (notifier) was executed without an error', (done) => {
      const notifier = getNotifierProxy(fixtures.notifier_valid_data.module_params).notify;

      notifier(['']).then((data) => {
        expect(data).to.be.eql(fixtures.notifier_valid_data.execution_result);
        done();
      });
    });
  });
});
