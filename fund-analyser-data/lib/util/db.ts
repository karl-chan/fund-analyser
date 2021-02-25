import { Promise } from 'bluebird'
import { Db, MongoClient, MongoClientOptions } from 'mongodb'
import log from './log'
import * as properties from './properties'
const uri: string = properties.get('db.mongo.uri.main')
const fundUris: string[] = properties.get('db.mongo.uri.funds')
const stockUris : string[] = properties.get('db.mongo.uri.stocks')

let _client: MongoClient, _db: Db
let _fundClients: MongoClient[], _fundDbs: Db[]
let _stockClients: MongoClient[], _stockDbs: Db[]

export async function init () {
  const opts = { useNewUrlParser: true, useUnifiedTopology: true };
  ([_client, _fundClients, _stockClients] = await Promise.all([
    connectOrFail(uri, opts),
    Promise.map(fundUris, fundUri => connectOrFail(fundUri, opts)),
    Promise.map(stockUris, stockUri => connectOrFail(stockUri, opts))
  ]))
  _db = _client.db()
  _fundDbs = _fundClients.map(client => client.db())
  _stockDbs = _stockClients.map((client: any) => client.db())
}

export function get () {
  return {
    mainClient: _client,
    mainDb: _db,
    fundClients: _fundClients,
    fundDbs: _fundDbs,
    stockClients: _stockClients,
    stockDbs: _stockDbs
  }
}

export function getFunds () {
  return _fundDbs.map(db => db.collection('funds'))
}

export function getStocks () {
  return _stockDbs.map(db => db.collection('stocks'))
}

export function getSimilarFunds () {
  return _db.collection('similarfunds')
}

export function getCurrencies () {
  return _db.collection('currencies')
}

export function getSessions () {
  return _db.collection('sessions')
}

export function getUsers () {
  return _db.collection('users')
}

export function getTestReport () {
  return _db.collection('testreport')
}

async function connectOrFail (uri: string, opts: MongoClientOptions): Promise<MongoClient> {
  return MongoClient.connect(uri, opts)
    .catch(err => {
      log.error(`Failed to connect to uri: ${uri}`)
      throw err
    })
}

export async function close () {
  await Promise.all([
    _client.close(),
    Promise.map(_fundClients, client => client.close()),
    Promise.map(_stockClients, client => client.close())
  ])
}
