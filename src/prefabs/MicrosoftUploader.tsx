import * as React from 'react';
import {
  prefab,
  component,
  option as optionFunction,
  variable,
  Icon,
  BeforeCreateArgs,
  PrefabComponentOption,
  option,
  number,
  color,
  ThemeColor,
  toggle,
} from '@betty-blocks/component-sdk';

const beforeCreate = ({
  close,
  components: {
    Content,
    Dropdown,
    Field,
    Footer,
    Header,
    FormField,
    Toggle,
    PropertySelector,
    Label,
    TextInput: Text,
    CircleQuestion,
    BBTooltip,
  },
  prefab: originalPrefab,
  save,
  helpers,
}: BeforeCreateArgs) => {
  const {
    BettyPrefabs,
    prepareInput,
    PropertyKind,
    useModelIdSelector,
    useActionIdSelector,
    usePrefabSelector,
    usePropertyQuery,
    setOption,
    createUuid,
    useModelQuery,
    createBlacklist,
    useModelRelationQuery,
  } = helpers;

  const [propertyPath, setProperty] = React.useState<any>('');
  const [variableInput, setVariableInput] = React.useState(null);
  const modelId = useModelIdSelector();
  const actionId = useActionIdSelector();
  const selectedPrefab = usePrefabSelector();
  const [model, setModel] = React.useState<any>(null);
  const [propertyBased, setPropertyBased] = React.useState(!!modelId);
  const [prefabSaved, setPrefabSaved] = React.useState(false);

  const [validationMessage, setValidationMessage] = React.useState('');
  const [propertyData, setPropertyData] = React.useState<any>({
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
      setValidationMessage(
        'Model details are still loading, please try submitting again.',
      );
      return false;
    }

    return true;
  };

  const componentId = createUuid();

  function isProperty(path: string) {
    return (
      typeof path !== 'string' &&
      typeof path === 'object' &&
      !Array.isArray(path)
    );
  }

  let propertyId: string;
  if (isProperty(propertyPath)) {
    const { id } = propertyPath;
    propertyId = Array.isArray(id) ? id[id.length - 1] : id;
  } else {
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
      modelProperty = relationalProperties.find(
        (property) => property.name === 'id',
      );
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
    return <div>expected component prefab, found {structure.type}</div>;

  const handlePropertyChange = (propertyOrId): void => {
    setProperty(propertyOrId);
  };

  if (!actionId && !prefabSaved) {
    setPrefabSaved(true);
    save(originalPrefab);
  }

  const actionVariableOptionType = structure.options.find(
    (option: { type: string }) => option.type === 'ACTION_JS_VARIABLE',
  );

  const actionVariableOption = actionVariableOptionType?.key || null;
  const labelOptionKey = 'label';
  const nameOptionKey = 'actionVariableId';

  return (
    <>
      <Header onClose={close} title="Configure form input field" />
      <Content>
        {modelId && (
          <Field label="Property based input">
            <FormField
              onClick={(): void => {
                setVariableInput(null);
                setPropertyBased(!propertyBased);
                setProperty('');
                setPropertyData({
                  name: undefined,
                  propertyKind: PropertyKind.TEXT,
                  propertyModelId: '',
                });
              }}
            >
              <Toggle
                color="purple"
                checked={propertyBased}
                onChange={(): void => {}}
              />
            </FormField>
          </Field>
        )}
        {propertyBased ? (
          <Field
            label="Property"
            error={
              validationMessage && (
                <Text color="#e82600">{validationMessage}</Text>
              )
            }
          >
            <PropertySelector
              allowRelations
              disabledNames={['created_at', 'updated_at']}
              disabledKinds={unsupportedKinds}
              showFormat={false}
              size="large"
              onChange={handlePropertyChange}
              value={propertyPath}
              modelId={modelId}
            />
          </Field>
        ) : (
          <>
            <Field>
              <Label>
                Action input variable
                <CircleQuestion
                  color="grey500"
                  size="medium"
                  data-tip="You can use this action input variable in the action itself."
                  data-for="variable-tooltip"
                />
              </Label>
              <BBTooltip
                id="variable-tooltip"
                place="top"
                type="dark"
                effect="solid"
              />
              <Text
                onChange={(e): void => setVariableInput(e.target.value)}
                color="orange"
              />
            </Field>
            <Field>
              <Label>Kind</Label>
              <Dropdown
                onChange={(e) =>
                  setPropertyData({
                    name,
                    propertyKind: e.target.value,
                    propertyModelId,
                  })
                }
              >
                <option value={PropertyKind.TEXT}>Text</option>
                <option value={PropertyKind.INTEGER}>Number</option>
                <option value={PropertyKind.BOOLEAN}>Checkbox</option>
              </Dropdown>
            </Field>
          </>
        )}
      </Content>
      <Footer
        onClose={close}
        canSave={(propertyPath && !!name) || variableInput}
        onSave={async (): Promise<void> => {
          // eslint-disable-next-line no-param-reassign
          structure.id = componentId;

          const kind = propertyKind || 'STRING';

          const variableName = variableInput || name;
          const result = await prepareInput(
            actionId,
            variableName,
            kind,
            propertyKind,
            propertyResponse?.data?.property,
          );

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

          if (
            originalPrefab.name === BettyPrefabs.SELECT ||
            originalPrefab.name === BettyPrefabs.RADIO
          ) {
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
            setOption(
              newPrefab.structure[0],
              'property',
              (originalOption: PrefabComponentOption) => ({
                ...originalOption,
                value: {
                  id:
                    result.isRelational && !result.isMultiRelational
                      ? [propertyId, modelProperty.id]
                      : propertyId,
                  type: 'PROPERTY',
                  name:
                    result.isRelational && !result.isMultiRelational
                      ? `{{ ${model?.name}.${name}.id }}`
                      : `{{ ${model?.name}.${name} }}`,
                },
              }),
            );
          }
          if (validate()) {
            if (
              (selectedPrefab?.name === BettyPrefabs.UPDATE_FORM ||
                ((selectedPrefab?.name === BettyPrefabs.CREATE_FORM ||
                  selectedPrefab?.name === BettyPrefabs.FORM ||
                  selectedPrefab?.name === BettyPrefabs.LOGIN_FORM) &&
                  originalPrefab.name === BettyPrefabs.HIDDEN)) &&
              propertyId
            ) {
              const valueOptions = [
                {
                  id:
                    result.isRelational && !result.isMultiRelational
                      ? [propertyId, modelProperty.id]
                      : propertyId,
                  type: 'PROPERTY',
                  name:
                    result.isRelational && !result.isMultiRelational
                      ? `{{ ${model?.name}.${name}.id }}`
                      : `{{ ${model?.name}.${name} }}`,
                },
              ];

              setOption(newPrefab.structure[0], 'value', (option) => ({
                ...option,
                value:
                  option.type === 'VARIABLE'
                    ? valueOptions
                    : (propertyId as any),
              }));
            }
          }
          save({ ...originalPrefab, structure: [newPrefab.structure[0]] });
        }}
      />
    </>
  );
};

const attributes = {
  category: 'FORM',
  icon: Icon.FileInputIcon,
  keywords: ['Form', 'File', 'Microsoft', 'Large File', 'Upload'],
};

const options = {
  actionVariableId: optionFunction('ACTION_JS_VARIABLE', {
    label: 'Filename input variable',
    value: '',
  }),
  actionVariableFileId: optionFunction('ACTION_JS_VARIABLE', {
    label: 'File ID input variable',
    value: '',
  }),
  buttonText: variable('Button text', { value: ['Upload file'] }),
  authenticationType: option('CUSTOM', {
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
  clientId: variable('Client ID', {
    configuration: {
      condition: {
        type: 'SHOW',
        option: 'authenticationType',
        comparator: 'EQ',
        value: 'client',
      },
    },
  }),
  tenantId: variable('Tenant ID', {
    configuration: {
      condition: {
        type: 'SHOW',
        option: 'authenticationType',
        comparator: 'EQ',
        value: 'client',
      },
    },
  }),
  redirectUri: variable('Redirect URI', {
    configuration: {
      condition: {
        type: 'SHOW',
        option: 'authenticationType',
        comparator: 'EQ',
        value: 'client',
      },
    },
  }),
  accessToken: variable('Access Token', {
    configuration: {
      condition: {
        type: 'SHOW',
        option: 'authenticationType',
        comparator: 'EQ',
        value: 'accessToken',
      },
    },
  }),
  actionId: variable('Action ID', {
    configuration: {
      condition: {
        type: 'SHOW',
        option: 'authenticationType',
        comparator: 'EQ',
        value: 'action',
      },
    },
  }),
  rootFolder: variable('Root folder', {
    value: ['/me/drive/root:/'],
  }),
  accept: variable('Accept files', {
    value: ['image/*'],
  }),
  maxSize: number('Maximum file size (MB)', { value: 50 }),
  color: color('Progress color', {
    value: ThemeColor.PRIMARY,
    configuration: {
      condition: {
        type: 'SHOW',
        option: 'styles',
        comparator: 'EQ',
        value: true,
      },
    },
  }),
  readyColor: color('Ready color', {
    value: ThemeColor.SUCCESS,
    configuration: {
      condition: {
        type: 'SHOW',
        option: 'styles',
        comparator: 'EQ',
        value: true,
      },
    },
  }),
  margin: option('CUSTOM', {
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
  fullWidth: toggle('Full Width', { value: true }),
  hideLabel: toggle('Hide label', {
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
  labelColor: color('Label color', {
    value: ThemeColor.BLACK,
    configuration: {
      condition: {
        type: 'SHOW',
        option: 'styles',
        comparator: 'EQ',
        value: true,
      },
    },
  }),
  advancedSettings: toggle('Advanced Settings', { value: false }),
  nameAttribute: variable('Name attribute', {
    configuration: {
      condition: {
        type: 'SHOW',
        option: 'advancedSettings',
        comparator: 'EQ',
        value: true,
      },
    },
  }),
  idAttribute: variable('Id Attribute', {
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

export default prefab('Microsoft Uploader', attributes, beforeCreate, [
  component('MicrosoftUploader', { options, ...hooks }, []),
]);
