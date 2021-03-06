'use strict';

import React from 'react';
import icons from '../icons';

import PropertiesLabel from '../properties/properties-label';
import PropertiesTitle from '../properties/properties-title';
import PropertiesValue from '../properties/properties-value';
import PropertiesEditor from '../properties/properties-editor';

const PropertiesProject = ({ project, onChangeName }) => (
  <div>
    <PropertiesTitle icon={<icons.tabs.VPanel/>} text={'Project'} />
    {/* details */}
    <table>
      <tbody>
        <tr>
          <td><PropertiesLabel text={'Name'}/></td>
          <td><PropertiesEditor id={`${project.uid}_name`} value={project.name} onChange={onChangeName} type={'s'} /></td>
        </tr>
        <tr>
          <td><PropertiesLabel text={'Creation'}/></td>
          <td><PropertiesValue value={project.creationDate.toISOString()}/></td>
        </tr>
        <tr>
          <td><PropertiesLabel text={'Last update'}/></td>
          <td><PropertiesValue value={project.lastUpdate.toISOString()}/></td>
        </tr>
      </tbody>
    </table>
  </div>
);

PropertiesProject.propTypes = {
  project      : React.PropTypes.object.isRequired,
  onChangeName : React.PropTypes.func.isRequired
};

export default PropertiesProject;
