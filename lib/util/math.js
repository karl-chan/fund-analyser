module.exports = {
    pcToFloat,
    floatToPc,
    computeAndAppendReturns
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

function computeAndAppendReturns(returns, historicPrices, lookbacks) {
    // Null safe check
    if (_.isEmpty(returns) || _.isEmpty(historicPrices) || _.isEmpty(lookbacks)) {
        return returns;
    }

    // Retrieve and remove last record
    // as we don't want last record to be included in search later on
    const latest = historicPrices.pop();
    const latestDate = moment(latest.date);
    const latestPrice = latest.price;

    const newReturns = _.cloneDeep(returns);
    _.forEach(lookbacks, (lookback) => {
        const period = moment.duration(`P${lookback}`);
        const beginDate = latestDate.clone().subtract(period);

        // Date safe check - if no record as old as requirement, abort for current iteration
        if (_.isEmpty(historicPrices) || beginDate.isBefore(historicPrices[0].date)) {
            return;
        }

        const beginRecord = _.minBy(historicPrices, (record) => {
            const recordDate = moment(record.date);
            const millisDiff = recordDate.diff(beginDate);
            return Math.abs(millisDiff);
        });
        const beginPrice = beginRecord.price;

        newReturns[lookback] = (latestPrice - beginPrice) / beginPrice;
    });
    return newReturns;
}