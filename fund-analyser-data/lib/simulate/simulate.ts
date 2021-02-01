import { Promise } from 'bluebird'
import * as compute from '../../client/compute'
import UserDAO from '../db/UserDAO'
import push from '../util/push'

export interface SimulateParam {
  strategy: string
  isins?: string[]
  numPortfolio: number
  active?: boolean
}

export interface SimulateResponse {
  statement: any
  returns: object
  maxDrawdown: number,
  sharpeRatio: number,
  startDate: string,
  endDate: string
}
export interface PredictResponse {
  date: string
  funds: {
    isin: string,
    sedol: string,
    name: string
  }[]
}

export async function simulate (simulateParam: SimulateParam) {
  return compute.post('/simulate', simulateParam)
}

export async function predict (simulateParam: SimulateParam, date?: any): Promise<PredictResponse> {
  return compute.post('/simulate/predict', { simulateParam, date })
}

export async function getStrategies () {
  return compute.get('/simulate/strategies')
}

export async function pushNotificationsForUser (user: string) {
  const simulateParams = await UserDAO.getSimulateParams(user)
  // Only push for active simulate params
  const activeSimulateParams = simulateParams.filter(simulateParam => simulateParam.active)
  const predictionPairs = await Promise.map(activeSimulateParams, async simulateParam => {
    const prediction = await predict(simulateParam)
    return {
      simulateParam,
      prediction
    }
  })
  return push(user, 'trade', predictionPairs)
}
