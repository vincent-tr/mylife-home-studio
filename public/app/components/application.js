'use strict';

import React from 'react';
import AppBar from 'material-ui/lib/app-bar';
import mui from 'material-ui';

import MainToolbar from './main-toolbar';
import OnlineTab from './online-tab/main';

import HelloWorld from './hello-world-component';

const styles = {
  headline: {
    fontSize: 24,
    paddingTop: 16,
    marginBottom: 12,
    fontWeight: 400,
  },
};

class Application extends React.Component {
  render() { return (
    <div>
      <mui.AppBar title="MyLife Home Studio" showMenuIconButton={false}/>
      <MainToolbar />
      <mui.Tabs>
        <mui.Tab label="Online">
          <OnlineTab />
        </mui.Tab>
        <mui.Tab label="Item Two" >
          <div>
            <h2 style={styles.headline}>Tab Two</h2>
            <p>
              This is another example tab.
            </p>
          </div>
        </mui.Tab>
      </mui.Tabs>
    </div>
  ); }
}

export default Application;