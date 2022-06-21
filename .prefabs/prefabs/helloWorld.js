"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_sdk_1 = require("@betty-blocks/component-sdk");
const utils_1 = require("../utils");
const attributes = {
    category: 'CONTENT',
    icon: component_sdk_1.Icon.TextInputIcon,
};
const options = {
    content: component_sdk_1.variable('Content', { value: ['This is my first component!'] }),
    type: component_sdk_1.font('Type', { value: 'Title1' }),
    align: component_sdk_1.buttongroup('Align', [
        ['Left', 'left'],
        ['Center', 'center'],
        ['Right', 'right'],
    ], { value: 'left' }),
    padding: component_sdk_1.buttongroup('Padding', [
        ['None', 'none'],
        ['Dense', 'dense'],
        ['Normal', 'normal'],
    ], { value: 'normal' }),
    color: component_sdk_1.color('Text color', {
        value: component_sdk_1.ThemeColor.BLACK,
        ...utils_1.showOn('styles'),
    }),
};
exports.default = component_sdk_1.prefab('Hello World', attributes, null, [
    component_sdk_1.component('HelloWorld', { options }, []),
]);
