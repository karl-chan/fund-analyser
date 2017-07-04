const commander = require('commander');
const async = require('async');
const _ = require('lodash');

const db = require('../lib/util/db.js');
const log = require('../lib/util/log.js');
const properties = require('../lib/util/properties.js');
const stopwatch = require('../lib/util/stopwatch.js');

const FundFactory = require('../lib/fund/FundFactory.js');
const FundDAO = require('../lib/db/FundDAO.js');

const updateFunds = require('./tasks/updateFunds.js');
const removeOldFunds = require('./tasks/removeOldFunds.js');
const createIndex = require('./tasks/createIndex.js');
const repairDatabase = require('./tasks/repairDatabase.js');
const downloadCsv = require('./tasks/downloadCsv.js');

function Main() {
}

Main.tasks = {
    'updateFunds': updateFunds,
    'removeOldFunds': removeOldFunds,
    'createIndex': createIndex,
    'repairDatabase': repairDatabase,
    'downloadCsv': downloadCsv
};

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