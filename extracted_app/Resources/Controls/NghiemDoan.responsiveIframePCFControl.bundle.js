/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
var pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./responsiveIframePCFControl/index.ts":
/*!*********************************************!*\
  !*** ./responsiveIframePCFControl/index.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\n\nObject.defineProperty(exports, \"__esModule\", ({\n  value: true\n}));\nexports.responsiveIframePCFControl = void 0;\n\nvar responsiveIframePCFControl =\n/** @class */\nfunction () {\n  /**\r\n   * Empty constructor.\r\n   */\n  function responsiveIframePCFControl() {}\n  /**\r\n   * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.\r\n   * Data-set values are not initialized here, use updateView.\r\n   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.\r\n   * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.\r\n   * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.\r\n   * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.\r\n   */\n\n\n  responsiveIframePCFControl.prototype.init = function (context, notifyOutputChanged, state, container) {\n    // Add control initialization code\n    this._container = container;\n    this._controlViewRendered = false;\n  };\n  /**\r\n   * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.\r\n   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions\r\n   */\n\n\n  responsiveIframePCFControl.prototype.updateView = function (context) {\n    // Add code to update control view\n    if (!this._controlViewRendered) {\n      this.renderIFrame();\n      this._controlViewRendered = true;\n    }\n\n    var iframeSrc = context.parameters.source.raw;\n\n    if (this._Source != iframeSrc) {\n      this._Source = iframeSrc ? iframeSrc : \"\";\n\n      this._iframe.setAttribute(\"src\", this._Source);\n    }\n  };\n  /**\r\n   * Render iframe HTML Element and appends it to the control container\r\n   */\n\n\n  responsiveIframePCFControl.prototype.renderIFrame = function () {\n    var iFrameElement = document.createElement(\"iframe\");\n    iFrameElement.setAttribute(\"class\", \"iFrameControl\");\n    iFrameElement.setAttribute(\"frameborder\", \"0\");\n    this._iframe = iFrameElement;\n\n    this._container.appendChild(this._iframe);\n  };\n  /**\r\n   * It is called by the framework prior to a control receiving new data.\r\n   * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”\r\n   */\n\n\n  responsiveIframePCFControl.prototype.getOutputs = function () {\n    return {};\n  };\n  /**\r\n   * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.\r\n   * i.e. cancelling any pending remote calls, removing listeners, etc.\r\n   */\n\n\n  responsiveIframePCFControl.prototype.destroy = function () {// Add code to cleanup control if necessary\n  };\n\n  return responsiveIframePCFControl;\n}();\n\nexports.responsiveIframePCFControl = responsiveIframePCFControl;\n\n//# sourceURL=webpack://pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad/./responsiveIframePCFControl/index.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./responsiveIframePCFControl/index.ts"](0, __webpack_exports__);
/******/ 	pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad = __webpack_exports__;
/******/ 	
/******/ })()
;
if (window.ComponentFramework && window.ComponentFramework.registerControl) {
	ComponentFramework.registerControl('NghiemDoan.responsiveIframePCFControl', pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad.responsiveIframePCFControl);
} else {
	var NghiemDoan = NghiemDoan || {};
	NghiemDoan.responsiveIframePCFControl = pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad.responsiveIframePCFControl;
	pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad = undefined;
}