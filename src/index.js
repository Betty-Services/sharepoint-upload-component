import * as Core from '@material-ui/core';
import * as Lab from '@material-ui/lab';
import * as Pickers from '@material-ui/pickers';
import * as Styles from '@material-ui/styles';
import DateFnsUtils from '@date-io/date-fns';
import enLocale from 'date-fns/locale/en-US';
import nlLocale from 'date-fns/locale/nl';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-client';
import * as MicrosoftGraphMsal from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';

import * as msal from '@azure/msal-browser';

import { icons } from './icons';

window.MicrosoftServices = {
  MicrosoftGraph,
  msal,
  MicrosoftGraphMsal,
  // fileReaderStream,
};

export default {
  Core,
  Icons: icons,
  Lab,
  Pickers,
  Styles,
  DateFnsUtils,
  DateLocales: { enLocale, nlLocale },
};
