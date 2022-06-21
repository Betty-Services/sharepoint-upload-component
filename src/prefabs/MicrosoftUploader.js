(() => ({
  name: 'MicrosoftUploader',
  icon: 'TitleIcon',
  category: 'CONTENT',
  structure: [
    {
      name: 'MicrosoftUploader',
      options: [
        {
          value: { label: ['Select files(s)...'] },
          label: 'Label',
          key: 'customModelAttribute',
          type: 'CUSTOM_MODEL_ATTRIBUTE',
          configuration: {
            allowedTypes: ['file'],
          },
        },
        {
          type: 'CUSTOM',
          value: 'client',
          key: 'authenticationType',
          label: 'Authentication Type',
          configuration: {
            as: 'BUTTONGROUP',
            dataType: 'string',
            allowedInput: [
              { name: 'Login Popup', value: 'client' },
              { name: 'Access Token', value: 'accessToken' },
            ],
          },
        },
        {
          type: 'VARIABLE',
          value: [],
          label: 'Client ID',
          key: 'clientId',
          configuration: {
            condition: {
              type: 'SHOW',
              option: 'authenticationType',
              comparator: 'EQ',
              value: 'client',
            },
          },
        },
        {
          type: 'VARIABLE',
          value: [],
          label: 'Tenant ID',
          key: 'tenantId',
          configuration: {
            condition: {
              type: 'SHOW',
              option: 'authenticationType',
              comparator: 'EQ',
              value: 'client',
            },
          },
        },
        {
          type: 'VARIABLE',
          value: [],
          label: 'Redirect URI',
          key: 'redirectUri',
          configuration: {
            condition: {
              type: 'SHOW',
              option: 'authenticationType',
              comparator: 'EQ',
              value: 'client',
            },
          },
        },
        {
          type: 'VARIABLE',
          value: [],
          label: 'Access Token',
          key: 'accessToken',
          configuration: {
            condition: {
              type: 'SHOW',
              option: 'authenticationType',
              comparator: 'EQ',
              value: 'accessToken',
            },
          },
        },
        {
          label: 'Margin',
          key: 'margin',
          value: 'normal',
          type: 'CUSTOM',
          configuration: {
            as: 'BUTTONGROUP',
            dataType: 'string',
            allowedInput: [
              { name: 'None', value: 'none' },
              { name: 'Dense', value: 'dense' },
              { name: 'Normal', value: 'normal' },
            ],
          },
        },
        {
          type: 'TOGGLE',
          label: 'Full width',
          key: 'fullWidth',
          value: true,
        },
        {
          value: false,
          label: 'Hide label',
          key: 'hideLabel',
          type: 'TOGGLE',
          configuration: {
            condition: {
              type: 'SHOW',
              option: 'styles',
              comparator: 'EQ',
              value: true,
            },
          },
        },
        {
          type: 'COLOR',
          label: 'Label color',
          key: 'labelColor',
          value: 'Black',
          configuration: {
            condition: {
              type: 'SHOW',
              option: 'styles',
              comparator: 'EQ',
              value: true,
            },
          },
        },
        {
          value: false,
          label: 'Advanced settings',
          key: 'advancedSettings',
          type: 'TOGGLE',
        },
        {
          type: 'VARIABLE',
          label: 'name attribute',
          key: 'nameAttribute',
          value: [],
          configuration: {
            condition: {
              type: 'SHOW',
              option: 'advancedSettings',
              comparator: 'EQ',
              value: true,
            },
          },
        },
      ],
      descendants: [],
    },
  ],
}))();
