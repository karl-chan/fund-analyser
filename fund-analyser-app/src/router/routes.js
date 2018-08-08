
export default [
  {
    path: '/',
    component: () => import('layouts/AppLayout'),
    children: [
      { path: 'fund/:isin', name: 'fund', component: () => import('pages/fund/FundPage'), props: true },
      { path: 'funds/summary', name: 'fundsSummary', component: () => import('pages/fund/FundsSummaryPage') },
      { path: 'auth/login', name: 'login', component: () => import('pages/auth/LoginPage') },
      { path: 'auth/logout', name: 'logout', component: () => import('pages/auth/LogoutPage') },
      { path: '', name: 'home', component: () => import('pages/HomePage') }
    ]
  },

  { // Always leave this as last one
    path: '*',
    component: () => import('pages/404')
  }
]
