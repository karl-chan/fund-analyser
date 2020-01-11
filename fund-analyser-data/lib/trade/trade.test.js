const trade = require('./trade')
const { Buy, Sell } = require('./Action')

describe('trade', () => {
    describe('decideActions', () => {
        describe('with existing holdings', () => {
            const balance = {
                cash: 0,
                holdings: [
                    { ISIN: 'GB00B99C0657', Sedol: 'B99C065', Quantity: 100 },
                    { ISIN: 'GB0006061963', Sedol: '0606196', Quantity: 50 }
                ]
            }
            test('empty prediction should sell existing holdings', () => {
                const prediction = {
                    funds: []
                }
                const actions = trade.decideActions(prediction, balance)
                expect(actions).toIncludeSameMembers([
                    new Sell('GB00B99C0657', 'B99C065', 100),
                    new Sell('GB0006061963', '0606196', 50)
                ])
            })
            test('non-empty prediction should sell existing holdings', () => {
                const prediction = {
                    funds: [
                        { isin: 'GB00B99C0657', sedol: 'B99C065', name: 'Legg Mason IF Japan Equity Fund Class X Accumulation (Hedged)' }
                    ]
                }
                const actions = trade.decideActions(prediction, balance)
                expect(actions).toIncludeSameMembers([
                    new Sell('GB00B99C0657', 'B99C065', 100),
                    new Sell('GB0006061963', '0606196', 50)
                ])
            })
            test('same predictions should result in no-op', () => {
                const prediction = {
                    funds: [
                        { isin: 'GB00B99C0657', sedol: 'B99C065', name: 'Legg Mason IF Japan Equity Fund Class X Accumulation (Hedged)' },
                        { isin: 'GB0006061963', sedol: '0606196', name: 'Baillie Gifford American Fund B Accumulation' }
                    ]
                }
                const actions = trade.decideActions(prediction, balance)
                expect(actions).toBeArray().toBeEmpty()
            })
        })

        describe('no existing holdings', () => {
            test('empty prediction should result in no-op', () => {
                const balance = { cash: 100, holdings: [] }
                const prediction = {
                    funds: []
                }
                const actions = trade.decideActions(prediction, balance)
                expect(actions).toBeArray().toBeEmpty()
            })

            test('non-positive cash should result in no-op', () => {
                const zeroBalance = { cash: 0, holdings: [] }
                const negativeBalance = { cash: -5, holdings: [] }
                const prediction = {
                    funds: [
                        { isin: 'GB00B99C0657', sedol: 'B99C065', name: 'Legg Mason IF Japan Equity Fund Class X Accumulation (Hedged)' },
                        { isin: 'GB0006061963', sedol: '0606196', name: 'Baillie Gifford American Fund B Accumulation' }
                    ]
                }
                expect(trade.decideActions(prediction, zeroBalance)).toBeArray().toBeEmpty()
                expect(trade.decideActions(prediction, negativeBalance)).toBeArray().toBeEmpty()
            })
            test('non-empty prediction should buy holdings', () => {
                const balance = { cash: 100, holdings: [] }
                const prediction = {
                    funds: [
                        { isin: 'GB00B99C0657', sedol: 'B99C065', name: 'Legg Mason IF Japan Equity Fund Class X Accumulation (Hedged)' },
                        { isin: 'GB0006061963', sedol: '0606196', name: 'Baillie Gifford American Fund B Accumulation' }
                    ]
                }
                const actions = trade.decideActions(prediction, balance)
                expect(actions).toIncludeSameMembers([
                    new Buy('GB00B99C0657', 'B99C065', 50),
                    new Buy('GB0006061963', '0606196', 50)
                ])
            })
        })
    })
})
