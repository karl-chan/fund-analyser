const json2csvStream = require('json2csv-stream');

const _ = require('lodash');
const math = require('./math.js');

const fieldMapping = {
    isin: {
        label: 'ISIN',
        value: 'isin'
    },
    name: {
        label: 'Name',
        value: 'name'
    },
    type: {
        label: 'Type',
        value: 'type'
    },
    shareClass: {
        label: 'Share Class',
        value: 'shareClass'
    },
    frequency: {
        label: 'Pricing Frequency',
        value: 'frequency'
    },
    ocf: {
        label: 'OCF',
        value: (row, field, data) => {
            return toPercentage(row.ocf);
        }
    },
    amc: {
        label: 'AMC',
        value: (row, field, data) => {
            return toPercentage(row.amc);
        }
    },
    entryCharge: {
        label: 'Entry Charge',
        value: (row, field, data) => {
            return toPercentage(row.entryCharge);
        }
    },
    exitCharge: {
        label: 'Exit Charge',
        value: (row, field, data) => {
            return toPercentage(row.exitCharge);
        }
    },
    bidAskSpread: {
        label: 'Bid-Ask Spread',
        value: (row, field, data) => {
            return toPercentage(row.bidAskSpread);
        }
    },
    returns: {
        '5Y': {
            label: 'returns.5Y',
            value: (row, field, data) => {
                return toPercentage(row.returns['5Y']);
            }
        },
        '3Y': {
            label: 'returns.3Y',
            value: (row, field, data) => {
                return toPercentage(row.returns['3Y']);
            }
        },
        '1Y': {
            label: 'returns.1Y',
            value: (row, field, data) => {
                return toPercentage(row.returns['1Y']);
            }
        },
        '6M': {
            label: 'returns.6M',
            value: (row, field, data) => {
                return toPercentage(row.returns['6M']);
            }
        },
        '3M': {
            label: 'returns.3M',
            value: (row, field, data) => {
                return toPercentage(row.returns['3M']);
            }
        },
        '1M': {
            label: 'returns.1M',
            value: (row, field, data) => {
                return toPercentage(row.returns['1M']);
            }
        },
        '2W': {
            label: 'returns.2W',
            value: (row, field, data) => {
                return toPercentage(row.returns['2W']);
            }
        },
        '1W': {
            label: 'returns.1W',
            value: (row, field, data) => {
                return toPercentage(row.returns['1W']);
            }
        },
        '3D': {
            label: 'returns.3D',
            value: (row, field, data) => {
                return toPercentage(row.returns['3D']);
            }
        },
        '1D': {
            label: 'returns.1D',
            value: (row, field, data) => {
                return toPercentage(row.returns['1D']);
            }
        }
    },
    percentiles: {
        '5Y': {
            label: 'percentiles.5Y',
            value: (row, field, data) => {
                return toPercentage(row.percentiles['5Y']);
            }
        },
        '3Y': {
            label: 'percentiles.3Y',
            value: (row, field, data) => {
                return toPercentage(row.percentiles['3Y']);
            }
        },
        '1Y': {
            label: 'percentiles.1Y',
            value: (row, field, data) => {
                return toPercentage(row.percentiles['1Y']);
            }
        },
        '6M': {
            label: 'percentiles.6M',
            value: (row, field, data) => {
                return toPercentage(row.percentiles['6M']);
            }
        },
        '3M': {
            label: 'percentiles.3M',
            value: (row, field, data) => {
                return toPercentage(row.percentiles['3M']);
            }
        },
        '1M': {
            label: 'percentiles.1M',
            value: (row, field, data) => {
                return toPercentage(row.percentiles['1M']);
            }
        },
        '2W': {
            label: 'percentiles.2W',
            value: (row, field, data) => {
                return toPercentage(row.percentiles['2W']);
            }
        },
        '1W': {
            label: 'percentiles.1W',
            value: (row, field, data) => {
                return toPercentage(row.percentiles['1W']);
            }
        },
        '3D': {
            label: 'percentiles.3D',
            value: (row, field, data) => {
                return toPercentage(row.percentiles['3D']);
            }
        },
        '1D': {
            label: 'percentiles.1D',
            value: (row, field, data) => {
                return toPercentage(row.percentiles['1D']);
            }
        }
    },
    holdings: {
        label: 'Holdings',
        value: 'holdings'
    },
    latest: {
        label: 'Latest Date',
        value: 'latest'
    },
};

const formatFields = (fields) => {
    return _.map(fields, f => _.get(fieldMapping, f, f));
}

const streamParser = (headerFields) => {
    const parser = new json2csvStream();
    parser.on('header', (data) => {
        console.log('Header:');
        console.log(data);
    })
    parser.on('line', (data) => {
        console.log('Line: ');
        console.log(data);
    });
    return parser;
}

const toPercentage = (v) => {
    const pc = math.floatToPc(v);
    return _.isString(pc)? pc: '';
};

module.exports = {
    formatFields,
    streamParser
};


