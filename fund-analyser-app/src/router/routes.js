
export default [
  {
    path: '/',
    component: () => import('layouts/DefaultLayout'),
    children: [
      { path: 'fund/:isin', name: 'fund', component: () => import('pages/fund/FundPage'), props: true },
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
