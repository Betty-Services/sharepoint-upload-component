"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showOn = exports.updateOption = void 0;
const component_sdk_1 = require("@betty-blocks/component-sdk");
exports.updateOption = (producer, attrs) => {
    return (key) => ({ ...producer(key), ...attrs });
};
exports.showOn = (key) => ({
    configuration: { condition: component_sdk_1.showIfTrue(key) },
});
