(() => ({
  name: 'MicrosoftUploader',
  type: 'CONTENT_COMPONENT',
  allowedTypes: [],
  orientation: 'HORIZONTAL',
  styleType: 'BUTTON',
  jsx: (() => {
    const { useText, env, getCustomModelAttribute } = B;
    const {
      clientId,
      tenantId,
      redirectUri,
      authenticationType,
      accessToken,
      margin,
      hideLabel,
      labelText,
      fullWidth,
      customModelAttribute: customModelAttributeObj,
      nameAttribute,
    } = options;

    const isDev = env === 'dev';

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat(bytes / k ** i).toFixed()} ${sizes[i]}`;
    };

    const nameAttributeValue = useText(nameAttribute);

    const {
      id: customModelAttributeId,
      label = [],
      required: defaultRequired = false,
    } = customModelAttributeObj;

    const customModelAttribute = getCustomModelAttribute(
      customModelAttributeId,
    );
    const {
      name: customModelAttributeName,
      validations: { required: attributeRequired } = {},
    } = customModelAttribute || {};

    const { Client, LargeFileUploadTask, FileUpload } =
      window.MicrosoftServices.MicrosoftGraph;
    const { AuthCodeMSALBrowserAuthenticationProvider } =
      window.MicrosoftServices.MicrosoftGraphMsal;
    const { PublicClientApplication, InteractionType } =
      window.MicrosoftServices.msal;
    const { LinearProgress, FormControl, Typography } = window.MaterialUI.Core;

    const [uploadProgress, setUploadProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [inputFileName, setInputFileName] = useState(null);

    const inputRef = React.createRef();

    const clientIdText = useText(clientId);
    const tenantIdText = useText(tenantId);
    const redirectUriText = useText(redirectUri);
    const accessTokenText = useText(accessToken);

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

      const filename = file.name;
      const uploadEventHandlers = {
        progress: (range) => {
          const progressPerc = (range.maxValue / file.size) * 100;
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

      const uploadSession = await LargeFileUploadTask.createUploadSession(
        graphClient,
        `/me/drive/root:/${filename}:/createUploadSession`,
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
    };

    const Label = isDev ? 'div' : 'label';

    const inputChange = (event) => {
      setInputFileName(inputRef.current.files[0].name);
    };

    return (
      <div className={classes.root}>
        <FormControl fullWidth={fullWidth} margin={margin}>
          <Label className={classes.label}>
            <span className={classes.submitButton}>
              {inputFileName ? inputFileName : 'Select file...'}
            </span>
            <input
              ref={inputRef}
              type="file"
              className={classes.input}
              onChange={inputChange}
            />
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
          <LinearProgress variant="determinate" value={uploadProgress} />
        </div>
        <div>
          <input
            type="hidden"
            name={nameAttributeValue || customModelAttributeName}
            value={result && result.id}
          />
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

    return {
      root: {
        display: ({ options: { fullWidth } }) =>
          fullWidth ? 'block' : 'inline-block',
      },
      submitButton: ({ style }) => ({ ...style, display: 'inline-block' }),
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
      input: {
        display: 'none',
      },
    };
  },
}))();
