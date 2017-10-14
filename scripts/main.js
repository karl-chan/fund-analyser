const commander = require('commander');
const async = require('async');
const _ = require('lodash');

const db = require('../lib/util/db.js');
const log = require('../lib/util/log.js');
const properties = require('../lib/util/properties.js');
const Stopwatch = require('../lib/util/stopwatch.js');

const FundFactory = require('../lib/fund/FundFactory.js');
const FundDAO = require('../lib/db/FundDAO.js');

const updateFunds = require('./tasks/updateFunds.js');
const updateCatalog = require('./tasks/updateCatalog.js');
const createIndex = require('./tasks/createIndex.js');
const repairDatabase = require('./tasks/repairDatabase.js');
const downloadCsv = require('./tasks/downloadCsv.js');

function Main() {
}

Main.tasks = {
    'updateCatalog': updateCatalog,
    'updateFunds': updateFunds,
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
        .option('-f, --force', 'force run even if another thread is already running')
        .parse(process.argv);

    const validInput = commander.run && _.every(commander.run, (task) => task in Main.tasks);
    if (!validInput) {
        commander.help();
    }

    log.info(`Received instructions to run: ${commander.run}`);
    const timer = new Stopwatch();

    (async () => {
        await db.init();
        log.info(`Connected to MongoDB.`);

        for(let task of commander.run) {
            log.info(`Started running: ${task}`);
            const taskDuration = timer.split();
            try {
                await Main.tasks[task](commander.force);
            } catch (err) {
                log.error(`Error during ${task}: ${err.stack} after ${taskDuration}.`);

                const overallDuration = timer.end();
                log.error(`Aborted due to error: ${err.stack} after ${overallDuration}.`);
                process.exit(-1);
            }
            log.info(`Completed: ${task} in ${taskDuration}.`);
        }
        const overallDuration = timer.end();
        log.info(`Successfully completed all operations: ${commander.run} in ${overallDuration}.`);
        process.exit(0);
    })();
}