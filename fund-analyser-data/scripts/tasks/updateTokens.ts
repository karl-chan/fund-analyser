import TokenDAO from '../../lib/db/TokenDAO'
import FreeRealTime from '../../lib/stock/FreeRealTime'

/**
 * Update tokens
 */
export default async function updateTokens () {
  const token = await new FreeRealTime().fetchToken()
  await TokenDAO.upsertFreeRealTimeToken(token)
}
