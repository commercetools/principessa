"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  execute: function execute(_ref) {
    var payload = _ref.payload;
    var run = _ref.run;
    var onComplete = _ref.onComplete;

    return { payload: payload, run: run, onComplete: onComplete };
  }
};