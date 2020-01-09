<template lang="pug">
  q-page(padding)
    q-toolbar.bg-teal.q-pa-xs
      // Selection tabs (web / worker)
      q-tabs.bg-white(v-model="category")
        q-tab.text-green-9(label="Web Logs" name="web" icon="public")
        q-tab.text-purple(label="Worker Logs" name="worker" icon="settings")
        q-tab.text-amber-9(label="Compute Logs" name="compute" icon="functions")
      q-input(v-model="filter" filled dark label="Filter logs" color="teal-1"
              style="margin-left: 150px;" clearable)
        template(v-slot:prepend)
         q-icon(name="filter_list")
      q-btn(flat color="white" icon="sync" @click="restartDyno")
        q-tooltip Restart dyno
    // Logs display
    .bg-accent.text-blue-grey-1(v-if="loading & !logs" style="height: 70vh")
      q-spinner-dots.absolute-center(size="xl")
    q-virtual-scroll.round-borders.bg-accent.text-blue-grey-1.shadow-4.q-pa-md(
              v-else :items="filteredLogs"
              style="height: 70vh;")
      template(v-slot="{item, index}")
        q-item(:key="index" dense)
          code(v-html="item")
</template>

<script>
export default {
  name: 'LogsPage',
  created () {
    this.refresh()
    this.poller = setInterval(this.refresh, 30000) // 30 seconds
  },
  data () {
    return {
      loading: false,
      category: 'web',
      logs: '',
      filter: '',
      poller: null
    }
  },
  computed: {
    filteredLogs: function () {
      const lines = this.logs.split('\n')
      const filtered = lines.filter(line => line && line.toLowerCase().includes(this.filter.toLowerCase()))
      const regex = /^(.*) (.*\[.*\]:) (.*)$/
      return filtered
        .map(line => {
          const matches = line.match(regex)
          return matches
            ? `<span class="text-teal-3 text-weight-bold">${matches[1]}</span> ` +
                `<span class="text-lime text-weight-bold">${matches[2]}</span> ` +
                `<span class="text-weight-thin">${matches[3]}</span>`
            : line
        })
    }
  },
  methods: {
    async refresh (clearScreen = false) {
      this.loading = true
      if (clearScreen) {
        this.logs = ''
      }
      this.logs = await this.$services.admin.getLogs(this.category)
      this.loading = false
    },
    async restartDyno () {
      return this.$services.admin.restartDyno(this.category)
    }
  },
  watch: {
    category: {
      handler () {
        this.refresh(true)
      }
    }
  },
  beforeDestroy () {
    if (this.poller) {
      clearInterval(this.poller)
    }
  }
}
</script>
