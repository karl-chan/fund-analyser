/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.conf > pwa > workboxPluginMode is set to "InjectManifest"
 */
self.addEventListener('push', event => {
  const { key, payload } = event.data.json()

  switch (key) {
    case 'trade': {
      const predictionPairs = payload
      const notificationsPromise = Promise.all(predictionPairs.map(({ simulateParam, prediction }) => {
        const title = prediction.funds.map(fund => fund.isin).join(', ') || 'Sell'
        const options = {
          body: `As of: ${prediction.date}`,
          vibrate: [100, 50, 100],
          requireInteraction: true,
          renotify: true,
          tag: 'trade',
          badge: 'statics/icons/icon-128x128.png',
          icon: 'statics/icons/favicon.ico',
          data: { key, value: simulateParam },
          actions: [
            {
              action: 'trade',
              title: 'Trade'
            }
          ]
        }
        return self.registration.showNotification(title, options)
      }))
      event.waitUntil(notificationsPromise)
      break
    }
    default:
  }
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const { key, value } = event.notification.data
  switch (key) {
    case 'trade': {
      const simulateParam = value
      switch (event.action) {
        case 'trade':
          self.clients.openWindow('https://www.charles-stanley-direct.co.uk')
          break
        default:
          self.clients.openWindow(`/#/simulate/${encodeURIComponent(JSON.stringify(simulateParam))}`)
      }
      break
    }
    default:
  }
})

// Needed for "Add to Home Screen" prompt.
// https://developers.google.com/web/fundamentals/app-install-banners#criteria
self.addEventListener('fetch', event => {})
