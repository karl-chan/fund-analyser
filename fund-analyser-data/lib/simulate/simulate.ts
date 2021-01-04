import { Promise } from 'bluebird'
import * as compute from '../../client/compute'
import UserDAO from '../db/UserDAO'
import push from '../util/push'

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

export async function simulate (simulateParam: any) {
  return compute.post('/simulate', simulateParam)
}

export async function predict (simulateParam: any, date?: any): Promise<PredictResponse> {
  return compute.post('/simulate/predict', { simulateParam, date })
}

export async function getStrategies () {
  return compute.get('/simulate/strategies')
}

export async function pushNotificationsForUser (user: any) {
  const simulateParams = await UserDAO.getSimulateParams(user)
  // Only push for active simulate params
  const activeSimulateParams = simulateParams.filter((simulateParam: any) => simulateParam.active)
  const predictionPairs = await (Promise as any).map(activeSimulateParams, async (simulateParam: any) => {
    const prediction = await predict(simulateParam)
    return {
      simulateParam,
      prediction
    }
  })
  return push(user, 'trade', predictionPairs)
}
