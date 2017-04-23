module.exports = CharlesStanleyDirect;

const http = require('../util/http.js');
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

CharlesStanleyDirect.prototype.getIsins = function (callback) {
    async.waterfall([
        this.getNumPages.bind(this),
        this.getPageRange.bind(this),
        this.getSedolsFromPages.bind(this),
        this.getIsinsFromSedols.bind(this)
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

CharlesStanleyDirect.prototype.getIsinFromSedol = function (sedol, callback) {
    const url = `https://www.charles-stanley-direct.co.uk/ViewFund?Sedol=${sedol}`;
    http.gets(url, (err, res, body) => {
        if (err) {
            return callback(err);
        }
        const $ = cheerio.load(body);
        const isinRegex = /[A-Z0-9]{12}/;
        const isin = $('.para').text().match(isinRegex)[0];
        log.debug('Isin: %s found for sedol: %s', isin, sedol);
        return callback(null, isin);
    });
};

CharlesStanleyDirect.prototype.getPageRange = function (lastPage, callback) {
    callback(null, _.range(1, lastPage + 1));
};

CharlesStanleyDirect.prototype.getSedolsFromPages = function (pages, callback) {
    async.map(pages, this.getSedolsFromPage.bind(this), (err, sedols) => callback(err, _.flatten(sedols)));
};

CharlesStanleyDirect.prototype.getIsinsFromSedols = function (sedols, callback) {
    async.map(sedols, this.getIsinFromSedol.bind(this), callback);
};

/**
 * Analogous stream methods below
 */
CharlesStanleyDirect.prototype.streamIsins = function () {
    return this.streamNumPages()
        .pipe(this.streamPageRange())
        .pipe(this.streamSedolsFromPages())
        .pipe(this.streamIsinsFromSedols());
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
CharlesStanleyDirect.prototype.streamIsinsFromSedols = function () {
    return streamWrapper.asParallelTransform(this.getIsinFromSedol.bind(this));
};
