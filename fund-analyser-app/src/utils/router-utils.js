import router from './../router'

// opts = {newTab: boolean}
export default {
  redirectToHome (opts) {
    redirect({ name: 'home' }, opts)
  },
  redirectToLogin (opts) {
    redirect({ name: 'login' }, opts)
  },
  redirectToLogout (opts) {
    redirect({ name: 'logout' }, opts)
  },
  redirectToFund (isin, opts) {
    redirect({ name: 'fund', params: { isin } }, opts)
  }
}
const redirect = ({ name, params }, opts) => {
  if (opts && opts.newTab) {
    const route = router.resolve({ name, params })
    window.open(route.href, '_blank')
  } else {
    router.push({ name, params })
  }
}
