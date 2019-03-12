'use strict';
const fs = require('fs');
const path = require('path');
const util = require('util');
const readdir = util.promisify(fs.readdir);

const getFileNames = async (dir, ext) => {
  let extension = ext;
  let htmlFiles = await readdir(dir);
  return htmlFiles.filter(file => {
    return file.indexOf(extension) !== -1;
  });
};

module.exports = {
  getFileNames: getFileNames
};
