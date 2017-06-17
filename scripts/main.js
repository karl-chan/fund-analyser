const commander = require('commander');
const async = require('async');
const _ = require('lodash');

const db = require('../lib/util/db.js');
const log = require('../lib/util/log.js');
const properties = require('../lib/util/properties.js');
const streamWrapper = require('../lib/util/streamWrapper.js');
const stopwatch = require('../lib/util/stopwatch.js');

const FundFactory = require('../lib/fund/FundFactory.js');
const FundDAO = require('../lib/db/FundDAO.js');

function Main() {
}

Main.tasks = {
    'updateFunds': updateFunds,
    'createIndex': createIndex,
    'repairDatabase': repairDatabase,
    'downloadCsv': downloadCsv
};

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
/**
 * Create index on popular fields for sorting
 * @param callback
 */
function createIndex(callback) {
    async.each(['1D', '3D', '1W', '2W', '1M', '3M', '6M', '1Y', '3Y', '5Y'], (period, cb) => {
        const index = {};
        index[`returns.${period}`] = 1;
        db.get().collection('funds').createIndex(index, cb);
    }, callback);
}
/**
 * Reclaims unused disk space in database
 * @param callback
 */
function repairDatabase(callback) {
    db.get().command({repairDatabase: 1}, callback);
}

function downloadCsv(callback) {
    const savePath = properties.get('csv.save.path');
    const options = {
        type: 'aggregate',
        pipeline: [
            {
                $project: {
                    '_id': 0,
                    'isin': 1,
                    'name': 1,
                    'type': 1,
                    'shareClass': 1,
                    'frequency': 1,
                    'ocf': 1,
                    'amc': 1,
                    'entryCharge': 1,
                    'exitCharge': 1,
                    'returns.5Y': 1,
                    'returns.3Y': 1,
                    'returns.1Y': 1,
                    'returns.6M': 1,
                    'returns.3M': 1,
                    'returns.1M': 1,
                    'returns.2W': 1,
                    'returns.1W': 1,
                    'returns.3D': 1,
                    'returns.1D': 1,
                    'holdings': 1,
                    'latest': {$max: '$historicPrices.date'}
                }
            }
        ]
    };
    const headerFields = ['isin', 'name', 'type', 'shareClass', 'frequency',
        'ocf', 'amc', 'entryCharge', 'exitCharge', 'returns.5Y', 'returns.3Y',
        'returns.1Y', 'returns.6M', 'returns.3M', 'returns.1M', 'returns.2W',
        'returns.1W', 'returns.3D', 'returns.1D', 'holdings', 'latest'];
    FundDAO.exportCsv(savePath, options, headerFields, (err) => {
        if (err) {
            return callback(err);
        }
        log.info('Saved csv file to %s', savePath);
        return callback();
    });
}

if (require.main == module) {
    const operations = _.keys(Main.tasks).join(',');
    commander
        .version('0.9.alpha')
        .description('Specify tasks to run')
        .option('-r, --run <tasks>', `specify one or more of the following tasks (comma-separated): ${operations}`,
            args => args.split(','))
        .parse(process.argv);

    const validInput = commander.run && _.every(commander.run, (task) => task in Main.tasks);
    if (!validInput) {
        commander.help();
    }

    log.info(`Received instructions to run: ${commander.run}`);
    const timer = new stopwatch();

    db.init((err) => {
        if (err) {
            return callback(err);
        }
        log.info(`Connected to MongoDB.`);
        async.eachSeries(commander.run, (task, callback) => {
            log.info(`Started running: ${task}`);
            Main.tasks[task]((err) => {
                const taskDuration = timer.split();
                if (err) {
                    log.error(`Error during ${task}: ${err.stack} after ${taskDuration}.`);
                } else {
                    log.info(`Completed: ${task} in ${taskDuration}.`);
                }
                callback(err);
            });
        }, (err) => {
            const overallDuration = timer.end();
            if (err) {
                log.error(`Aborted due to error: ${err.stack} after ${overallDuration}.`);
                process.exit(-1);
            } else {
                log.info(`Successfully completed all operations: ${commander.run} in ${overallDuration}.`);
                process.exit(0);
            }
        });
    });

}