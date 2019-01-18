const commander = require('commander')
const _ = require('lodash')

const db = require('../lib/util/db')
const log = require('../lib/util/log')
const Stopwatch = require('../lib/util/stopwatch')

const updateFunds = require('./tasks/updateFunds')
const updateCatalog = require('./tasks/updateCatalog')
const updateCurrencies = require('./tasks/updateCurrencies')
const updateHolidays = require('./tasks/updateHolidays')
const createIndex = require('./tasks/createIndex')
const repairDatabase = require('./tasks/repairDatabase')
const downloadCsv = require('./tasks/downloadCsv')
const dynoHealthcheck = require('./tasks/dynoHealthcheck')

function Main () {
}

Main.tasks = {
    'updateCatalog': updateCatalog,
    'updateCurrencies': updateCurrencies,
    'updateFunds': updateFunds,
    'updateHolidays': updateHolidays,
    'createIndex': createIndex,
    'downloadCsv': downloadCsv,
    'dynoHealthcheck': dynoHealthcheck,
    'repairDatabase': repairDatabase
}

if (require.main === module) {
    const operations = _.keys(Main.tasks).join(',')
    commander
        .version('0.9.alpha')
        .description('Specify tasks to run')
        .option('-r, --run <tasks>', `specify one or more of the following tasks (comma-separated): ${operations}`,
            args => args.split(','))
        .parse(process.argv)

    const validInput = commander.run && _.every(commander.run, (task) => task in Main.tasks)
    if (!validInput) {
        commander.help()
    }

    log.info(`Received instructions to run: ${commander.run}`)
    const timer = new Stopwatch();

    (async () => {
        await db.init()
        log.info(`Connected to MongoDB.`)

        for (let task of commander.run) {
            log.info(`Started running: ${task}`)
            try {
                await Main.tasks[task]()
            } catch (err) {
                const taskDuration = timer.split()
                log.error(`Error during ${task}: ${err.stack} after ${taskDuration}.`)

                const overallDuration = timer.end()
                log.error(`Aborted due to error: ${err.stack} after ${overallDuration}.`)
                process.exit(1)
            }
            const taskDuration = timer.split()
            log.info(`Completed: ${task} in ${taskDuration}.`)
        }
        const overallDuration = timer.end()
        log.info(`Successfully completed all operations: ${commander.run} in ${overallDuration}.`)
        process.exit(0)
    })()
}
