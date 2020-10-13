
import get from 'lodash/get'
import { Dialog } from 'quasar'
import urlBase64ToUint8Array from 'urlb64touint8array'
import authService from '../src/services/auth-service'

async function main () {
  navigator.serviceWorker.register(process.env.SERVICE_WORKER_FILE)
  const registration = await navigator.serviceWorker.ready

  try {
    const subscription = await subscribe(registration)
    console.log('Push API subscription: ', subscription)
  } catch (err) {
    if (Notification.permission === 'denied') {
      console.error('Permission for notifications was denied!')
      showPermissionDeniedDialog()
    } else {
      console.error('Unable to subscribe to Push notifications!', err)
      showPushUnsupportedDialog(err)
    }
  }
}

async function subscribe (registration) {
  const { publicKey } = await authService.getPushDetails()
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  })
  const pushSubscription = JSON.parse(JSON.stringify(subscription))
  window.pushSubscription = pushSubscription // Hackily store in global window for later auth
  await authService.subscribe(pushSubscription)
  return subscription
}

function showPermissionDeniedDialog () {
  Dialog.create({
    title: 'Important',
    message: [
      'Permission for notifications was denied!',
      '',
      'You must enable Notifications API to receive trade alerts.',
      'Tap on the green lock and select Allow from the Notifications dropdown.'
    ].join('<br>'),
    html: true
  })
}

function showPushUnsupportedDialog (err) {
  Dialog.create({
    title: 'Important',
    message: [
      'Unable to subscribe to Push notifications!',
      '',
      `<code>${get(err, 'response.data.error') || err.message}</code>`
    ].join('<br>'),
    html: true
  })
}

main()
