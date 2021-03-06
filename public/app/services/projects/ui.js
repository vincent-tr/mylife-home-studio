'use strict';

import Immutable from 'immutable';
import common from './common';
import Metadata from '../metadata/index';
import { newId } from '../../utils/index';

const metadata = new Metadata(); // TODO: how to use facade ?

export default {
  createNew,
  open,
  validate,
  serialize,
  prepareImportOnline,
  prepareImportVpanelProject,
  prepareDeploy,
  createImage,
  createWindow,
  createControl,
  checkComponentUsage,
  checkImageUsage,
  checkWindowUsage,
};

function createNew() {
  return {
    components           : Immutable.Map(),
    images               : Immutable.Map(),
    windows              : Immutable.Map(),
    desktopDefaultWindow : null,
    mobileDefaultWindow  : null
  };
}

function open(data) {
  const project = {
    components    : common.loadToMap(data.Components, loadComponent),
    images        : common.loadToMap(data.Images, loadImage),
  };

  project.windows              = common.loadToMap(data.Windows, (raw) => loadWindow(project, raw));
  project.desktopDefaultWindow = findWindow(project, data.DesktopDefaultWindow || data.DefaultWindow);
  project.mobileDefaultWindow  = findWindow(project, data.MobileDefaultWindow || data.DefaultWindow);

  for(const window of project.windows.values()) {
    window.controls = common.loadToMap(window.raw.controls, (raw) => loadControl(project, raw));
    delete window.raw;
  }

  return project;
}

function loadComponent(comp) {
  return {
    uid    : newId(),
    id     : comp.Id,
    plugin : common.loadPlugin(comp.Plugin)
  };
}

function loadImage(img) {
  return {
    uid     : newId(),
    id      : img.Id,
    content : img.Content
  };
}

function loadWindow(project, win) {
  return {
    uid                : newId(),
    id                 : win.id,
    height             : win.height,
    width              : win.width,
    style              : win.style,
    backgroundResource : findResource(project, win.background_resource_id),
    raw                : win
    // load controls later when all windows exists
  };
}

function loadControl(project, ctrl) {
  return {
    uid             : newId(),
    id              : ctrl.id,
    height          : ctrl.height,
    width           : ctrl.width,
    x               : ctrl.x,
    y               : ctrl.y,
    style           : ctrl.style,
    display         : loadDisplay(project, ctrl.display),
    text            : loadText(project, ctrl.text),
    primaryAction   : loadAction(project, ctrl.primary_action),
    secondaryAction : loadAction(project, ctrl.secondary_action)
  };
}

function loadDisplay(project, disp) {
  if(!disp) { return null; }
  return {
    component       : findComponent(project, disp.component_id),
    attribute       : disp.component_attribute,
    defaultResource : findResource(project, disp.default_resource_id),
    map             : common.loadToMap(disp.map, (raw) => loadDisplayMapItem(project, raw))
  };
}

function loadDisplayMapItem(project, item) {
  return {
    uid      : newId(),
    max      : item.max,
    min      : item.min,
    resource : findResource(project, item.resource_id),
    value    : item.value
  };
}

function loadText(project, text) {
  if(!text) { return null; }
  return {
    format  : text.format,
    context : common.loadToMap(text.context, (raw) => loadTextContextItem(project, raw))
  };
}

function loadTextContextItem(project, item) {
  return {
    uid       : newId(),
    component : findComponent(project, item.component_id),
    attribute : item.component_attribute,
    id        : item.id
  };
}

function loadAction(project, action) {
  if(!action) { return null; }
  return {
    component : loadActionComponent(project, action.component),
    window    : loadActionWindow(project, action.window)
  };
}

function loadActionComponent(project, actionComponent) {
  if(!actionComponent) { return null; }
  return {
    component : findComponent(project, actionComponent.component_id),
    action    : actionComponent.component_action
  };
}

function loadActionWindow(project, actionWindow) {
  if(!actionWindow) { return null; }
  return {
    window : findWindow(project, actionWindow.id),
    popup  : actionWindow.popup
  };
}

function findResource(project, id) {
  if(!id) { return null; }
  const ret = project.images.find(img => img.id === id);
  if(!ret) { return null; }
  return ret.uid;
}

function findComponent(project, id) {
  if(!id) { return null; }
  const ret = project.components.find(comp => comp.id === id);
  if(!ret) { return null; }
  return ret.uid;
}

function findWindow(project, id) {
  if(!id) { return null; }
  const ret = project.windows.find(win => win.id === id);
  if(!ret) { return null; }
  return ret.uid;
}

function validate(project, msgs) {
  common.validate(project, msgs);

  if(!project.desktopDefaultWindow) {
    msgs.push('No desktop default window');
  }

  if(!project.mobileDefaultWindow) {
    msgs.push('No mobile default window');
  }

  {
    const { noIdCount, duplicates } = common.checkIds(project.images);
    if(noIdCount > 0) {
      msgs.push(`${noIdCount} images have no id`);
    }
    for(const id of duplicates) {
      msgs.push(`Duplicate image id: ${id}`);
    }
  }

  {
    const { noIdCount, duplicates } = common.checkIds(project.windows);
    if(noIdCount > 0) {
      msgs.push(`${noIdCount} windows have no id`);
    }
    for(const id of duplicates) {
      msgs.push(`Duplicate window id: ${id}`);
    }
  }

  for(const window of project.windows.values()) {
    {
      const { noIdCount, duplicates } = common.checkIds(window.controls);
      if(noIdCount > 0) {
        msgs.push(`On window ${window.id}: ${noIdCount} controls have no id`);
      }
      for(const id of duplicates) {
        msgs.push(`On window ${window.id}: duplicate control id: ${id}`);
      }
    }

    for(const control of window.controls.values()) {
      if(control.text) {
        const { noIdCount, duplicates } = common.checkIds(control.text.context);
        if(noIdCount > 0) {
          msgs.push(`On window ${window.id}: on control ${control.id}: ${noIdCount} text context items have no id`);
        }
        for(const id of duplicates) {
          msgs.push(`On window ${window.id}: on control ${control.id}: duplicate text context item id: ${id}`);
        }
      }

      if(control.display && control.display.component) {
        const component = project.components.get(control.display.component);
        const attributeType = component.plugin.clazz.attributes.find(a => a.name === control.display.attribute).type;
        if(attributeType.type() === 'Enum') {
          const { noIdCount, duplicates } = common.checkIds(control.display.map, item => item.value);
          if(noIdCount > 0) {
            msgs.push(`On window ${window.id}: on control ${control.id}: ${noIdCount} display map items have no value`);
          }
          for(const value of duplicates) {
            msgs.push(`On window ${window.id}: on control ${control.id}: duplicate display map item value: ${value}`);
          }
        } else { // Range
          const ranges = control.display.map.toArray();
          ranges.sort((a, b) => a.min - b.min);
          let prevRange = null;
          for(const range of ranges) {
            if(range.min > range.max) {
              msgs.push(`On window ${window.id}: on control ${control.id}: Range [${range.min}-${range.max}] is invalid`);
              continue;
            }
            if(range.min < attributeType.min || range.max > attributeType.max) {
              msgs.push(`On window ${window.id}: on control ${control.id}: Range [${range.min}-${range.max}] is outside attribute type boundaries [${attributeType.min}-${attributeType.max}]`);
            }
            if(prevRange && range.min <= prevRange.max) {
              msgs.push(`On window ${window.id}: on control ${control.id}: Range [${range.min}-${range.max}] overlap range [${prevRange.min}-${prevRange.max}]`);
            }

            prevRange = range;
          }
        }
      }
    }
  }
}

function serialize(project) {
  return {
    ...common.serialize(project),
    Components           : common.serializeFromMap(project.components, serializeComponent),
    Images               : common.serializeFromMap(project.images, serializeImage),
    Windows              : common.serializeFromMap(project.windows, (w) => serializeWindow(project, w)),
    DesktopDefaultWindow : serializeObjectId(project.windows, project.desktopDefaultWindow),
    MobileDefaultWindow  : serializeObjectId(project.windows, project.mobileDefaultWindow)
  };
}

function serializeObjectId(map, res) {
  if(!res) { return null; }
  const obj = map.get(res);
  if(!obj) { return null; }
  return obj.id;
}

function serializeComponent(comp) {
  return {
    Id     : comp.id,
    Plugin : {
      library : comp.plugin.library,
      type    : comp.plugin.type,
      usage   : comp.plugin.usage,
      version : comp.plugin.version,
      config  : comp.plugin.raw.config,
      clazz   : comp.plugin.raw.clazz
    }
  };
}

function serializeImage(img) {
  return {
    Id      : img.id,
    Content : img.content
  };
}

function serializeWindow(project, win) {
  return {
    id: win.id,
    height: win.height,
    width: win.width,
    style: win.style,
    background_resource_id: serializeObjectId(project.images, win.backgroundResource),
    controls: common.serializeFromMap(win.controls, (c) => serializeControl(project, c))
  };
}

function serializeControl(project, ctrl) {
  return {
    id               : ctrl.id,
    height           : ctrl.height,
    width            : ctrl.width,
    x                : ctrl.x,
    y                : ctrl.y,
    style            : ctrl.style,
    display          : serializeDisplay(project, ctrl.display),
    text             : serializeText(project, ctrl.text),
    primary_action   : serializeAction(project, ctrl.primaryAction),
    secondary_action : serializeAction(project, ctrl.secondaryAction)
  };
}

function serializeDisplay(project, disp) {
  if(!disp) { return null; }
  return {
    component_id        : serializeObjectId(project.components, disp.component),
    component_attribute : disp.attribute,
    default_resource_id : serializeObjectId(project.images, disp.defaultResource),
    map                 : common.serializeFromMap(disp.map, (it) => serializeDisplayMapItem(project, it))
  };
}

function serializeDisplayMapItem(project, item) {
  return {
    max         : item.max,
    min         : item.min,
    resource_id : serializeObjectId(project.images, item.resource),
    value       : item.value
  };
}

function serializeText(project, text) {
  if(!text) { return null; }
  return {
    format  : text.format,
    context : common.serializeFromMap(text.context, (it) => serializeTextContextItem(project, it))
  };
}

function serializeTextContextItem(project, item) {
  return {
    component_id        : serializeObjectId(project.components, item.component),
    component_attribute : item.attribute,
    id                  : item.id
  };
}

function serializeAction(project, action) {
  if(!action) { return null; }
  return {
    component : serializeActionComponent(project, action.component),
    window    : serializeActionWindow(project, action.window)
  };
}

function serializeActionComponent(project, actionComponent) {
  if(!actionComponent) { return null; }
  return {
    component_id     : serializeObjectId(project.components, actionComponent.component),
    component_action : actionComponent.action
  };
}

function serializeActionWindow(project, actionWindow) {
  if(!actionWindow) { return null; }
  return {
    id    : serializeObjectId(project.windows, actionWindow.window),
    popup : actionWindow.popup
  };
}

function prepareImportOnline(project, coreEntities) {
  const onlinePlugins    = common.getOnlinePlugins(coreEntities);
  const onlineComponents = common.getOnlineComponents(coreEntities);

  const plugins = Array.from(onlinePlugins.values())
    .map(value => common.loadPlugin(value.plugin, value.entityId))
    .filter(p => p.usage === metadata.pluginUsage.ui);

  const components = Array.from(onlineComponents.values())
    .map(value => ({
      uid    : newId(),
      id     : value.component.id,
      plugin : plugins.find(p =>
        p.library === value.component.library &&
        p.type === value.component.type &&
        p.entityId === value.entityId)
    }))
    .filter(c => c.plugin);

  return prepareImport(project, components);
}

function prepareImportVpanelProject(project, vpanelProject) {
  const components = vpanelProject.components
    .valueSeq()
    .filter(c => vpanelProject.plugins.get(c.plugin).usage === metadata.pluginUsage.ui)
    .map(c => ({
      uid    : newId(),
      id     : c.id,
      plugin : vpanelProject.plugins.get(c.plugin)
    }))
    .toArray();
  return prepareImport(project, components);
}

function prepareImport(project, newComponents) {

  const messages = [];
  const operations = [];
  for(const window of project.windows.values()) {
    for(const control of window.controls.values()) {
      for(const action of ['primaryAction', 'secondaryAction']) {
        if(!control[action]) { continue; }
        const actionComp = control[action].component;
        if(actionComp && !importIsComponentAction(newComponents, project.components.get(actionComp.component), actionComp.action)) {
          messages.push(` - ${window.id}/${control.id}/${action}`);
          operations.push({ type: 'deleteControlAction', window: window.uid, control: control.uid, action });
        }
      }

      if(control.text) {
        for(const item of control.text.context.values()) {
          if(!importIsComponentAttribute(newComponents, project.components.get(item.component), item.attribute)) {
            messages.push(` - ${window.id}/${control.id}/text/${item.id}`);
            operations.push({ type: 'deleteControlContext', window: window.uid, control: control.uid, context: item.uid });
          }
        }
      }

      if(control.display && !importIsComponentAttribute(newComponents, project.components.get(control.display.component), control.display.attribute)) {
        messages.push(` - ${window.id}/${control.id}/display`);
        operations.push({ type: 'deleteControlDisplayComponent', window: window.uid, control: control.uid });
      }
    }
  }

  for(const newComponent of newComponents) {
    const actualComponent = project.components.find(c => c.id === newComponent.id);
    if(actualComponent) {
      operations.push({ type: 'setComponentPlugin', component: actualComponent.uid, plugin: newComponent.plugin });
      continue;
    }

    operations.push({ type: 'newComponent', component: newComponent });
  }

  for(const oldComponent of project.components.values()) {
    if(newComponents.find(newComponent => newComponent.id === oldComponent.id)) {
      continue;
    }

    operations.push({ type: 'deleteComponent', component: oldComponent.uid });
  }

  return {
    messages,
    operations
  };
}

function importIsComponentAction(newComponents, oldComponent, actionName) {
  if(!oldComponent) { return true; }
  const comp = newComponents.find(c => c.id === oldComponent.id);
  if(!comp) { return false; }
  if(!actionName) { return true; }
  const action = comp.plugin.clazz.actions.find(a => a.name === actionName);
  if(!action) { return false; }
  if(action.types.length > 0) { return false; }
  return true;
}

function importIsComponentAttribute(newComponents, oldComponent, attributeName) {
  if(!oldComponent) { return true; }
  const comp = newComponents.find(c => c.id === oldComponent.id);
  if(!comp) { return false; }
  if(!attributeName) { return true; }
  const attribute = comp.plugin.clazz.attributes.find(a => a.name === attributeName);
  if(!attribute) { return false; }
  const oldAttribute = oldComponent.plugin.clazz.attributes.find(a => a.name === attributeName);
  if(attribute.type !== oldAttribute.type) { return false; }
  return true;
}

function prepareDeploy(project, resourcesEntity) {
  common.checkSaved(project);

  const resources = new Map();
  for(const resourceName of resourcesEntity.resources) {
    // delete all image/window
    // default_window will be reset too below
    if(resourceName.startsWith('image.') || resourceName.startsWith('window.')) {
      resources.set(resourceName, '');
    }
  }

  for(const image of project.images.values()) {
    resources.set(`image.${image.id}`, image.content);
  }

  for(const window of project.windows.values()) {
    const content = JSON.stringify({ window: serializeWindow(project, window) });
    resources.set(`window.${window.id}`, content);
  }

  resources.set('default_window', JSON.stringify({
    desktop: project.windows.get(project.desktopDefaultWindow).id,
    mobile:  project.windows.get(project.mobileDefaultWindow).id
  }));

  const operations = [];
  for(const [resourceId, resourceContent] of resources.entries()) {
    operations.push(createOperationResourceSet(resourceId, resourceContent));
  }

  let order=0;
  for(const op of operations) {
    op.order = ++order;
  }

  return operations;
}

function createOperationResourceSet(resourceId, resourceContent) {
  return {
    uid: newId(),
    enabled: true,
    description: `${resourceContent ? 'Set' : 'Delete'} resource ${resourceId}`,
    action: { type: 'resourceSet', resourceId, resourceContent }
  };
}

function createImage() {
  const uid = newId();
  return {
    uid,
    id      : `image_${uid}`,
    content : null
  };
}

function createWindow() {
  const uid = newId();
  return {
    uid,
    id                 : `window_${uid}`,
    height             : 500,
    width              : 500,
    style              : '',
    backgroundResource : null,
    controls           : Immutable.Map()
  };
}

function createControl(window, location, type) {
  const height = 50;
  const width = 50;
  const x = location.x / window.width;
  const y = location.y / window.height;

  const uid = newId();
  const control = {
    uid,
    id: `control_${uid}`,
    height,
    width,
    x,
    y,
    style: '',
    text: null,
    display: null,
    primaryAction: null,
    secondaryAction: null
  };

  switch(type) {
    case 'text':
      control.text = {
        format: '',
        context: Immutable.Map()
      };
      break;

    case 'image':
      control.display = {
        component: null,
        attribute: null,
        defaultResource: null,
        map: Immutable.Map()
      };
      break;

    default:
      throw new Error(`Unsupported control type: ${type}`);
  }

  return control;
}

function checkComponentUsage(project, component) {
  const usage = [];
  for(const window of project.windows.values()) {
    for(const control of window.controls.values()) {
      for(const property of ['primaryAction', 'secondaryAction']) {
        if(!control[property]) { continue; }
        const actionComp = control[property].component;
        if(actionComp && actionComp.component === component) {
          usage.push(` - ${window.id}/${control.id}/${property}`);
        }
      }

      if(control.text) {
        for(const item of control.text.context.values()) {
          if(item.component === component) {
            usage.push(` - ${window.id}/${control.id}/text/${item.id}`);
          }
        }
      }

      if(control.display &&
         control.display.component === component) {
        usage.push(` - ${window.id}/${control.id}/display`);
      }
    }
  }

  if(usage.length) {
    throw new Error('The component is used:\n' + usage.join('\n'));
  }
}

function checkImageUsage(project, image) {
  const usage = [];
  for(const window of project.windows.values()) {
    if(window.backgroundResource && window.backgroundResource === image) {
      usage.push(` - ${window.id}/backgroundResource`);
    }

    for(const control of window.controls.values()) {
      if(control.display) {
        if(control.display.defaultResource && control.display.defaultResource === image) {
          usage.push(` - ${window.id}/${control.id}/defaultResource`);
        }

        for(const item of control.display.map.values()) {
          if(item.resource === image) {
            usage.push(` - ${window.id}/${control.id}/display/mapping`);
            break;
          }
        }
      }
    }
  }

  if(usage.length) {
    throw new Error('The image is used:\n' + usage.join('\n'));
  }
}

function checkWindowUsage(project, window) {
  const usage = [];
  if(project.desktopDefaultWindow === window) {
    usage.push(' - desktopDefaultWindow');
  }
  if(project.mobileDefaultWindow === window) {
    usage.push(' - mobileDefaultWindow');
  }
  for(const iterWindow of project.windows.values()) {
    for(const control of iterWindow.controls.values()) {
      for(const property of ['primaryAction', 'secondaryAction']) {
        if(!control[property]) { continue; }
        const actionWindow = control[property].window;
        if(actionWindow && actionWindow.window && actionWindow.window === window) {
          usage.push(` - ${iterWindow.id}/${control.id}/${property}`);
        }
      }
    }
  }

  if(usage.length) {
    throw new Error('The window is used:\n' + usage.join('\n'));
  }
}
