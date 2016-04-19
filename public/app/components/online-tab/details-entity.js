'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import * as mui from 'material-ui';
import base from '../base/index';

import shared from '../../shared/index';

import DetailsTitle from './details-title';
import DetailsContainer from './details-container';

import ResourcesActionCreators from '../../actions/resources-action-creators';

class DetailsEntity extends React.Component {

  constructor(props, context) {
    super(props);
    this.state = {
      muiTheme: context.muiTheme || muiStyles.getMuiTheme()
    };
  }

  getChildContext() {
    return {
      muiTheme: this.state.muiTheme,
    };
  }

  renderTypeIcon(entity) {
    switch(entity.type) {
    case shared.EntityType.RESOURCES:
      return (
        <div>
          <base.icons.EntityResources />
          &nbsp;
          Resources
        </div>
      );

    case shared.EntityType.CORE:
      return (
        <div>
          <base.icons.EntityCore />
          &nbsp;
          Core
        </div>
      );

    case shared.EntityType.UI:
      return (
        <div>
          <base.icons.EntityUi />
          &nbsp;
          UI
        </div>
      );

    default:
      return null;
    }
  }

  render() {
    const entity = this.props.entity;
    const refreshAction = () => ResourcesActionCreators.entityQuery(entity);

    return (
      <div>
        <DetailsTitle
          center={
            <div>
              {entity.id}
              &nbsp;
              <mui.IconButton tooltip="refresh" onTouchTap={refreshAction}>
                <base.icons.actions.Refresh />
              </mui.IconButton>
            </div>
          }
          left={
            <div>
              <base.icons.Entity />
              &nbsp;
              Entity
            </div>
          }
          right={this.renderTypeIcon(entity)}/>
        <DetailsContainer>
        </DetailsContainer>
      </div>
    );
  }
}

DetailsEntity.propTypes = {
  entity: React.PropTypes.object.isRequired,
  muiTheme: React.PropTypes.object
};

DetailsEntity.childContextTypes = {
  muiTheme: React.PropTypes.object
};

DetailsEntity.contextTypes = {
  muiTheme: React.PropTypes.object
};

export default DetailsEntity;