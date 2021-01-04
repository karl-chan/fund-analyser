import { Promise } from 'bluebird'
import log from './log'
import * as properties from './properties'
import { MongoClient, MongoClientOptions } from 'mongodb'
const uri = properties.get('db.mongo.uri.main')
const fundUris = properties.get('db.mongo.uri.funds')
const stockUris = properties.get('db.mongo.uri.stocks')

let _client: any, _db: any
let _fundClients: any, _fundDbs: any
let _stockClients: any, _stockDbs: any

export async function init () {
  const opts = { useNewUrlParser: true, useUnifiedTopology: true };
  ([_client, _fundClients, _stockClients] = await Promise.all([
    connectOrFail(uri, opts),
    (Promise as any).map(fundUris, (fundUri: any) => connectOrFail(fundUri, opts)),
    (Promise as any).map(stockUris, (stockUri: any) => connectOrFail(stockUri, opts))
  ]))
  _db = _client.db()
  _fundDbs = _fundClients.map((client: any) => client.db())
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
  return _fundDbs.map((db: any) => db.collection('funds'))
}

export function getStocks () {
  return _stockDbs.map((db: any) => db.collection('stocks'))
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

export function getHolidays () {
  return _db.collection('holidays')
}

export function getTestReport () {
  return _db.collection('testreport')
}

async function connectOrFail (uri: any, opts: MongoClientOptions) {
  return MongoClient.connect(uri, opts)
    .catch((err: any) => {
      log.error(`Failed to connect to uri: ${uri}`)
      throw err
    })
}

export async function close () {
  await Promise.all([
    _client.close(),
    (Promise as any).map(_fundClients, (client: any) => client.close()),
    (Promise as any).map(_stockClients, (client: any) => client.close())
  ])
}
