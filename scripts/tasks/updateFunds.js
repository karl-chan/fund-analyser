module.exports = updateFunds

const FundFactory = require('../../lib/fund/FundFactory.js');
const FundDAO = require('../../lib/db/FundDAO.js');
const streamWrapper = require('../../lib/util/streamWrapper.js');

/**
 * Updates all funds in database by performing full scrape
 * @param callback
 * @returns {*}
 */
function updateFunds(callback) {
    const fundStream = new FundFactory().streamFunds();
    const upsertFundStream = streamWrapper.asWritable(FundDAO.upsertFund);

    const stream = fundStream.pipe(upsertFundStream);
    stream.on('finish', callback);
    return stream;
};