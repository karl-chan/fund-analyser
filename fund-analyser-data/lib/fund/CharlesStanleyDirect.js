module.exports = CharlesStanleyDirect;

const Fund = require('./Fund.js');
const http = require('../util/http.js');
const math = require('../util/math.js');
const properties = require('../util/properties.js');
const log = require('../util/log.js');
const streamWrapper = require('../util/streamWrapper.js');
const async = require('async');
const _ = require('lodash');
const cheerio = require('cheerio');
const stream = require('stream');
const util = require('util');

function CharlesStanleyDirect() {
    this.pageSize = properties.get('fund.charlesstanleydirect.page.size');
    http.setOptions({
        maxParallelConnections: properties.get('fund.charlesstanleydirect.max.parallel.connections'),
        retryInterval: properties.get('fund.charlesstanleydirect.retry.interval')
    });
}

CharlesStanleyDirect.prototype.getFunds = function (callback) {
    async.waterfall([
        this.getNumPages.bind(this),
        this.getPageRange.bind(this),
        this.getSedolsFromPages.bind(this),
        this.getFundsFromSedols.bind(this)
    ], callback);
};

CharlesStanleyDirect.prototype.getSedols = function (callback) {
    async.waterfall([
        this.getNumPages.bind(this),
        this.getPageRange.bind(this),
        this.getSedolsFromPages.bind(this)
    ], callback);
};

CharlesStanleyDirect.prototype.getNumPages = function (callback) {
    const url = `https://www.charles-stanley-direct.co.uk/InvestmentSearch/Search?Category=Funds&Pagesize=${this.pageSize}`;
    http.gets(url, (err, res, body) => {
        if (err) {
            return callback(err);
        }
        const $ = cheerio.load(body);
        const lastPage = parseInt($('#search-results-top > p > em:last-child').text());
        log.debug('Total number of pages: %d', lastPage);
        return callback(null, lastPage);
    });
};

CharlesStanleyDirect.prototype.getSedolsFromPage = function (page, callback) {
    const url = `https://www.charles-stanley-direct.co.uk/InvestmentSearch/Search?sortdirection=ASC&SearchType=KeywordSearch&Category=Funds&SortColumn=TER&SortDirection=DESC&Pagesize=${this.pageSize}&Page=${page}`;
    http.gets(url, (err, res, body) => {
        if (err) {
            return callback(err);
        }
        const $ = cheerio.load(body);
        const sedols = $('#funds-table').find('tbody td:nth-child(3)').map((i, td) => $(td).text().trim()).get();
        log.debug('Sedols in page %d: %j', page, sedols);
        return callback(null, sedols);
    });
};

/**
 * ONLY PARTIAL FUND IS RETURNED!! (with isin and bid ask spread as % of price)
 * @param sedol
 * @param callback
 */
CharlesStanleyDirect.prototype.getFundFromSedol = function (sedol, callback) {
    const url = `https://www.charles-stanley-direct.co.uk/ViewFund?Sedol=${sedol}`;
    http.gets(url, (err, res, body) => {
        if (err) {
            return callback(err);
        }
        const $ = cheerio.load(body);
        const isinRegex = /[A-Z0-9]{12}/;
        let isin = undefined;
        try {
            isin = $('.para').text().match(isinRegex)[0];
        } catch (err) {
            log.error("Invalid page for sedol on Charles Stanley: %s", sedol);
            return callback(null, undefined); // return undefined so that it will continue all the way to FundDAO and get rejected
        }

        // bid ask
        const floatRegex = /[0-9]+(\.[0-9]+)?/;
        const bidPrice = parseFloat($('.fund-summary ul li:nth-child(1)').text().match(floatRegex)[0]);
        const askPrice = parseFloat($('.fund-summary ul li:nth-child(2)').text().match(floatRegex)[0]);
        const midPrice = (bidPrice + askPrice) / 2;
        const bidAskSpread = (bidPrice - askPrice) / midPrice;

        // initial charge
        const entryCharge = math.pcToFloat($('#main div.panel--light-grey  div:nth-child(6) tr:nth-child(2) > td:nth-child(2)').text());

        const partialFund = Fund.Builder(isin)
            .sedol(sedol)
            .bidAskSpread(bidAskSpread)
            .entryCharge(entryCharge)
            .build();
        log.debug('Isin: %s found for sedol: %s - bid ask spread: %d, entry charge: %d', isin, sedol, bidAskSpread, entryCharge);
        return callback(null, partialFund);
    });
};

CharlesStanleyDirect.prototype.getPageRange = function (lastPage, callback) {
    callback(null, _.range(1, lastPage + 1));
};

CharlesStanleyDirect.prototype.getSedolsFromPages = function (pages, callback) {
    async.map(pages, this.getSedolsFromPage.bind(this), (err, sedols) => callback(err, _.flatten(sedols)));
};

CharlesStanleyDirect.prototype.getFundsFromSedols = function (sedols, callback) {
    async.map(sedols, this.getFundFromSedol.bind(this), callback);
};

/**
 * Analogous stream methods below
 */
CharlesStanleyDirect.prototype.streamFunds = function () {
    return this.streamNumPages()
        .pipe(this.streamPageRange())
        .pipe(this.streamSedolsFromPages())
        .pipe(this.streamFundsFromSedols());
};
CharlesStanleyDirect.prototype.streamNumPages = function () {
    return streamWrapper.asReadable(this.getNumPages.bind(this));
};
CharlesStanleyDirect.prototype.streamPageRange = function () {
    return streamWrapper.asTransform(this.getPageRange.bind(this));
};
CharlesStanleyDirect.prototype.streamSedolsFromPages = function () {
    return streamWrapper.asTransform(this.getSedolsFromPage.bind(this));
};
CharlesStanleyDirect.prototype.streamFundsFromSedols = function () {
    return streamWrapper.asParallelTransform(this.getFundFromSedol.bind(this));
};
