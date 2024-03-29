import { routerInstance } from './../router'

// opts = {newTab: boolean}
export default {
  redirectToFund (isin, opts) {
    redirect({
      name: 'fund',
      params: { isin },
      query: { startDate: opts && opts.startDate, endDate: opts && opts.endDate }
    }, opts)
  },
  redirectToStock (symbol, opts) {
    redirect({
      name: 'stock',
      params: { symbol },
      query: { startDate: opts && opts.startDate, endDate: opts && opts.endDate }
    }, opts)
  },
  redirectToHome (opts) {
    redirect({ name: 'home' }, opts)
  },
  redirectToLogin (opts) {
    redirect({ name: 'login' }, opts)
  },
  redirectToLogout (opts) {
    redirect({ name: 'logout' }, opts)
  },
  redirectToLogs (opts) {
    redirect({ name: 'logs' }, opts)
  },
  redirectToSimulate (opts) {
    redirect({ name: 'simulate' }, opts)
  }
}
const redirect = ({ name, params, query }, opts) => {
  if (opts && opts.newTab) {
    const route = routerInstance.resolve({ name, params, query })
    window.open(route.href, '_blank')
  } else {
    routerInstance.push({ name, params, query })
  }
}
