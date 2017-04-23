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
    returns: {
        '5Y': {
            label: '5Y',
            value: (row, field, data) => {
                return toPercentage(row.returns['5Y']);
            }
        },
        '3Y': {
            label: '3Y',
            value: (row, field, data) => {
                return toPercentage(row.returns['3Y']);
            }
        },
        '1Y': {
            label: '1Y',
            value: (row, field, data) => {
                return toPercentage(row.returns['1Y']);
            }
        },
        '6M': {
            label: '6M',
            value: (row, field, data) => {
                return toPercentage(row.returns['6M']);
            }
        },
        '3M': {
            label: '3M',
            value: (row, field, data) => {
                return toPercentage(row.returns['3M']);
            }
        },
        '1M': {
            label: '1M',
            value: (row, field, data) => {
                return toPercentage(row.returns['1M']);
            }
        },
        '2W': {
            label: '2W',
            value: (row, field, data) => {
                return toPercentage(row.returns['2W']);
            }
        },
        '1W': {
            label: '1W',
            value: (row, field, data) => {
                return toPercentage(row.returns['1W']);
            }
        },
        '3D': {
            label: '3D',
            value: (row, field, data) => {
                return toPercentage(row.returns['3D']);
            }
        },
        '1D': {
            label: '1D',
            value: (row, field, data) => {
                return toPercentage(row.returns['1D']);
            }
        }
    },
    holdings: {
        label: 'Holdings',
        value: 'holdings'
    }
};

const mapFields = (fields) => {
    return _.map(fields, f => _.get(fieldMapping, f));
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
    return _.isNaN(pc) ? '' : pc;
};

module.exports = {
    fieldMapping,
    mapFields,
    streamParser
};


