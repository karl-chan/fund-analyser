module.exports = removeOldFunds

const CharlesStanleyDirect=  require('../../lib/fund/CharlesStanleyDirect');
const FundDAO = require('../../lib/db/FundDAO.js');
const _ = require('lodash');

/**
 * Remove funds that are no longer on market from database
 * @param callback
 * @returns {*}
 */
function removeOldFunds(callback) {
    FundDAO.listFunds({project: {_id: 0, isin: 1}}, true, (err, allIsinsObj) => {
        const allIsinsArr = _.map(allIsinsObj, o => o.isin);
        new CharlesStanleyDirect().getIsins((err, isins) => {
            const oldIsins = _.difference(allIsins, isins);
            db.get().collection('funds').deleteMany({isin: {$in: oldIsins}})
        });
    })

};