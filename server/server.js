const properties = require('../lib/util/properties.js');
const db = require('../lib/util/db.js');
const log = require('../lib/util/log.js');

const FundDAO = require('../lib/db/FundDAO.js');

const _ = require('lodash');
const stringify = require('streaming-json-stringify');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const app = express();

app.set('port', (process.env.PORT || properties.get('server.default.port')));

app.get('/api/funds', (req, res) => {
    const fields = req.query.fields || ''; // comma delimited string of fields to return
    const format = req.query.format || 'json'; // should be csv or json (default)
    const fileName = req.query.fileName || 'Fund List.csv'; // for csv case only
    const skip = req.query.skip;
    const limit = req.query.limit;

    const project = fields ? _.zipObject(fields.split(','), Array(fields.split(',').length).fill(1)) : undefined;
    const options = {
        project: project,
        skip: skip? _.parseInt(skip): undefined,
        limit: limit ? _.parseInt(limit) : undefined
    };

    res.status(200);
    res.set('Access-Control-Allow-Origin', '*');
    switch (format) {
        case 'csv':
            res.set('Content-Disposition', `attachment; filename=${fileName}`);
            res.set('Content-type', 'text/csv');
            const csvStream = FundDAO.streamCsv(options, fields);
            const stream = csvStream.pipe(stringify()).pipe(res);
            stream.on('error', (err) => {
                return serverError(res, err);
            });
            stream.on('end', () => {
                res.end();
            });
            break;
        default: // including json
            res.set('Content-type', 'application/json');
            FundDAO.listFunds(options, (err, funds) => {
                if (err) {
                    return serverError(res, err);
                }
                res.json(funds);
            })
            //const fundStream = FundDAO.streamFunds(options);
            //fundStream.pipe(stringify()).pipe(res);
            //fundStream.on('error', (err) => {
            //    return serverError(res, err);
            //});
            //fundStream.on('end', () => {
            //    res.end();
            //});
    }
});

const serverError = (res, err) => {
    log.error(err);
    res.sendStatus(500);
};

app.listen(app.get('port'), async () => {
    try {
        await db.init();
    } catch (err) {
        log.error(err);
    }
    log.info('Connected to MongoDB');
    log.info('Fund analyser data server is running on port', app.get('port'));
});