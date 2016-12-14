'use strict';

import { createSelector } from 'reselect';

export const getProject    = (state, { project }) => state.projects.projects.get(project);
export const getComponents = (state, { project }) => getProject(project).components;
export const getImages     = (state, { project }) => getProject(project).images;
export const getWindows    = (state, { project }) => getProject(project).windows;

export const makeGetSortedComponents = () => createSelector(
  [ getComponents ],
  (components) => components.sortBy(it => it.id).toArray()
);

export const makeGetSortedImages = () => createSelector(
  [ getImages ],
  (images) => images.sortBy(it => it.id).toArray()
);

export const makeGetSortedWindows = () => createSelector(
  [ getWindows ],
  (windows) => windows.sortBy(it => it.id).toArray()
);
