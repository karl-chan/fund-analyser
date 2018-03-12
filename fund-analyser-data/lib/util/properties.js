const path = require('path');
const propertiesPath = path.join(__dirname, '../..', 'app.properties');

const PropertiesReader = require('properties-reader');
const properties = PropertiesReader(propertiesPath);

module.exports = properties;

