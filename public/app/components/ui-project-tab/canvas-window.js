'use strict';

import React from 'react';
import * as muiStyles from 'material-ui/styles/index';
import * as dnd from 'react-dnd';
import ResizableBox from 'react-resizable-box';
import { debounce } from 'throttle-debounce';
import commonStyles from './canvas-styles';
import { stopPropagationWrapper } from '../../utils/index';
import storeHandler from '../../compat/store';

import DataImage from './data-image';
import CanvasControl from './canvas-control';

import { dragTypes } from '../../constants/index';
import AppDispatcher from '../../compat/dispatcher';
import { projectStateSelect, projectResizeWindow } from '../../actions/index';
import { getImage, getWindowControls } from '../../selectors/ui-projects';
import { getProjectState } from '../../selectors/projects';

function getStyles(props, state) {
  const { muiTheme, isSelected } = state;
  const { baseTheme } = muiTheme;

  const backColor = (isSelected ? baseTheme.palette.primary1Color : baseTheme.palette.primary3Color);

  return Object.assign({
    windowContainer: {
      margin: '10px'
    },
    window: {
      height: '100%',
      border: '1px solid ' + backColor,
      position: 'relative'
    },
    background: {
      height: '100%',
      width: '100%'
    }
  }, commonStyles);
}

class CanvasWindow extends React.Component {

  constructor(props, context) {
    super(props, context);

    const { project, window } = this.props;
    const projectState = getProjectState(storeHandler.getStore().getState(), { project: project && project.uid });

    this.state = {
      isSelected: projectState.selection && projectState.selection.type === 'window' && projectState.selection.uid === window.uid,
      lastUpdate: props.project.lastUpdate,
      muiTheme: context.muiTheme || muiStyles.getMuiTheme()
    };

    this.boundHandleStoreChange = this.handleStoreChange.bind(this);
    this.debouncedWindowResize = debounce(100, this.windowResize.bind(this));
  }

  componentDidMount() {
    this.unsubscribe = storeHandler.getStore().subscribe(this.boundHandleStoreChange);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  componentWillReceiveProps(nextProps) {
    const { project, window } = nextProps;
    const projectState = getProjectState(storeHandler.getStore().getState(), { project: project && project.uid });

    this.setState({
      isSelected: projectState.selection && projectState.selection.type === 'window' && projectState.selection.uid === window.uid,
      lastUpdate: project.lastUpdate
    });
  }

  handleStoreChange() {
    const { project, window } = this.props;
    const projectState = getProjectState(storeHandler.getStore().getState(), { project: project && project.uid });

    this.setState({
      isSelected: projectState.selection && projectState.selection.type === 'window' && projectState.selection.uid === window.uid,
      lastUpdate: project.lastUpdate
    });
  }

  windowResize(dir, size) {
    const { project, window } = this.props;

    AppDispatcher.dispatch(projectResizeWindow(project.uid, window.uid, size));
  }

  select() {
    const { project, window } = this.props;
    AppDispatcher.dispatch(projectStateSelect(project, { type: 'window', uid: window.uid }));
  }

  render() {
    const state = storeHandler.getStore().getState();
    const { project, window, connectDropTarget } = this.props;
    const styles = getStyles(this.props, this.state);

    return connectDropTarget(
      <div style={styles.container}
           onClick={stopPropagationWrapper(this.select.bind(this))}>
        <div style={styles.windowContainer}>
          <ResizableBox width={window.width}
                        height={window.height}
                        onResize={this.debouncedWindowResize}
                        isResizable={{ right: true, bottom: true, bottomRight: true }}>
            <div ref="canvas"
                 style={styles.window}>
              <DataImage image={getImage(state, { project: project.uid, image: window.backgroundResource })} style={styles.background}/>
              {getWindowControls(state, { project: project.uid, window: window.uid }).map((ctrl) => (
                <CanvasControl key={ctrl.uid} project={project} window={window} control={ctrl} />))}
            </div>
          </ResizableBox>
        </div>
      </div>
    );
  }
}

CanvasWindow.propTypes = {
  project: React.PropTypes.object.isRequired,
  window: React.PropTypes.object.isRequired,
  connectDropTarget: React.PropTypes.func.isRequired,
};

CanvasWindow.contextTypes = {
  muiTheme: React.PropTypes.object
};

CanvasWindow.childContextTypes = {
  muiTheme: React.PropTypes.object
};

const canvasTarget = {
  drop(props, monitor, component) {
    switch(monitor.getItemType()) {
      case dragTypes.UI_TOOLBOX_CONTROL: {
        const canvasRect = component.refs.canvas.getBoundingClientRect();
        const dropOffset = monitor.getClientOffset();
        const location = { x: dropOffset.x - canvasRect.left, y: dropOffset.y - canvasRect.top };
        // handled in ToolboxControl/endDrag
        return { location };
      }

      case dragTypes.UI_CONTROL: {
        // handled in CanvasControl/endDrag
        return { delta: monitor.getDifferenceFromInitialOffset() };
      }
    }
  }
};

function collect(connect) {
  return {
    connectDropTarget: connect.dropTarget()
  };
}

export default dnd.DropTarget([dragTypes.UI_TOOLBOX_CONTROL, dragTypes.UI_CONTROL], canvasTarget, collect)(CanvasWindow);
