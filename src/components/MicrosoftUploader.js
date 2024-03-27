(() => ({
  name: 'MicrosoftUploader',
  type: 'CONTENT_COMPONENT',
  allowedTypes: [],
  orientation: 'HORIZONTAL',
  styleType: 'BUTTON',
  dependencies: [
    {
      label: 'MicrosoftGraph',
      package: 'npm:@microsoft/microsoft-graph-client@3.0.2',
      imports: ['*'],
    },
    {
      label: 'MicrosoftMsal',
      package: 'npm:@azure/msal-browser@2.26.0',
      imports: ['*'],
    },
  ],
  jsx: (() => {
    const { useText, env, useActionJs } = B;
    const {
      clientId,
      tenantId,
      redirectUri,
      authenticationType,
      accessToken,
      margin,
      hideLabel,
      labelText,
      accept,
      rootFolder,
      fullWidth,
      nameAttribute,
      idAttribute,
      buttonText,
      maxSize,
      actionId: rawActionId,
      actionVariableId: name,
      actionVariableFileId: fileIdName,
    } = options;

    const isDev = env === 'dev';

    const mounted = useRef(false);

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat(bytes / k ** i).toFixed()} ${sizes[i]}`;
    };

    const nameAttributeValue = useText(nameAttribute);
    const idAttributeValue = useText(idAttribute);

    const { MicrosoftGraph, MicrosoftMsal } = dependencies;

    const { Client, LargeFileUploadTask, FileUpload } = MicrosoftGraph;
    const { AuthCodeMSALBrowserAuthenticationProvider } =
      window.MicrosoftServices.MicrosoftGraphMsal;
    const { PublicClientApplication, InteractionType } = MicrosoftMsal;
    const { LinearProgress, FormControl, Typography } = window.MaterialUI.Core;

    const [uploadProgress, setUploadProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [inputFileName, setInputFileName] = useState(null);

    const inputRef = React.createRef();

    const clientIdText = useText(clientId);
    const tenantIdText = useText(tenantId);
    const redirectUriText = useText(redirectUri);
    const accessTokenText = useText(accessToken);
    const rootFolderText = useText(rootFolder);
    const actionId = useText(rawActionId);

    const [disabled, setDisabled] = useState(false);
    const acceptedValue = useText(accept) || 'image/*';

    const [actionCallback, { loading: isLoadingAction }] =
      useActionJs(actionId);

    const getGraphClient = async () => {
      if (authenticationType === 'client') {
        const msalConfig = {
          auth: {
            clientId: clientIdText,
            authority: `https://login.microsoftonline.com/${tenantIdText}`,
            redirectUri: redirectUriText,
          },
        };

        const msalRequest = {
          scopes: ['User.Read', 'Files.ReadWrite', 'Files.ReadWrite.All'],
        };

        const msalClient = new PublicClientApplication(msalConfig);
        await msalClient.loginPopup(msalRequest);

        const clientOptions = {
          account: msalClient.getAllAccounts()[0],
          interactionType: InteractionType.PopUp,
          scopes: ['User.Read', 'Files.ReadWrite', 'Files.ReadWrite.All'],
        };

        const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(
          msalClient,
          clientOptions,
        );

        return Client.initWithMiddleware({ authProvider });
      }
      return Client.init({
        authProvider: (done) => {
          done(null, accessTokenText);
        },
      });
    };

    const startUpload = async (event) => {
      event.preventDefault();

      const graphClient = await getGraphClient();

      const file = inputRef.current.files[0];

      if (maxSize * 1000000 < file.size) {
        console.log('file is too large');
        console.log(
          'File ' + file.name + ' is ' + file.size + ' bytes in size',
        );
        B.triggerEvent('onFileTooLarge');
      } else {
        const filename = file.name;
        const uploadEventHandlers = {
          progress: (range) => {
            const progressPerc = 10 + (range.maxValue / file.size) * 90;
            setUploadProgress(Math.round(progressPerc));
          },
          extraCallBackParam: '',
        };

        const uploadTaskOptions = {
          rangeSize: 1024 * 1024,
          uploadEventHandlers,
        };

        const payload = {
          item: {
            '@microsoft.graph.conflictBehavior': 'rename',
          },
        };
        const uploadUrl = rootFolderText + filename + ':/createUploadSession';

        setDisabled(true);
        setUploadProgress(10);

        if (authenticationType === 'action') {
          const result = await actionCallback();
          accessTokenText = result.data.action.results;
          console.log('ACCESS TOKEN TEXT', accessTokenText);
        }

        const uploadSession = await LargeFileUploadTask.createUploadSession(
          graphClient,
          uploadUrl,
          payload,
        );

        const fileObject = new FileUpload(file, file.name, file.size);

        const uploadTask = new LargeFileUploadTask(
          graphClient,
          fileObject,
          uploadSession,
          uploadTaskOptions,
        );

        const uploadResult = await uploadTask.upload();

        setResult({
          id: uploadResult.responseBody.id,
          name: uploadResult.responseBody.name,
          size: uploadResult.responseBody.size,
          fileType: uploadResult.responseBody.file.mimeType,
          downloadurl: uploadResult.responseBody['@content.downloadUrl'],
        });

        setUploadProgress(100);

        B.triggerEvent('onSuccess');
        setclassNames({
          barColorPrimary: classes.readyBackgroundColor,
        });
      }
    };

    const Label = isDev ? 'div' : 'label';

    const [classNames, setclassNames] = useState({
      colorPrimary: classes.lighterBackgroundColor,
      barColorPrimary: classes.normalBackgroundColor,
    });

    const inputChange = (event) => {
      setInputFileName(inputRef.current.files[0].name);
    };

    const afterSelect = (event) => {
      if (authenticationType === 'client') {
        inputChange(event);
      } else {
        startUpload(event);
      }
    };

    useEffect(() => {
      const timer = setTimeout(() => {
        B.triggerEvent('onExpired');
      }, 300000);
      return () => clearTimeout(timer);
    }, []);

    B.defineFunction('SelectFile', () => {
      inputRef.current.click();
    });

    useEffect(() => {
      mounted.current = true;

      B.triggerEvent('onComponentRendered');
      return () => {
        mounted.current = false;
      };
    }, []);

    return (
      <div className={classes.root}>
        <FormControl fullWidth={fullWidth} margin={margin}>
          <Label className={classes.label}>
            <div
              className={[classes.root, disabled ? classes.disabled : ''].join(
                ' ',
              )}
            >
              <span className={classes.submitButton}>
                {inputFileName ? inputFileName : buttonText}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept={acceptedValue}
                className={classes.input}
                onChange={afterSelect}
                disabled={disabled}
              />
            </div>
          </Label>
        </FormControl>
        {inputFileName && (
          <div>
            <a onClick={startUpload} className={classes.submitButton}>
              Upload
            </a>
          </div>
        )}
        <div className={classes.progress}>
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            classes={classNames}
          />
        </div>
        <div>
          <input type="hidden" name={name} value={result && result.name} />
          <input type="hidden" name={fileIdName} value={result && result.id} />
          {result && (
            <div className={classes.fileDetails}>
              <Typography variant="body1" noWrap className={classes.span}>
                {result ? result.name : 'File name'}
              </Typography>
              <div className={classes.fileDetailList}>
                <p className={classes.fileDetail}>
                  {isDev ? 'Size' : formatBytes(result.size)}
                </p>
                <div className={classes.divider} />
                <p className={classes.fileDetail}>
                  {isDev ? 'Type' : result.fileType.replace('image/', '.')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  })(),
  styles: (B) => (t) => {
    const { color: colorFunc, Styling } = B;
    const style = new Styling(t);
    const getOpacColor = (col, val) => colorFunc.alpha(col, val);
    const getLighterColor = (col, val) => colorFunc.lighten(col, val);

    return {
      root: {
        display: ({ options: { fullWidth } }) =>
          fullWidth ? 'block' : 'inline-block',
      },
      submitButton: ({ style }) => ({
        ...style,
        display: 'inline-block',
        cursor: 'pointer',

        '&:hover': {
          filter: 'brightness(90%)',
        },
        '&:active, &:focus': {
          filter: 'brightness(85%)',
          outline: 'none',
        },
      }),
      fileDetails: {
        flexGrow: 1,
        maxWidth: 'auto',
        display: 'flex',
        flexDirection: 'column',
      },
      fileDetail: {
        margin: 0,
        color: t.colors.medium,
      },
      fileDetailList: {
        display: 'flex',
        alignItems: 'center',
      },
      label: {
        marginLeft: '0!important',
        alignItems: 'start!important',
        color: ({ options: { labelColor } }) => [
          style.getColor(labelColor),
          '!important',
        ],
        '&.Mui-error': {
          color: ({ options: { errorColor } }) => [
            style.getColor(errorColor),
            '!important',
          ],
        },
        '&.Mui-disabled': {
          pointerEvents: 'none',
          opacity: '0.7',
        },
      },
      divider: {
        width: '0.1875rem',
        height: '0.1875rem',
        borderRadius: '50%',
        marginLeft: '1rem',
        backgroundColor: t.colors.light,
        marginRight: '1rem',
      },
      progress: {
        width: '100%',
        marginTop: '10px',
        marginBottom: '10px',
      },
      normalBackgroundColor: {
        backgroundColor: ({ options: { color } }) => [
          style.getColor(color),
          '!important',
        ],
      },
      lighterBackgroundColor: {
        backgroundColor: ({ options: { color } }) => [
          getLighterColor(style.getColor(color), 0.7),
          '!important',
        ],
      },
      lighterDashedColor: {
        backgroundImage: ({ options: { color } }) => [
          `radial-gradient(${getLighterColor(
            style.getColor(color),
            0.7,
          )} 0%, ${getLighterColor(
            style.getColor(color),
            0.7,
          )} 16%, transparent 42%)`,
          '!important',
        ],
      },
      readyBackgroundColor: {
        backgroundColor: ({ options: { readyColor } }) => [
          style.getColor(readyColor),
          '!important',
        ],
      },
      disabled: {
        opacity: '50%',
        boxShadow: 'none',
        filter: 'grayscale(100%)',
        pointerEvents: 'none',
      },
      input: {
        display: 'none',
      },
    };
  },
}))();
