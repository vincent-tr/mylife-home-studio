'use strict';

import React from 'react';
import * as mui from 'material-ui';
import base from '../base/index';

const DetailsPluginAction = ({ action }) => (
  <div>
    <base.icons.NetAction style={{verticalAlign: 'middle'}}/>
    &nbsp;
    Action:
    &nbsp;
    {action.name}
    &nbsp;
    {action.types.map(t => t.toString()).join(', ')}
    <mui.Divider />
  </div>
);

DetailsPluginAction.propTypes = {
  action: React.PropTypes.object.isRequired,
};

export default DetailsPluginAction;