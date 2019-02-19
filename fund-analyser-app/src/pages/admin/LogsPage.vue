<template lang="pug">
  q-page(padding)
    q-toolbar(color="teal")
      // Selection tabs (web / worker)
      q-tabs(v-model="dyno" inverted)
        q-tab(label="Web Logs" slot="title" name="web" icon="public" color="green-9")
        q-tab(default label="Worker Logs" slot="title" name="worker" icon="settings" color="purple")
      q-search(v-model="filter" dark inverted-light color="teal-1" icon="filter_list" placeholder="Filter logs"
              style="margin-left: 100px;" clearable)
    // Logs display
    q-infinite-scroll.bg-dark.round-borders.text-blue-grey-1.shadow-4.q-pa-md(
                      :handler="loadMore" inline style="height: 70vh; overflow-x: hidden; overflow-y: auto")
      code(v-html="logsHtml")
      .row.justify-center
        q-spinner-dots(slot='message' :size='40')
</template>

<script>
export default {
  name: 'LogsPage',
  data () {
    return {
      dyno: undefined,
      logs: '',
      filter: ''
    }
  },
  computed: {
    logsHtml: function () {
      const lines = this.logs.split('\n')
      const filtered = lines.filter(line => line.toLowerCase().includes(this.filter.toLowerCase()))
      const regex = /^(.*) (.*\[.*\]:) (.*)$/
      const html = filtered
        .map(line => {
          const matches = line.match(regex)
          return matches
            ? `<span class="text-teal-3 text-weight-bold">${matches[1]}</span> ` +
                `<span class="text-lime text-weight-bold">${matches[2]}</span> ` +
                `<span class="text-weight-thin">${matches[3]}</span>`
            : line
        })
        .join('<br>')
      return html
    }
  },
  methods: {
    async refresh () {
      this.logs = await this.$services.admin.getLogs(this.dyno)
    },
    async loadMore (index, done) {
      await this.refresh()
      done()
    }
  },
  watch: {
    dyno: {
      handler () {
        this.refresh()
      }
    }
  }
}
</script>
