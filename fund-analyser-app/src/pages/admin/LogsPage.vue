<template lang="pug">
  q-page(padding)
    q-toolbar.bg-teal.q-pa-xs
      // Selection tabs (web / worker)
      q-tabs.bg-white(v-model="category")
        q-tab.text-green-9(label="Web Logs" name="web" icon="public")
        q-tab.text-purple(label="Worker Logs" name="worker" icon="settings")
        q-tab.text-amber-9(label="Compute Logs" name="compute" icon="functions")
        q-tab.text-blue-9(label="Test Report" name="test-report" icon="assignment_turned_in")
      q-input(v-model="filter" filled dark label="Filter logs" color="teal-1"
              style="margin-left: 150px;" clearable)
        template(v-slot:prepend)
         q-icon(name="filter_list")
      q-btn(flat color="white" icon="sync" @click="restartDyno")
        q-tooltip Restart dyno
    // Logs display
    .bg-accent.text-blue-grey-1(v-if="loading" style="height: 70vh")
      q-spinner-dots.absolute-center(size="xl")
    q-virtual-scroll.round-borders.bg-accent.text-blue-grey-1.shadow-4.q-pa-md(
              v-if="isLogsCategory && !loading"
              :items="filteredLogs"
              style="height: 70vh;")
      template(v-slot="{item, index}")
        q-item(:key="index" dense)
          code(v-html="item")
    iframe(v-if="isTestReportCategory && !loading"
           :srcdoc="testReport" style="height: 70vh; width: 100%")

</template>

<script>
export default {
  name: 'LogsPage',
  created () {
    this.refresh()
    this.poller = setInterval(() => {
      if (this.isLogsCategory) {
        this.refresh()
      }
    }, 30000) // 30 seconds
  },
  data () {
    return {
      loading: false,
      category: 'web',
      logs: '',
      testReport: '',
      filter: '',
      poller: null
    }
  },
  computed: {
    filteredLogs: function () {
      const lines = this.logs.split('\n')
      const filtered = lines.filter(line => line && line.toLowerCase().includes(this.filter ? this.filter.toLowerCase() : ''))
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
    },
    isLogsCategory: function () {
      return ['web', 'worker', 'compute'].includes(this.category)
    },
    isTestReportCategory: function () {
      return this.category === 'test-report'
    }
  },
  methods: {
    async refresh () {
      if (this.isLogsCategory) {
        this.loading = true
        this.logs = await this.$services.admin.getLogs(this.category)
        this.loading = false
      } else if (this.isTestReportCategory) {
        this.loading = true
        this.testReport = await this.$services.admin.getTestReport()
        this.loading = false
      }
    },
    async restartDyno () {
      return this.$services.admin.restartDyno(this.category)
    }
  },
  watch: {
    category: {
      handler () {
        this.refresh()
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
