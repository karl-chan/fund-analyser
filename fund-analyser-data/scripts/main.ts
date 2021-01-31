import commander from 'commander'
import * as _ from 'lodash'
import * as db from '../lib/util/db'
import log from '../lib/util/log'
import Stopwatch from '../lib/util/stopwatch'
import createIndex from './tasks/createIndex'
import downloadCsv from './tasks/downloadCsv'
import dynoHealthcheck from './tasks/dynoHealthcheck'
import pushNotifications from './tasks/pushNotifications'
import repairDatabase from './tasks/repairDatabase'
import tradeFunds from './tasks/tradeFunds'
import updateCatalog from './tasks/updateCatalog'
import updateCurrencies from './tasks/updateCurrencies'
import updateFunds from './tasks/updateFunds'
import updateStocks from './tasks/updateStocks'
import uploadTestReport from './tasks/uploadTestReport'

function Main () {
}

Main.tasks = {
  createIndex,
  downloadCsv,
  dynoHealthcheck,
  pushNotifications,
  repairDatabase,
  tradeFunds,
  updateCatalog,
  updateCurrencies,
  updateFunds,
  updateStocks,
  uploadTestReport
}

if (require.main === module) {
  const operations = _.keys(Main.tasks).join(',')
  commander
    .version('0.9.alpha')
    .description('Specify tasks to run')
    .option('-r, --run <tasks>', `specify one or more of the following tasks (comma-separated): ${operations}`,
      (args: any) => args.split(','))
    .parse(process.argv)

  const options = commander.opts()
  const validInput = options.run && _.every(options.run, (task: any) => task in Main.tasks)
  if (!validInput) {
    commander.help()
  }
  const remainingArgs = commander.args

  log.info(`Received instructions to run: ${options.run}`)
  if (remainingArgs.length) {
    log.info(`with remaining args: ${remainingArgs}`)
  }

  const timer = new Stopwatch();

  (async () => {
    await db.init()
    log.info('Connected to MongoDB.')

    for (const task of options.run) {
      log.info(`Started running: ${task}`)
      try {
        // @ts-ignore
        await Main.tasks[task](...remainingArgs)
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
    log.info(`Successfully completed all operations: ${options.run} in ${overallDuration}.`)
    process.exit(0)
  })()
}
