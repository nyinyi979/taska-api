"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetCities = exports.handleGetStates = exports.handleGetCountries = void 0;
const data_1 = require("../../data");
const errors_1 = require("../../utils/errors");
const handleGetCountries = (_req, res) => {
    return res.status(200).send({ data: Object.keys(data_1.countryData) });
};
exports.handleGetCountries = handleGetCountries;
const handleGetStates = (req, res) => {
    const { country } = req.query;
    const countryEntry = data_1.countryData[country];
    if (!countryEntry)
        throw new errors_1.NotFoundError(`Country "${country}" was not found.`);
    return res.status(200).send({ data: Object.keys(countryEntry) });
};
exports.handleGetStates = handleGetStates;
const handleGetCities = (req, res) => {
    const { state, country } = req.query;
    const countryEntry = data_1.countryData[country];
    if (!countryEntry)
        throw new errors_1.NotFoundError(`Country "${country}" was not found.`);
    if (!Object.prototype.hasOwnProperty.call(countryEntry, state)) {
        throw new errors_1.NotFoundError(`State "${state}" was not found in ${country}.`);
    }
    return res.status(200).send({ data: countryEntry[state] });
};
exports.handleGetCities = handleGetCities;
