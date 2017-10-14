module.exports = {
    pcToFloat,
    floatToPc,
    enrichReturns,
    calcPercentiles,
    closestRecord
};

const _ = require('lodash');
const moment = require('moment');

function pcToFloat(pc) {
    return parseFloat(pc) / 100.0;
};

function floatToPc(float) {
    return _.isFinite(float) ? `${float * 100}%` : float;
}

function sedolToIsin(sedol) {
    const isinNoCheckDigit = 'GB00' + sedol;
    const digitString = Array.prototype.map
        .call(isinNoCheckDigit, a => `${parseInt(a, 36)}`)
        .join('');
    const nums = Array.prototype.map.call(digitString, digit => parseInt(digit, 10));
    for (let i = nums.length - 1; i >= 0; i -= 2) {
        nums[i] *= 2;
    }
    const digitSum = _.sumBy(nums, n => {
        return _.sum(Array.prototype.map.call(`${n}`, digit => parseInt(digit, 10)));
    });
    const checkDigit = (10 - digitSum % 10) % 10;
    return `${isinNoCheckDigit}${checkDigit}`;
};

function closestRecord(lookback, historicPrices) {
    // Remove last record as we don't want last record to be included in search later on
    const latestDate = moment.utc(_.last(historicPrices).date);
    const duration = moment.duration(`P${lookback}`);
    const beginDate = latestDate.clone().subtract(duration);

    // Date safe check - if no record as old as requirement, abort for current iteration
    // if (beginDate.isBefore(_.head(historicPrices).date)) {
    //     return null;
    // }

    const beginRecord = _.minBy(historicPrices, (record) => {
        const recordDate = moment.utc(record.date);
        const millisDiff = recordDate.diff(beginDate);
        return recordDate.isBefore(latestDate) ? Math.abs(millisDiff) : Infinity; // don't return same date record
    });
    return beginRecord;
}

function enrichReturns(returns, historicPrices, additionalLookbacks) {
    // Null safe check
    if (_.isEmpty(returns) || _.isEmpty(historicPrices) || _.isEmpty(additionalLookbacks)) {
        return returns;
    }

    const latestPrice = _.last(historicPrices).price;
    const newReturns = _.clone(returns);
    _.forEach(additionalLookbacks, (lookback) => {
        const beginRecord = closestRecord(lookback, historicPrices);
        if (_.isNil(beginRecord)) {
            return;
        }
        const beginPrice = beginRecord.price;
        newReturns[lookback] = (latestPrice - beginPrice) / beginPrice;
    });
    return newReturns;
}

function calcPercentiles(returns, historicPrices, additionalLookbacks) {
    const percentiles = {};

    // Null safe check
    if (_.isEmpty(returns) || _.isEmpty(historicPrices)) {
        return percentiles;
    }

    const lookbacks = _.union(_.keys(returns), additionalLookbacks);
    const latestPrice = _.last(historicPrices).price;
    _.forEach(lookbacks, (lookback) => {
        const beginRecord = closestRecord(lookback, historicPrices);
        if (_.isNil(beginRecord)) {
            return;
        }
        const interestedRecords = _.dropWhile(historicPrices, (record) => moment.utc(record.date).isBefore(beginRecord.date));
        const minPrice = _.minBy(interestedRecords, (record) => record.price).price;
        const maxPrice = _.maxBy(interestedRecords, (record) => record.price).price;
        const percentile = minPrice == maxPrice ? NaN : (latestPrice - minPrice) / (maxPrice - minPrice); // careful division by 0
        percentiles[lookback] = percentile;
    });
    return percentiles;
}