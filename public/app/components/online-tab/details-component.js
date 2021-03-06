'use strict';

import React from 'react';
import icons from '../icons';
import MainTitle from '../main-title';

import DetailsComponentConfig from './details-component-config';
import DetailsComponentBinding from './details-component-binding';
import DetailsContainer from './details-container';

const DetailsComponent = ({ component }) => (
  <div>
    <MainTitle
      center={
        <div>
          {component.id}
        </div>
      }
      left={
        <div>
          <icons.Component />
          &nbsp;
          Component
        </div>
      }
      right={
        <div>
          <icons.Plugin />
          &nbsp;
          {`${component.library}.${component.type}`}
        </div>
      }/>
    <DetailsContainer>
      {component.config.map(config => (<DetailsComponentConfig key={config.key} config={config} />))}
      {component.bindings.map(binding => (<DetailsComponentBinding key={`${binding.remote_id}:${binding.remote_attribute}:${binding.local_action}`} binding={binding} />))}
    </DetailsContainer>
  </div>
);

DetailsComponent.propTypes = {
  component: React.PropTypes.object.isRequired
};

export default DetailsComponent;