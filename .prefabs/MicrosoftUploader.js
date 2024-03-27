"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const component_sdk_1 = require("@betty-blocks/component-sdk");
const beforeCreate = ({ close, components: { Content, Dropdown, Field, Footer, Header, FormField, Toggle, PropertySelector, Label, TextInput: Text, CircleQuestion, BBTooltip, }, prefab: originalPrefab, save, helpers, }) => {
    const { BettyPrefabs, prepareInput, PropertyKind, useModelIdSelector, useActionIdSelector, usePrefabSelector, usePropertyQuery, setOption, createUuid, useModelQuery, createBlacklist, useModelRelationQuery, } = helpers;
    const [propertyPath, setProperty] = React.useState('');
    const [variableInput, setVariableInput] = React.useState(null);
    const modelId = useModelIdSelector();
    const actionId = useActionIdSelector();
    const selectedPrefab = usePrefabSelector();
    const [model, setModel] = React.useState(null);
    const [propertyBased, setPropertyBased] = React.useState(!!modelId);
    const [prefabSaved, setPrefabSaved] = React.useState(false);
    const [validationMessage, setValidationMessage] = React.useState('');
    const [propertyData, setPropertyData] = React.useState({
        name: undefined,
        propertyModelId: '',
        propertyKind: PropertyKind.TEXT,
    });
    const { name, propertyModelId, propertyKind } = propertyData;
    const modelRequest = useModelQuery({
        variables: { id: modelId },
        onCompleted: (result) => {
            setModel(result.model);
        },
    });
    const validate = () => {
        if (modelRequest.loading) {
            setValidationMessage('Model details are still loading, please try submitting again.');
            return false;
        }
        return true;
    };
    const componentId = createUuid();
    function isProperty(path) {
        return (typeof path !== 'string' &&
            typeof path === 'object' &&
            !Array.isArray(path));
    }
    let propertyId;
    if (isProperty(propertyPath)) {
        const { id } = propertyPath;
        propertyId = Array.isArray(id) ? id[id.length - 1] : id;
    }
    else {
        propertyId = propertyPath;
    }
    const propertyResponse = usePropertyQuery(propertyId);
    React.useEffect(() => {
        if (!(propertyResponse.loading || propertyResponse.error)) {
            if (propertyResponse.data) {
                setPropertyData({
                    name: propertyResponse.data.property.label,
                    propertyKind: propertyResponse.data.property.kind,
                    propertyModelId: propertyResponse.data.property.referenceModel?.id,
                });
            }
        }
    }, [propertyId, propertyResponse]);
    const modelRelationResponse = useModelRelationQuery(propertyModelId);
    let relationalProperties;
    let modelProperty;
    if (!(modelRelationResponse.loading || modelRelationResponse.error)) {
        if (modelRelationResponse.data) {
            relationalProperties = modelRelationResponse.data.model.properties;
            modelProperty = relationalProperties.find((property) => property.name === 'id');
        }
    }
    const unsupportedKinds = createBlacklist([
        'BOOLEAN',
        'DECIMAL',
        'INTEGER',
        'PRICE',
        'SERIAL',
        'STRING',
        'TEXT',
    ]);
    const structure = originalPrefab.structure[0];
    if (structure.type !== 'COMPONENT')
        return React.createElement("div", null,
            "expected component prefab, found ",
            structure.type);
    const handlePropertyChange = (propertyOrId) => {
        setProperty(propertyOrId);
    };
    if (!actionId && !prefabSaved) {
        setPrefabSaved(true);
        save(originalPrefab);
    }
    const actionVariableOptionType = structure.options.find((option) => option.type === 'ACTION_JS_VARIABLE');
    const actionVariableOption = actionVariableOptionType?.key || null;
    const labelOptionKey = 'label';
    const nameOptionKey = 'actionVariableId';
    return (React.createElement(React.Fragment, null,
        React.createElement(Header, { onClose: close, title: "Configure form input field" }),
        React.createElement(Content, null,
            modelId && (React.createElement(Field, { label: "Property based input" },
                React.createElement(FormField, { onClick: () => {
                        setVariableInput(null);
                        setPropertyBased(!propertyBased);
                        setProperty('');
                        setPropertyData({
                            name: undefined,
                            propertyKind: PropertyKind.TEXT,
                            propertyModelId: '',
                        });
                    } },
                    React.createElement(Toggle, { color: "purple", checked: propertyBased, onChange: () => { } })))),
            propertyBased ? (React.createElement(Field, { label: "Property", error: validationMessage && (React.createElement(Text, { color: "#e82600" }, validationMessage)) },
                React.createElement(PropertySelector, { allowRelations: true, disabledNames: ['created_at', 'updated_at'], disabledKinds: unsupportedKinds, showFormat: false, size: "large", onChange: handlePropertyChange, value: propertyPath, modelId: modelId }))) : (React.createElement(React.Fragment, null,
                React.createElement(Field, null,
                    React.createElement(Label, null,
                        "Action input variable",
                        React.createElement(CircleQuestion, { color: "grey500", size: "medium", "data-tip": "You can use this action input variable in the action itself.", "data-for": "variable-tooltip" })),
                    React.createElement(BBTooltip, { id: "variable-tooltip", place: "top", type: "dark", effect: "solid" }),
                    React.createElement(Text, { onChange: (e) => setVariableInput(e.target.value), color: "orange" })),
                React.createElement(Field, null,
                    React.createElement(Label, null, "Kind"),
                    React.createElement(Dropdown, { onChange: (e) => setPropertyData({
                            name,
                            propertyKind: e.target.value,
                            propertyModelId,
                        }) },
                        React.createElement("option", { value: PropertyKind.TEXT }, "Text"),
                        React.createElement("option", { value: PropertyKind.INTEGER }, "Number"),
                        React.createElement("option", { value: PropertyKind.BOOLEAN }, "Checkbox")))))),
        React.createElement(Footer, { onClose: close, canSave: (propertyPath && !!name) || variableInput, onSave: async () => {
                // eslint-disable-next-line no-param-reassign
                structure.id = componentId;
                const kind = propertyKind || 'STRING';
                const variableName = variableInput || name;
                const result = await prepareInput(actionId, variableName, kind, propertyKind, propertyResponse?.data?.property);
                const newPrefab = { ...originalPrefab };
                if (newPrefab.structure[0].type !== 'COMPONENT') {
                    throw new Error('expected Component');
                }
                setOption(newPrefab.structure[0], actionVariableOption, (option) => ({
                    ...option,
                    value: variableName,
                    configuration: {
                        condition: {
                            type: 'SHOW',
                            option: 'property',
                            comparator: 'EQ',
                            value: '',
                        },
                    },
                }));
                setOption(newPrefab.structure[0], labelOptionKey, (option) => ({
                    ...option,
                    value: [variableName],
                }));
                if (originalPrefab.name === BettyPrefabs.SELECT ||
                    originalPrefab.name === BettyPrefabs.RADIO) {
                    setOption(newPrefab.structure[0], 'property', (option) => ({
                        ...option,
                        value: {
                            id: propertyId,
                            type: 'PROPERTY',
                            componentId: selectedPrefab?.id,
                        },
                    }));
                }
                setOption(newPrefab.structure[0], nameOptionKey, (option) => ({
                    ...option,
                    value: result.variable.variableId,
                }));
                if (propertyBased) {
                    setOption(newPrefab.structure[0], 'property', (originalOption) => ({
                        ...originalOption,
                        value: {
                            id: result.isRelational && !result.isMultiRelational
                                ? [propertyId, modelProperty.id]
                                : propertyId,
                            type: 'PROPERTY',
                            name: result.isRelational && !result.isMultiRelational
                                ? `{{ ${model?.name}.${name}.id }}`
                                : `{{ ${model?.name}.${name} }}`,
                        },
                    }));
                }
                if (validate()) {
                    if ((selectedPrefab?.name === BettyPrefabs.UPDATE_FORM ||
                        ((selectedPrefab?.name === BettyPrefabs.CREATE_FORM ||
                            selectedPrefab?.name === BettyPrefabs.FORM ||
                            selectedPrefab?.name === BettyPrefabs.LOGIN_FORM) &&
                            originalPrefab.name === BettyPrefabs.HIDDEN)) &&
                        propertyId) {
                        const valueOptions = [
                            {
                                id: result.isRelational && !result.isMultiRelational
                                    ? [propertyId, modelProperty.id]
                                    : propertyId,
                                type: 'PROPERTY',
                                name: result.isRelational && !result.isMultiRelational
                                    ? `{{ ${model?.name}.${name}.id }}`
                                    : `{{ ${model?.name}.${name} }}`,
                            },
                        ];
                        setOption(newPrefab.structure[0], 'value', (option) => ({
                            ...option,
                            value: option.type === 'VARIABLE'
                                ? valueOptions
                                : propertyId,
                        }));
                    }
                }
                save({ ...originalPrefab, structure: [newPrefab.structure[0]] });
            } })));
};
const attributes = {
    category: 'FORM',
    icon: component_sdk_1.Icon.FileInputIcon,
    keywords: ['Form', 'File', 'Microsoft', 'Large File', 'Upload'],
};
const options = {
    actionVariableId: component_sdk_1.option('ACTION_JS_VARIABLE', {
        label: 'Filename input variable',
        value: '',
    }),
    actionVariableFileId: component_sdk_1.option('ACTION_JS_VARIABLE', {
        label: 'File ID input variable',
        value: '',
    }),
    buttonText: component_sdk_1.variable('Button text', { value: ['Upload file'] }),
    authenticationType: component_sdk_1.option('CUSTOM', {
        value: 'client',
        label: 'Authentication Type',
        configuration: {
            as: 'BUTTONGROUP',
            dataType: 'string',
            allowedInput: [
                { name: 'Login Popup', value: 'client' },
                { name: 'Access Token via Model', value: 'accessToken' },
                { name: 'Accesstoken from action', value: 'action' },
            ],
        },
    }),
    clientId: component_sdk_1.variable('Client ID', {
        configuration: {
            condition: {
                type: 'SHOW',
                option: 'authenticationType',
                comparator: 'EQ',
                value: 'client',
            },
        },
    }),
    tenantId: component_sdk_1.variable('Tenant ID', {
        configuration: {
            condition: {
                type: 'SHOW',
                option: 'authenticationType',
                comparator: 'EQ',
                value: 'client',
            },
        },
    }),
    redirectUri: component_sdk_1.variable('Redirect URI', {
        configuration: {
            condition: {
                type: 'SHOW',
                option: 'authenticationType',
                comparator: 'EQ',
                value: 'client',
            },
        },
    }),
    accessToken: component_sdk_1.variable('Access Token', {
        configuration: {
            condition: {
                type: 'SHOW',
                option: 'authenticationType',
                comparator: 'EQ',
                value: 'accessToken',
            },
        },
    }),
    actionId: component_sdk_1.variable('Action ID', {
        configuration: {
            condition: {
                type: 'SHOW',
                option: 'authenticationType',
                comparator: 'EQ',
                value: 'action',
            },
        },
    }),
    rootFolder: component_sdk_1.variable('Root folder', {
        value: ['/me/drive/root:/'],
    }),
    accept: component_sdk_1.variable('Accept files', {
        value: ['image/*'],
    }),
    maxSize: component_sdk_1.number('Maximum file size (MB)', { value: 50 }),
    color: component_sdk_1.color('Progress color', {
        value: component_sdk_1.ThemeColor.PRIMARY,
        configuration: {
            condition: {
                type: 'SHOW',
                option: 'styles',
                comparator: 'EQ',
                value: true,
            },
        },
    }),
    readyColor: component_sdk_1.color('Ready color', {
        value: component_sdk_1.ThemeColor.SUCCESS,
        configuration: {
            condition: {
                type: 'SHOW',
                option: 'styles',
                comparator: 'EQ',
                value: true,
            },
        },
    }),
    margin: component_sdk_1.option('CUSTOM', {
        value: 'normal',
        label: 'Margin',
        configuration: {
            as: 'BUTTONGROUP',
            dataType: 'string',
            allowedInput: [
                { name: 'None', value: 'none' },
                { name: 'Dense', value: 'dense' },
                { name: 'Normal', value: 'normal' },
            ],
        },
    }),
    fullWidth: component_sdk_1.toggle('Full Width', { value: true }),
    hideLabel: component_sdk_1.toggle('Hide label', {
        value: false,
        configuration: {
            condition: {
                type: 'SHOW',
                option: 'styles',
                comparator: 'EQ',
                value: true,
            },
        },
    }),
    labelColor: component_sdk_1.color('Label color', {
        value: component_sdk_1.ThemeColor.BLACK,
        configuration: {
            condition: {
                type: 'SHOW',
                option: 'styles',
                comparator: 'EQ',
                value: true,
            },
        },
    }),
    advancedSettings: component_sdk_1.toggle('Advanced Settings', { value: false }),
    nameAttribute: component_sdk_1.variable('Name attribute', {
        configuration: {
            condition: {
                type: 'SHOW',
                option: 'advancedSettings',
                comparator: 'EQ',
                value: true,
            },
        },
    }),
    idAttribute: component_sdk_1.variable('Id Attribute', {
        configuration: {
            condition: {
                type: 'SHOW',
                option: 'advancedSettings',
                comparator: 'EQ',
                value: true,
            },
        },
    }),
};
const hooks = {};
exports.default = component_sdk_1.prefab('Microsoft Uploader', attributes, beforeCreate, [
    component_sdk_1.component('MicrosoftUploader', { options, ...hooks }, []),
]);
