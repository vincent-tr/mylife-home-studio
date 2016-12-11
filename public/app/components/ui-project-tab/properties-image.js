'use strict';

import React from 'react';
import * as mui from 'material-ui';
import icons from '../icons';
import { imageSize } from '../../utils/index';

import PropertiesLabel from '../properties/properties-label';
import PropertiesTitle from '../properties/properties-title';
import PropertiesValue from '../properties/properties-value';
import PropertiesEditor from '../properties/properties-editor';

import AppDispatcher from '../../compat/dispatcher';

import {
  projectImageChangeFile, projectDeleteImage, projectImageChangeId
} from '../../actions/index';

class PropertiesImage extends React.Component {

  constructor(props) {
    super(props);
    this.state = { };

    const { image } = this.props;
    this.calculateSize(image);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ size : null });

    const image = nextProps.image;
    this.calculateSize(image);
  }

  calculateSize(image) {
    if(image && image.content) {
      imageSize(image.content, (err, size) => {
        this.setState({ size });
      });
    }
  }

  openImageFileDialog() {
    this.refs.openImageFile.click();
  }

  handleOpenImageFile(e) {
    const { project, image } = this.props;
    e.stopPropagation();
    const file = e.target.files[0];
    e.target.value = '';
    AppDispatcher.dispatch(projectImageChangeFile(project, image, file));
  }

  render() {
    const { project, image } = this.props;
    const { size } = this.state;
    const width = ((size && size.width) || 0).toString();
    const height = ((size && size.height) || 0).toString();

    const onDelete = () => {
      AppDispatcher.dispatch(projectDeleteImage(project, image));
    };

    return (
      <div>
        <PropertiesTitle icon={<icons.UiImage/>} text={image.id} onDelete={onDelete} />
        {/* details */}
        <table>
          <tbody>
            <tr>
              <td><PropertiesLabel text={'Id'} /></td>
              <td><PropertiesEditor id={`${image.uid}_id`} value={image.id} onChange={(value) => AppDispatcher.dispatch(projectImageChangeId(project, image, value))} type={'s'} /></td>
            </tr>
            <tr>
              <td><PropertiesLabel text={'Width'} /></td>
              <td><PropertiesValue value={width} /></td>
            </tr>
            <tr>
              <td><PropertiesLabel text={'Height'} /></td>
              <td><PropertiesValue value={height} /></td>
            </tr>
            <tr>
              <td colSpan={2}>
                <mui.RaisedButton label={'Change'} onClick={this.openImageFileDialog.bind(this)} />
              </td>
            </tr>
          </tbody>
        </table>

        <input
          ref="openImageFile"
          type="file"
          style={{display : 'none'}}
          onChange={this.handleOpenImageFile.bind(this)}/>
      </div>
    );
  }
}

PropertiesImage.propTypes = {
  project: React.PropTypes.object.isRequired,
  image: React.PropTypes.object.isRequired
};

export default PropertiesImage;