<template lang="pug">
q-layout(view="hHh Lpr lFf")
  app-header
  app-drawer
  q-page-container
    tip-of-the-day
    router-view
    q-ajax-bar(color="lime")
</template>

<script>
export default {
  name: 'AppLayout'
}
</script>
