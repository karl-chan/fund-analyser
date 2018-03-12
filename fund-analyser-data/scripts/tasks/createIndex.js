module.exports = createIndex;

const async = require('async');
const db = require('../../lib/util/db.js');

/**
 * Create index on popular fields for sorting
 * @param callback
 */
async function createIndex() {
    await db.getFunds().dropIndexes()    
    const periods = ['1D', '3D', '1W', '2W', '1M', '3M', '6M', '1Y', '3Y', '5Y']
    for(let period of periods) {
        await db.getFunds().createIndex({[`returns.${period}`]: 1}, {background: true})        
    }
    await db.getFunds().createIndex({asof: 1}, {background: true})
    // text index for searching
    await db.getFunds().createIndex(
        {isin: 'text', sedol: 'text', name: 'text', 'holdings.name': 'text', 'holdings.symbol': 'text'}, 
        {background: true, weights: {name: 10, isin: 5, sedol: 5, 'holdings.name': 1, 'holdings.symbol': 1}}
    )
}