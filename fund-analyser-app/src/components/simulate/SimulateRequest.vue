<template lang="pug">
  q-card
    q-form.q-gutter-md(@submit="onSubmit")
      q-card-section
        q-select(v-model="form.strategy" :options="supportedStrategies" label="Strategy"
                :rules="[requiredRule]")
        fund-search(v-model="form.isins" placeholder="Select funds" :display-isin="true" multiple use-chips)
        .row.q-gutter-x-md
          .col
            q-input(v-model="form.numPortfolio" type="number" label="Num portfolio"
                    :rules="[requiredRule]")
          .col
            q-input(v-model="form.predictionDate" mask="date" label="Prediction date (Optional)" clearable
                    :rules="[val => val? dateRule(val): true]")
              template(v-slot:append)
                q-icon.cursor-pointer(name="event")
                  q-popup-proxy(ref="predictionDateProxy" transition-show="scale" transition-hide="scale")
                    q-date(v-model="form.predictionDate" :options="beforeToday" @input="() => $refs.predictionDateProxy.hide()").

      q-card-actions
        q-btn(icon-right="send" color="secondary" label="Submit" type="submit"
              :disable="!readyToSubmit || loading" :loading="loading")
        q-btn(icon-right="star" color="amber" label="Save" @click="onSave"
              :disable="!readyToSubmit || isAlreadySaved")

</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import get from 'lodash/get'

export default {
  name: 'SimulateRequest',
  props: ['initSimulateParam'],
  data () {
    return {
      form: {
        strategy: null,
        isins: null,
        numPortfolio: null,
        predictionDate: null
      },
      loading: false
    }
  },
  computed: {
    ...mapGetters('account', ['inFavouriteSimulateParams']),
    ...mapState('simulate', ['supportedStrategies']),
    readyToSubmit: function () {
      return this.simulateParam.strategy &&
             this.simulateParam.isins &&
             this.simulateParam.numPortfolio
    },
    simulateParam: function () {
      return {
        strategy: this.form.strategy,
        isins: this.form.isins,
        numPortfolio: parseInt(this.form.numPortfolio)
      }
    },
    predictionDate: function () {
      return (this.form.predictionDate &&
       this.$utils.format.formatDateShort(this.form.predictionDate, true)) ||
       null
    },
    isAlreadySaved: function () {
      return this.inFavouriteSimulateParams(this.simulateParam)
    }
  },
  methods: {
    ...mapActions('account', ['addToFavouriteSimulateParams']),
    ...mapActions('simulate', ['lazySimulate', 'predict']),
    async onSubmit () {
      if (!this.readyToSubmit) {
        return
      }
      this.loading = true
      const [simulation, prediction] = await Promise.all([
        this.lazySimulate(this.simulateParam),
        this.predict({
          simulateParam: this.simulateParam,
          date: this.predictionDate
        })
      ])
      this.loading = false
      this.$emit('response', { simulation, prediction })
    },
    async onSave () {
      if (!this.readyToSubmit) {
        return
      }
      this.addToFavouriteSimulateParams(this.simulateParam)
    },
    beforeToday (date) {
      return this.$utils.date.isBeforeToday(date)
    },
    dateRule (val) {
      return !!this.$utils.date.verifyDate(val) || 'Required'
    },
    requiredRule (val) {
      return !!val || 'Required'
    }
  },
  watch: {
    initSimulateParam: {
      immediate: true,
      handler (initSimulateParam) {
        this.form.strategy = get(this.initSimulateParam, 'strategy', null)
        this.form.isins = get(this.initSimulateParam, 'isins', null)
        this.form.numPortfolio = get(this.initSimulateParam, 'numPortfolio', null)
      }
    }
  }
}
</script>
