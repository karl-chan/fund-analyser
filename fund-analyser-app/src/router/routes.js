
export default [
  {
    path: '/',
    component: () => import('layouts/AppLayout'),
    children: [
      { path: 'fund/:isin', name: 'fund', component: () => import('pages/fund/FundPage'), props: true },
      { path: 'auth/login', name: 'login', component: () => import('pages/auth/LoginPage') },
      { path: 'auth/logout', name: 'logout', component: () => import('pages/auth/LogoutPage') },
      { path: 'logs', name: 'logs', component: () => import('pages/admin/LogsPage') },
      { path: 'simulate/:simulateParam?', name: 'simulate', component: () => import('pages/simulate/SimulatePage'), props: true },
      { path: '*', name: 'home', component: () => import('pages/HomePage') }
    ]
  }
]
