<template lang="pug">
.column.q-gutter-y-sm(v-if="stock")
  div
    q-chip(square :color="stock.fundamentals.beta > 1? 'green': 'red'" text-color="white")
      | Beta: {{ $utils.format.formatNumber(stock.fundamentals.beta) }}
    q-chip(square :color="stock.fundamentals.eps > 80? 'green': 'red'" text-color="white")
      | EPS: {{ $utils.format.formatNumber(stock.fundamentals.eps) }}
    q-chip(square :color="stock.fundamentals.marketCap > 10_000_000_000? 'green': 'red'" text-color="white")
      | Market Cap: {{ $utils.format.formatNumber(stock.fundamentals.marketCap) }}
    q-chip(square :color="stock.fundamentals.pbRatio < 1? 'green': 'red'" text-color="white")
      | P/B ratio: {{ $utils.format.formatNumber(stock.fundamentals.pbRatio) }}
    q-chip(square :color="stock.fundamentals.peRatio < 25? 'green': 'red'" text-color="white")
      | P/E ratio: {{ $utils.format.formatNumber(stock.fundamentals.peRatio) }}
    q-chip(square :color="stock.fundamentals.psRatio < 2? 'green': 'red'" text-color="white")
      | P/S ratio: {{ $utils.format.formatNumber(stock.fundamentals.psRatio) }}
</template>

<script>
export default {
  name: 'StockFundamentals',
  props: ['stock'],
}
</script>
