'use strict';

import React from 'react';
import * as mui from 'material-ui';
import * as bs from 'react-bootstrap';
import base from '../base/index';
import MainTitle from '../main-title';

import Properties from './properties';
import Toolbox from './toolbox';
import Canvas from './canvas';

import { projectClose } from '../../actions/index';
import ProjectStore from '../../stores/project-store';

import tabStyles from '../base/tab-styles';

class VPanelProjectTab extends React.Component {

  constructor(props) {
    super(props);
    this.state = { };

    this.boundHandleStoreChange = this.handleStoreChange.bind(this);
  }

  componentDidMount() {
    ProjectStore.addChangeListener(this.boundHandleStoreChange);
  }

  componentWillUnmount() {
    ProjectStore.removeChangeListener(this.boundHandleStoreChange);
  }

  handleStoreChange() {
    const project = this.props.project;
    let projectVersion = project && project.version;
    this.setState({ projectVersion });
  }

  render() {
    const project = this.props.project;

    return (
      <bs.Grid fluid={true} style={Object.assign({}, tabStyles.fullHeight)}>
        <bs.Row style={tabStyles.fullHeight}>
          <bs.Col sm={2} style={Object.assign({}, tabStyles.noPadding, tabStyles.fullHeight)}>
            <mui.Paper style={Object.assign({}, tabStyles.scrollable, tabStyles.fullHeight)}>
              <Toolbox project={project} />
            </mui.Paper>
          </bs.Col>
          <bs.Col sm={8} style={Object.assign({}, tabStyles.noPadding, tabStyles.scrollable, tabStyles.fullHeight)}>
            <div style={Object.assign({marginTop: '-10px' /* WTF ?! */}, tabStyles.noPadding, tabStyles.fullHeight)}>
              <MainTitle
                center={project.name}
                left={<base.icons.tabs.VPanel />}
                right={
                  <mui.IconButton onClick={() => projectClose(project)}>
                    <base.icons.actions.Close />
                  </mui.IconButton>
                }/>
              <Canvas project={project} />
            </div>
          </bs.Col>
          <bs.Col sm={2} style={Object.assign({}, tabStyles.noPadding, tabStyles.fullHeight)}>
            <mui.Paper style={Object.assign({}, tabStyles.scrollable, tabStyles.fullHeight)}>
              <Properties project={project} />
            </mui.Paper>
          </bs.Col>
        </bs.Row>
      </bs.Grid>
    );
  }
}

VPanelProjectTab.propTypes = {
  project: React.PropTypes.object.isRequired,
};

export default VPanelProjectTab;
