module.exports = updateFunds

const FundFactory = require('../../lib/fund/FundFactory.js');
const FundDAO = require('../../lib/db/FundDAO.js');
const streamWrapper = require('../../lib/util/streamWrapper.js');
const db = require('../../lib/util/db.js');
const log = require('../../lib/util/log.js');
const properties = require('../../lib/util/properties.js');
const updateCatalog = require('./updateCatalog.js');

const moment = require('moment');
const _ = require('lodash');

/**
 * Update funds that need to be updated based on asof time
 * @returns {Promise.<void>}
 */
async function updateFunds() {
    const yesterday = moment().utc().startOf('day').subtract(1, 'days').toDate();

    const fundsToUpdate = await new Promise((resolve, reject) => {
        FundDAO.listFunds({
            query: {asof: {$lt: yesterday}},
            project: {sedol: 1}
        }, (err, funds) => {
            err? reject(err): resolve(funds);
        });
    });
    const sedols = _.map(fundsToUpdate, f => f.sedol);
    log.info('Sedols to update: %j', sedols);

    const fundStream = new FundFactory().streamFundsFromSedols(sedols);
    const upsertFundStream = streamWrapper.asWritable(FundDAO.upsertFund);

    await new Promise((resolve) => {
        const stream = fundStream.pipe(upsertFundStream);
        stream.on('finish', resolve);
    });

    // delete funds with no data
    await db.getFunds().deleteMany({name: {$eq: null}});
    log.info('Deleted funds without names');
};
