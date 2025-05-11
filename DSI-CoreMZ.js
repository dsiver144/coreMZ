//=============================================================================================================
// * Plugin Name  : DSI-CoreMZ.js
// * Last Updated : 5/11/2025
//=============================================================================================================
/*:
 * @author dsiver144
 * @plugindesc (v2.02) Core Plugin for DSI Plugins
 * @target MZ
 * @help 
 * Just install this on top of any DSI Plugin to make it work.
 * 
 * @param autoUpdate
 * @text Auto Update
 * @desc Automatically check for updates and download the latest version of the plugin.
 * @type boolean
 * @default true
 * 
 */
//=============================================================================================================
// Plugin Code
//=============================================================================================================
var Imported = Imported || {};
Imported["DSI-CoreMZ"] = true;
//=============================================================================================================
ESL = {};
//=============================================================================================================
ESL.Params = PluginManager.parameters("DSI-CoreMZ");
ESL.autoUpdate = !ESL.Params["autoUpdate"] || ESL.Params["autoUpdate"] === "true" ? true : false;

PluginManager.processParameters = function (paramObject) {
    paramObject = JsonEx.makeDeepCopy(paramObject);
    for (k in paramObject) {
        if (k.match(/(.+):(\w+)/i)) {
            var value = paramObject[k];
            delete paramObject[k];
            const paramName = RegExp.$1;
            const paramType = RegExp.$2;
            switch (paramType) {
                case 'struct':
                    value = JSON.parse(value);
                    value = this.processParameters(value);
                    break;
                case 'arr_struct':
                    var array = JSON.parse(value);
                    value = [];
                    for (let i = 0; i < array.length; i++) {
                        var rawStruct = JSON.parse(array[i]);
                        rawStruct = this.processParameters(rawStruct);
                        value.push(rawStruct)
                    }
                    break;
                case 'num': case 'number':
                    value = Number(value);
                    break;
                case 'arr': case 'note': case 'array':
                    value = JSON.parse(value);
                    break;
                case 'arr_num':
                    value = JSON.parse(value).map(n => Number(n));
                    break;
                case 'bool': case 'boolean':
                    value = value === 'true';
                    break;
                case 'vec': case 'vector':
                    value = value.split(",").map(n => Number(n));
                    break;
                case 'vec_str':
                    value = value.split(",");
                    break;
                case 'map':
                case 'location':
                    value = JSON.parse(value);
                    break;
            }
            paramObject[paramName] = value;
        }
    }
    return paramObject;
};
/**
 * Read Current Plugin Version
 */
ESL.readCurrentPluginVersion = function () {
    const scriptName = decodeURIComponent(document.currentScript.src).split('/').pop().replace(/\.js$/, '');
    const scriptPath = 'js/plugins/' + scriptName + '.js';
    const fs = require('fs');
    const data = fs.readFileSync(scriptPath, 'utf8');
    var scriptVersion = data.match(/@plugindesc\s*\(v(.+)\)/i);
    if (scriptVersion) {
        console.log(`Current Version: ${Number(scriptVersion[1])}`);
        return Number(scriptVersion[1]);
    }
    return 0;
}

ESL.getNewerPluginVersion = function (versionTextUrl) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", versionTextUrl);
        xhr.overrideMimeType("text/plain");
        xhr.onload = () => {
            if (xhr.status === 200) {
                const text = xhr.responseText;
                const version = Number(text);
                console.log(`Online Version: ${version}`);
                resolve(version);
            } else {
                reject()
            }
        }
        xhr.send(null);
    });
}

ESL.downloadNewPlugin = function (downloadVersionUrl, pluginPath = "js/plugins/") {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", downloadVersionUrl);
        xhr.overrideMimeType("text/plain");
        xhr.onload = () => {
            if (xhr.status === 200) {
                const text = xhr.responseText;
                const fs = require('fs');
                const downloadPluginName = decodeURIComponent(downloadVersionUrl).split('/').pop();
                const savePath = pluginPath + downloadPluginName;
                fs.writeFileSync(savePath, text, 'utf8');
                resolve(savePath);
                console.log(`Plugin downloaded to ${savePath}`);
            } else {
                console.error(`Failed to download plugin: ${xhr.status}`);
                reject()
            }
        }
        xhr.send(null);
    });


}

ESL.checkForNewVersion = async function (versionTextUrl, downloadVersionUrl) {
    if (!ESL.autoUpdate) {
        return false;
    }
    if (!Utils.isNwjs()) {
        return false;
    }
    const currentVersion = ESL.readCurrentPluginVersion();
    const onlineVersion = await ESL.getNewerPluginVersion(versionTextUrl);
    const downloadPluginName = decodeURIComponent(downloadVersionUrl).split('/').pop();
    if (currentVersion < onlineVersion) {
        const result = prompt(`A new version of [${downloadPluginName}] is available!. Enter "OK" to download or "Cancel" to ignore.`, "OK");
        if (result === "OK") {
            await ESL.downloadNewPlugin(downloadVersionUrl);
            alert("Plugin downloaded. Please restart the game to apply new changes!");
            SceneManager.exit();
        }
    } else {
        console.log("✅You are using the latest version of DSI-CoreMZ!");
    }
}

ESL.checkForNewVersion("https://raw.githubusercontent.com/dsiver144/coreMZ/refs/heads/master/version.txt", "https://raw.githubusercontent.com/dsiver144/coreMZ/refs/heads/master/DSI-CoreMZ.js");
/**
 * Parameters Ex
 * @param {string} pluginName
 */
PluginManager.parametersEx = function (pluginName) {
    return this.processParameters(this.parameters(pluginName));
}

var DSI_CoreMZ_PluginManager_callCommand = PluginManager.callCommand;
PluginManager.callCommand = function (self, pluginName, commandName, args) {
    const originalArgs = JsonEx.makeDeepCopy(args);
    try {
        args = this.processParameters(args);
    } catch (e) {
        console.error(`Error processing parameters for plugin ${pluginName}: Command ${commandName} ${e}`);
        args = originalArgs;
    }    
    DSI_CoreMZ_PluginManager_callCommand.call(this, self, pluginName, commandName, args);
};
//=============================================================================================================
//#region Saveable Objects
//=============================================================================================================
/**
 * SaveableObject
 * @abstract
 */
ESL.SaveableObject = class {
    /**
     * On New Game
     * @virtual
     */
    onNewGame() {

    }
    /**
     * On Game Loaded
     */
    onGameLoaded() {

    }
    /**
     * Save Properties
     * @virtual
     * @returns {Array}
     */
    saveProperties() {
        return [];
    }
    /**
     * Get Save Data
     */
    getSaveData() {
        const result = {};
        this.saveProperties().forEach(([property, _]) => {
            let data = this[property];
            if (property.match(/@Arr:(.+)/i)) {
                property = RegExp.$1;
                const array = this[property] || [];
                const newData = [];
                for (const entry of array) {
                    const saveData = entry.getSaveData();
                    saveData['klass'] = entry.constructor.name || entry.klassName;
                    newData.push(saveData);

                }
                data = newData;
            }
            if (property.match(/@Obj:(.+)/i)) {
                property = RegExp.$1;
                const object = this[property] || {};
                const newData = {};
                for (const objProp in object) {
                    newData[objProp] = object[objProp].getSaveData();
                    newData[objProp]['klass'] = object[objProp].constructor.name || object[objProp].klassName;
                }
                data = newData;
            }
            if (this[property] instanceof ESL.SaveableObject) {
                data = this[property].getSaveData();
                data['klass'] = this[property].constructor.name || this[property].klassName;
            }
            result[property] = data;
        })
        return (result);
    }
    /**
     * Load Save Data
     * @param {Object} savedData
     */
    loadSaveData(savedData) {
        this.saveProperties().forEach(([property, defaultValue]) => {
            let value = savedData[property];
            if (property.match(/@Arr:(.+)/i)) {
                property = RegExp.$1;
                const array = savedData[property] || [];
                const newData = [];
                for (const entry of array) {
                    const obj = eval(`new ${entry['klass']}()`);
                    obj.loadSaveData(entry)
                    newData.push(obj);
                }
                value = newData;
            }
            if (property.match(/@Obj:(.+)/i)) {
                property = RegExp.$1;
                const object = savedData[property] || {};
                const newData = {};
                for (const objProp in object) {
                    const obj = eval(`new ${object[objProp]['klass']}()`);
                    obj.loadSaveData(object[objProp])
                    newData[objProp] = obj;
                }
                value = newData;
            }
            if (value && value.klass) {
                value = eval(`new ${value.klass}()`);
                value.loadSaveData(savedData[property]);
            }
            this[property] = value != undefined ? value : defaultValue;
        });
    }
}

//#endregion

// #endregion
//=============================================================================================================
//#region Tween
/**
 * @typedef TweenOptions
 * @property {any} target
 * @property {Object.<string, number>} startSettings 
 * @property {Object.<string, number>} settings 
 * @property {number} duration
 * @property {MyEasingType} easeType
 * @property {number} delay
 * @property {boolean} loop
 * @property {Function} callback
 * @property {Function} updateFunction
 * 
 * @typedef BezierOptions
 * @property {any} target
 * @property {{x: number, y: number}} pointA
 * @property {{x: number, y: number}} pointB
 * @property {{x: number, y: number}} pointC
 * @property {number} duration
 * @property {MyEasingType} easeType
 * @property {number} delay
 * @property {boolean} loop
 * @property {Function} callback
 * @property {Function} updateFunction
 * 
 * 
 * @typedef {"easeLinear" | "easeInOutExpo" | "easeOutExpo" | "easeInOutQuad" | "easeLinear" | "easeOutSine" | "easeInCirc" | "easeInOutCubic" | "easeInOutBack"} MyEasingType
 */
//=============================================================================================================
ESL.Tween = ESL.Tween || {};
ESL.Tween.Easing = {};
ESL.Tween.Easing.easeInOutExpo = function (t, b, c, d) {
    if (t == 0) return b;
    if (t == d) return b + c;
    if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
    return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
}
ESL.Tween.Easing.easeOutExpo = function (t, b, c, d) {
    return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
}
ESL.Tween.Easing.easeInOutQuad = function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
}
ESL.Tween.Easing.easeLinear = function (t, b, c, d) {
    return c * t / d + b;
}
ESL.Tween.Easing.easeOutSine = function (t, b, c, d) {
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
}
ESL.Tween.Easing.easeInCirc = function (t, b, c, d) {
    return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
}
ESL.Tween.Easing.easeInCubic = function (t, b, c, d) {
    return c * (t /= d) * t * t + b;
}
ESL.Tween.Easing.easeInOutCubic = function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t + 2) + b;
}
ESL.Tween.Easing.easeInOutBack = function (t, b, c, d) {
    s = 1.70158;
    if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
    return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
}
/**
 * This class handle tweening of an object
 */
ESL.Tween.TweenObject = class {
    /**
     * Constructor
     * @param {Sprite} target
     * @param {Object.<string, number>} startSettings
     * @param {Object.<string, number>} settings
     * @param {number} duration
     * @param {Function} easingFunction
     * @param {boolean} loop
     */
    constructor(target, startSettings, settings, duration, easingFunction, delay = 0, loop = false, updateFunction = null) {
        this._target = target;
        this._startSettings = startSettings;
        this._settings = settings;
        this._duration = duration;
        this._loop = loop;
        this._delayTime = delay;
        this._easingFunction = easingFunction;
        this._started = false;
        this._updateFunction = updateFunction;
    }
    /**
     * On Finish
     * @param {Function} callback
     */
    onFinish(callback) {
        this._onFinishCallback = callback;
    }
    /**
     * Start
     */
    start() {
        this._started = true;
        this._frameCount = 0;
        this._frameDirection = 1;
        this.refreshTargetCount();
        this.initStartingValues();
        this.initPropertyValues();
    }
    /**
     * Refresh Target Count
     */
    refreshTargetCount() {
        this._targetCount = this._frameDirection > 0 ? this._duration : 0;
    }
    /**
     * Init Starting Values
     */
    initStartingValues() {
        for (let propertyName in this._startSettings) {
            this._target[propertyName] = this._startSettings[propertyName];
        }
    }
    /**
     * Init Property Values
     */
    initPropertyValues() {
        /** @type {Object.<string, {start: number, change: number}>} */
        this._properties = {};
        for (let propertyName in this._settings) {
            const endValue = this._settings[propertyName];
            const curValue = this._target[propertyName];
            this._properties[propertyName] = {
                start: curValue,
                change: endValue - curValue
            }
        }
    }
    /**
     * Update
     */
    update() {
        if (!this._started) {
            return;
        }
        if (this._delayTime > 0) {
            this._delayTime -= 1;
            return;
        }
        if (this._frameCount != this._targetCount) {
            for (let propertyName in this._properties) {
                const propertyData = this._properties[propertyName];
                var t = this._frameCount;
                var b = propertyData.start;
                var c = propertyData.change;
                var d = this._duration;
                this._target[propertyName] = this._easingFunction(t, b, c, d);
            }
            this._frameCount += this._frameDirection;
        } else {
            if (this._loop) {
                this._frameDirection *= -1;
                this.refreshTargetCount();
            } else {
                for (let propertyName in this._properties) {
                    const propertyData = this._properties[propertyName];
                    var b = propertyData.start;
                    var c = propertyData.change;
                    var d = this._duration;
                    this._target[propertyName] = this._easingFunction(d, b, c, d);
                }
                this._started = false;
                this._onFinishCallback && this._onFinishCallback();
            }
        }
        this._updateFunction && this._updateFunction(this._target, this._frameCount / this._duration);
    }
}
ESL.Tween.Manager = class {
    /**
     * Constructor
     */
    constructor() {
        ESL.Tween.Manager.inst = this;
        /** @type {ESL.Tween.TweenObject[]} */
        this._tweens = [];
    }
    /**
     * Add Tween
     * @param {ESL.MyTween} tween
     */
    addTween(tween) {
        this._tweens.push(tween);
    }
    /**
     * Remove Tween
     * @param {ESL.MyTween} tween
     */
    removeTween(tween) {
        const index = this._tweens.indexOf(tween);
        if (index > -1) {
            this._tweens.splice(index, 1);
        }
    }
    /**
     * Remove Tween By Target
     * @param {any} target
     */
    removeTweensByTarget(target) {
        this._tweens = this._tweens.filter(tween => tween._target != target);
    }
    /**
     * Remove All Tweens
     */
    removeAllTweens() {
        this._tweens.splice(0, this._tweens.length);
    }
    /**
     * Update
     */
    update() {
        this._tweens.forEach(tween => tween.update());
    }
}
/** @type {ESL.Tween.Manager} */
ESL.Tween.Manager.inst = null;
/**
 * Tween display object to specific state
 * @param {TweenOptions} tweenOptions
 * @returns {ESL.MyTween}
 */
ESL.Tween.start = function (tweenOptions) {
    const tween = new ESL.Tween.TweenObject(
        tweenOptions.target,
        tweenOptions.startSettings ?? {},
        tweenOptions.settings,
        tweenOptions.duration ?? 30,
        ESL.Tween.Easing[tweenOptions.easeType] ?? "easeLinear",
        tweenOptions.delay ?? 0,
        tweenOptions.loop ?? false,
        tweenOptions.updateFunction ?? null
    );
    if (tweenOptions.callback) {
        tween.onFinish(tweenOptions.callback);
    }
    ESL.Tween.addAndStart(tween);
    return tween;
}
/**
 * Tween display object to bezier curve
 * @param {BezierOptions} bezierOption 
 * @returns {ESL.MyTween}
 */
ESL.Tween.startBezier = function (bezierOption) {
    bezierOption.target._bezierTimer = 0;
    bezierOption.target._bezierPointAStartX = bezierOption.pointA.x;
    bezierOption.target._bezierPointAStartY = bezierOption.pointA.y;
    bezierOption.target._bezierPointBStartX = bezierOption.pointB.x;
    bezierOption.target._bezierPointBStartY = bezierOption.pointB.y;
    bezierOption.target._bezierPointCStartX = bezierOption.pointC.x;
    bezierOption.target._bezierPointCStartY = bezierOption.pointC.y;
    const tween = new ESL.Tween.TweenObject(
        bezierOption.target,
        {},
        {
            _bezierTimer: 1.0,
        },
        bezierOption.duration ?? 30,
        ESL.Tween.Easing[bezierOption.easeType] ?? "easeLinear",
        bezierOption.delay ?? 0,
        bezierOption.loop ?? false,
        (sprite, t) => {
            sprite.x = (1 - t) * (1 - t) * sprite._bezierPointAStartX + 2 * (1 - t) * t * sprite._bezierPointBStartX + t * t * sprite._bezierPointCStartX;
            sprite.y = (1 - t) * (1 - t) * sprite._bezierPointAStartY + 2 * (1 - t) * t * sprite._bezierPointBStartY + t * t * sprite._bezierPointCStartY;
            if (bezierOption.updateFunction) {
                bezierOption.updateFunction(sprite, t);
            }
        }
    )
    if (bezierOption.callback) {
        tween.onFinish(bezierOption.callback);
    }
    ESL.Tween.addAndStart(tween);
    return tween;
}
/**
 * Add And Start A Tween
 * @param {ESL.MyTween} tween
 */
ESL.Tween.addAndStart = function (tween) {
    ESL.Tween.Manager.inst.addTween(tween);
    tween.start();
}
/**
 * Remove Tween
 * @param {ESL.MyTween} tween
 */
ESL.Tween.remove = function (tween) {
    ESL.Tween.Manager.inst.removeTween(tween);
}
/**
 * Remove Tween By Target
 * This will remove all tweens that are targeting the same object
 * @param {any} target
 */
ESL.Tween.removeTweensByTarget = function (target) {
    ESL.Tween.Manager.inst.removeTweensByTarget(target);
}
/**
 * Remove All Tweens
 */
ESL.Tween.removeAllTweens = function () {
    ESL.Tween.Manager.inst.removeAllTweens();
}

Object.defineProperty(Sprite.prototype, 'scaleX', {
    get: function () {
        return this.scale.x;
    },
    set: function (v) {
        this.scale.x = v;
    },
    configurable: true
});
Object.defineProperty(Sprite.prototype, 'scaleY', {
    get: function () {
        return this.scale.y;
    },
    set: function (v) {
        this.scale.y = v;
    },
    configurable: true
});
//#endregion
//=============================================================================================================
//#region File
//=============================================================================================================
ESL.File = ESL.File || {};
/**
 * Load Data Async from data folder
 * @param {string} src 
 * @returns {Promise<any>}
 */
ESL.File.loadDataAsync = function (src) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = "data/" + src;
        xhr.open("GET", url);
        xhr.overrideMimeType("application/json");
        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
            } else {
                reject()
            }
        };
        xhr.onerror = () => reject();
        xhr.send();
    });
}
/**
 * Load Map Data Async
 * @param {number} mapId
 * @returns {Promise<any>}
 */
ESL.File.loadMapDataAsync = function (mapId) {
    const filename = "Map%1.json".format(mapId.padZero(3));
    return this.loadDataAsync(filename);
}
//=============================================================================================================
//#region Utils
//=============================================================================================================
ESL.Utils = ESL.Utils || {};
/**
 * Generate a UUID
 * @returns {String} A UUID
 */
ESL.Utils.generateUUID = function () {
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
/**
 * Set Cursor
 * @param {"pointer" | "default" | "help" | "wait" | "text" | "move" | "zoom-in" | "zoom-out"} cursor
 */
ESL.Utils.setCursor = function (cursor) {
    document.body.style.cursor = cursor;
}
/**
 * This is a simple stage machine that use methods to handle states
 */
ESL.Utils.MethodStateMachine = class {
    /**
     * Constructor
     */
    constructor() {
        /** @type {Object.<string, {onEnter: Function, onUpdate: Function, onExit: Function}>>} */
        this._methods = {};
    }
    /**
     * Add Method
     * @param {string} name 
     * @param {() => void} method 
     */
    addStates(name, onEnter, onUpdate, onExit) {
        this._methods[name] = {
            onEnter: onEnter,
            onUpdate: onUpdate,
            onExit: onExit
        };
    }
    /**
     * Set State
     * @param {string} name
     */
    setState(name) {
        if (this._currentState) {
            this._currentState.onExit();
        }
        this._currentState = this._methods[name];
        this._currentState.onEnter();
    }
    /**
     * Update
     */
    update() {
        if (this._currentState) {
            this._currentState.onUpdate();
        }
    }
}
/**
 * Easy A Star Algorithm
 * @param {(x: number, y: number) => boolean} walkableFunction 
 * @param {{x: number, y: number}} start 
 * @param {{x: number, y: number}} end 
 * @returns {{x: number, y: number}[]}
 */
ESL.Utils.easyAStar = function (walkableFunction, start, end) {
    var open = {};
    var close = {};
    open[start.x + "_" + start.y] = {
        pos: start,
        parent: null,
        g: 0,
        h: Math.abs(end.x - start.x) + Math.abs(end.y - start.y)
    };
    while ((!close[end.x + "_" + end.y]) && Object.keys(open).length > 0) {
        var minF = Number.POSITIVE_INFINITY;
        var minFkey = "";
        for (var key in open) {
            if (open.hasOwnProperty(key)) {
                var f = open[key].g + open[key].h;
                if (f < minF) {
                    minF = f;
                    minFkey = key;
                }
            }
        }
        close[minFkey] = open[minFkey];
        delete open[minFkey];
        var curNode = close[minFkey];
        var fourDt = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];
        for (var index = 0; index < fourDt.length; index++) {
            var dt = fourDt[index];
            var tmpPos = { x: curNode.pos.x + dt.x, y: curNode.pos.y + dt.y };
            if (walkableFunction(tmpPos.x, tmpPos.y)) {
                if (!close[tmpPos.x + "_" + tmpPos.y]) {
                    if ((!open[tmpPos.x + "_" + tmpPos.y]) || (open[tmpPos.x + "_" + tmpPos.y].g > curNode.g + 1)) {
                        open[tmpPos.x + "_" + tmpPos.y] = {
                            pos: tmpPos,
                            parent: curNode.pos,
                            g: curNode.g + 1,
                            h: Math.abs(end.x - tmpPos.x) + Math.abs(end.y - tmpPos.y)
                        };
                    }
                }
            }
        }
    }
    if (close[end.x + "_" + end.y]) {
        var path = [];
        path.push(close[end.x + "_" + end.y].pos);
        var parent_1 = close[end.x + "_" + end.y].parent;
        while (parent_1) {
            path.push(parent_1);
            parent_1 = close[parent_1.x + "_" + parent_1.y].parent;
        }
        return path.reverse();
    }
    else {
        return null;
    }
}
ESL.Utils.waitForMiliseconds = function (miliseconds) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            clearTimeout(timeout);
            resolve();
        }, miliseconds);
    });
}
// //#endregion
//=============================================================================================================
//#region Bitmap
//=============================================================================================================
ESL.Bitmap = ESL.Bitmap || {};
ESL.Bitmap.drawIcon = function (bitmap, iconIndex, x, y) {
    var pw = ImageManager.iconWidth;
    var ph = ImageManager.iconHeight;
    var sx = iconIndex % 16 * pw;
    var sy = Math.floor(iconIndex / 16) * ph;
    bitmap.blt(bitmap, sx, sy, pw, ph, x, y);
};
/**
 * Draw a circle on a bitmap
 * @param {Bitmap} targetBitmap 
 * @param {number} x 
 * @param {number} y 
 * @param {number} radius 
 * @param {string} color 
 * @param {string} color2 
 * @param {number} lineWidth 
 * @param {number} startAngle 
 * @param {number} endAngle 
 * @param {string} joinStyle 
 */
ESL.Bitmap.drawCircle = function (targetBitmap, x, y, radius, color, color2, lineWidth, startAngle, endAngle, joinStyle = "miter") {
    var context = targetBitmap._context;
    context.save();
    if (color2) {
        var grad = context.createLinearGradient(x - radius, y - radius, radius * 2, radius * 2);
        grad.addColorStop(0, color2);
        grad.addColorStop(1, color);
    } else {
        var grad = color;
    }
    context.strokeStyle = grad;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.arc(x, y, radius, startAngle, endAngle, false);
    context.lineJoin = context.lineCap = joinStyle;
    context.stroke();
    context.restore();
    // targetBitmap._setDirty();
};
/**
 * Draw Sprite Content To Bitmap (MZ)
 * @param {Bitmap} targetBitmap
 * @param {Sprite} sprite
 * @param {number} x
 * @param {number} y
 */
ESL.Bitmap.fromSprite = function (targetBitmap, sprite, x, y) {
    /** @type {PIXI.RenderTexture} */
    const renderTexture = PIXI.RenderTexture.create(sprite.width, sprite.height);
    /** @type {PIXI.Renderer} */
    const renderer = Graphics.app.renderer;
    renderer.render(sprite, renderTexture);
    const canvas = renderer.extract.canvas(renderTexture);

    targetBitmap.context.drawImage(canvas, x, y);
}
/**
 * On Loaded
 * @param {Bitmap} bitmap
 * @param {(bitmap: Bitmap) => void} callback
 */
ESL.Bitmap.onLoaded = function (bitmap, callback) {
    if (bitmap.isReady()) {
        callback(bitmap);
    } else {
        bitmap.addLoadListener(callback);
    }
};
//=============================================================================================================
//#region Sprite
//=============================================================================================================
ESL.Sprite = ESL.Sprite || {};
/**
 * Canvas To Local Position
 * @param {Sprite} sprite
 * @param {number} x
 * @param {number} y
 * @returns {{x: number, y: number}}
 */
ESL.Sprite.canvasToLocalPosition = function (sprite, x, y) {
    const node = sprite;
    const transform = node.worldTransform;
    const globalX = x - Graphics._canvas.offsetLeft;
    const localX = (globalX - transform.tx) / transform.a + sprite.anchor.x * sprite.width;
    const globalY = y - Graphics._canvas.offsetTop;
    const localY = (globalY - transform.ty) / transform.d + sprite.anchor.y * sprite.height;
    return { x: localX, y: localY };
}
/**
 * Is Being Touched 
 * @param {Sprite} sprite
 * @returns {boolean}
 */
ESL.Sprite.isBeingTouched = function (sprite) {
    const localPosition = ESL.Sprite.canvasToLocalPosition(sprite, TouchInput.x, TouchInput.y);
    const checkX = localPosition.x;
    const checkY = localPosition.y;
    return sprite.visible && sprite.worldVisible && checkX >= 0 && checkX < sprite.width && checkY >= 0 && checkY < sprite.height;
}
/**
 * ESL.Sprite.BasicButton
 * @typedef BasicInteractiveOption
 * @property {number[]} selectedColor
 * @property {number[]} disabledColor
 * @property {number[]} hoverColor
 * @property {number[]} defaultColor
 * @property {bool} playOkSound
 * @property {bool} playBuzzerSound
 */
ESL.Sprite.BasicInteractiveButton = class extends Sprite_Clickable {
    /**
     * BasicButton
     * @param {BasicInteractiveOption} options
     */
    constructor(options) {
        super();
        /** @type {BasicInteractiveOption} */
        this._buttonSettings = options ?? {};
        this._buttonSettings.selectedColor = this._buttonSettings.selectedColor ?? [255, 255, 255, 128];
        this._buttonSettings.disabledColor = this._buttonSettings.disabledColor ?? [0, 0, 0, 200];
        this._buttonSettings.hoverColor = this._buttonSettings.hoverColor ?? [255, 255, 255, 128];
        this._buttonSettings.defaultColor = this._buttonSettings.defaultColor ?? [0, 0, 0, 0];
        this._buttonSettings.playOkSound = this._buttonSettings.playOkSound ?? true;
        this._buttonSettings.playBuzzerSound = this._buttonSettings.playBuzzerSound ?? true;
        this._disabled = false;
        this._selected = false;
    }
    /**
     * Set Click Handler
     * @param {Function} handler
     */
    setClickHandler(handler) {
        this._clickHandler = handler;
    }
    /**
     * On Click
     */
    onClick() {
        if (this._disabled) {
            this._buttonSettings.playBuzzerSound && SoundManager.playBuzzer();
            return;
        }
        if (this._clickHandler) {
            this._buttonSettings.playOkSound && SoundManager.playOk();
            this._clickHandler();
        }
    }
    /**
     * On Mouse Enter
     */
    onMouseEnter() {
        this.setBlendColor(this._buttonSettings.hoverColor);
    }
    /**
     * On Mouse Exit
     */
    onMouseExit() {
        this.setBlendColor(this._buttonSettings.defaultColor);
    }
    /**
     * Disable
     */
    disable() {
        this.setColorTone(this._buttonSettings.disabledColor);
        this.opacity = 128;
        this._disabled = true;
    }
    /**
     * Enable
     */
    enable() {
        this.setColorTone(this._buttonSettings.defaultColor);
        this.opacity = 255;
        this._disabled = false;
    }
    /**
     * Select
     */
    select() {
        this._selected = true;
        this.setBlendColor(this._buttonSettings.selectedColor);
    }
    /**
     * Deselect
     */
    deselect() {
        this._selected = false;
        this.setBlendColor(this._buttonSettings.defaultColor);
    }
    /**
     * Is Selected
     */
    isSelected() {
        return this._selected;
    }
    /**
     * Is Disabled
     */
    isDisabled() {
        return this._disabled;
    }
}
//#endregion
//#endregion
//=============================================================================================================
// #region Date Timer
//=============================================================================================================
ESL.DateTime = ESL.DateTime || {};
/**
 * Format In-game frames to real time format.
 * @param {number} frames 
 * @param {boolean} showMins 
 * @param {boolean} showHours 
 * @returns {string}
 */
ESL.DateTime.convertFrameToRealLifeFormat = function (frames, showMins = false, showHours = false) {
    let seconds = Math.floor(frames / 60);
    let mins = Math.floor(frames / 3600);
    let hours = Math.floor(frames / 216000);
    let text = '';
    if (showMins) {
        seconds %= 60;
        text = `${mins}`.padStart(2, "0") + ":" + `${seconds}`.padStart(2, "0");
    }
    if (showMins && showHours) {
        mins %= 60;
        text = `${hours}`.padStart(2, "0") + ":" + `${mins}`.padStart(2, "0") + ":" + `${seconds}`.padStart(2, "0");
    }
    return text;
}
//=============================================================================================================
//#region Math
//=============================================================================================================
ESL.Math = ESL.Math || {};
/**
 * Get random float number from 0 to 1 (excluded)
 * @returns {number}
 */
ESL.Math.random = function () {
    return Math.random();
}
/**
 * Get a random number from min to max (included)
 * @param {number} min 
 * @param {number} max 
 */
ESL.Math.randomInt = function (min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}
/**
 * Clamp a value in a specific range
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 */
ESL.Math.clamp = function (value, min, max) {
    return Math.max(Math.min(value, max), min);;
}
/**
 * Remap a value from a specific range to another range
 * @param {number} value 
 * @param {number} low1 
 * @param {number} high1 
 * @param {number} low2 
 * @param {number} high2 
 * @returns 
 */
ESL.Math.remap = function (value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}
/**
 * Deg To Rad
 * @param {number} deg
 */
ESL.Math.degToRad = function (deg) {
    return (Math.PI / 180) * deg;
}

/**
 * Rad To Deg
 * @param {number} rad
 */
ESL.Math.radToDeg = function (rad) {
    return (180 / Math.PI) * rad;
}
/**
 * Distance From Point To Point
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */
ESL.Math.distanceFromPointToPoint = function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

ESL.Math.Vector2 = class extends ESL.SaveableObject {
    /**
     * Represents a 2D vector.
     * @param {number} x - The x component of the vector.
     * @param {number} y - The y component of the vector.
     */
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.klassName = "ESL.Math.Vector2";
    }
    /**
     * Save Properties
     */
    saveProperties() {
        return [
            ["x", 0],
            ["y", 0]
        ];
    }
    /**
     * Clone
     */
    clone() {
        return new ESL.Math.Vector2(this.x, this.y);
    }
    /**
     * Equals
     * @param {ESL.Math.Vector2} other
     */
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    /**
     * Length
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    /**
     * Normalized
     * Returns a new vector with the same direction but a length of 1.
     * If the vector is zero-length, it returns a zero vector.
     * @returns {ESL.Math.Vector2} A new normalized vector.
     */
    normalized() {
        const length = this.length();
        if (length === 0) {
            return new MathCore.Vector2(0, 0);
        }
        return new ESL.Math.Vector2(this.x / length, this.y / length);
    }
    /**
     * Add
     * @param {MathCore.Vector2} other
     */
    add(other) {
        return new ESL.Math.Vector2(this.x + other.x, this.y + other.y);
    }
    /**
     * Subtract
     * @param {} other
     */
    subtract(other) {
        return new ESL.Math.Vector2(this.x - other.x, this.y - other.y);
    }
    /**
     * Multiply
     * @param {number} scalar
     */
    multiply(scalar) {
        return new ESL.Math.Vector2(this.x * scalar, this.y * scalar);
    }
    /**
     * Divide
     * @param {number} scalar
     */
    divide(scalar) {
        if (scalar === 0) {
            throw new Error("Cannot divide by zero");
        }
        return new ESL.Math.Vector2(this.x / scalar, this.y / scalar);
    }
    /**
     * Dot Product
     * @param {ESL.Math.Vector2} other
     * Returns the dot product of this vector and another vector.
     * The dot product is a scalar value that represents the cosine of the angle between the two vectors.
     */
    dotProduct(other) {
        return this.x * other.x + this.y * other.y;
    }
    /**
     * Angle Between
     * @param {ESL.Math.Vector2} other
     */
    angleBetween(other) {
        const dot = this.dotProduct(other);
        const lengthA = this.length();
        const lengthB = other.length();
        if (lengthA === 0 || lengthB === 0) {
            return 0;
        }
        const cosTheta = dot / (lengthA * lengthB);
        return Math.acos(cosTheta);
    }
    /**
     * Cross Product
     * if return value is positive, this vector is on the left side of the other vector
     * if return value is negative, this vector is on the right side of the other vector
     * if return value is 0, this vector is on the same line of the other vector
     * @param {ESL.Math.Vector2} other
     */
    crossProduct(other) {
        return this.x * other.y - this.y * other.x;
    }
    /**
     * Angle
     */
    angleRad() {
        return Math.atan2(this.y, this.x);
    }
    /**
     * Angle Deg
     */
    angleDeg() {
        return this.angleRad() * (180 / Math.PI);
    }
    /**
     * Rotated
     * @param {number} angle
     */
    rotated(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new ESL.Math.Vector2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }
    /**
     * Rotated Deg
     * @param {number} angleDeg
     */
    rotatedDeg(angleDeg) {
        return this.rotated(ESL.Math.degToRad(angleDeg));
    }
    /**
     * Rounded
     */
    rounded() {
        return new ESL.Math.Vector2(Math.round(this.x), Math.round(this.y));
    }
    /**
     * Floored
     */
    floored() {
        return new ESL.Math.Vector2(Math.floor(this.x), Math.floor(this.y));
    }
    /**
     * To Polar
     */
    toPolar() {
        const r = this.length();
        const theta = Math.atan2(this.y, this.x);
        return { r, theta };
    }
    /**
     * Static from Polar
     * @param {number} r
     * @param {number} theta
     */
    static fromPolar(r, theta) {
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        return new ESL.Math.Vector2(x, y);
    }
    /**
     * To String
     */
    toString() {
        return `${this.x},${this.y}`;
    }
}

ESL.Math.Rectangle = class extends ESL.SaveableObject {
    /**
     * Represents a rectangle in 2D space.
     * @param {number} x - The x coordinate of the rectangle.
     * @param {number} y - The y coordinate of the rectangle.
     * @param {number} x2 - The x2 coordinate of the rectangle.
     * @param {number} y2 - The y2 coordinate of the rectangle.
     */
    constructor(x, y, width, height) {
        super();
        this.topLeft = new ESL.Math.Vector2(x, y);
        this.width = width;
        this.height = height;
        this.klassName = "ESL.Math.Rectangle";
    }
    /**
     * Move
     * @param {number} x
     * @param {number} y
     */
    move(x, y) {
        const dx = x - this.topLeft.x;
        const dy = y - this.topLeft.y;
        this.topLeft.x += dx;
        this.topLeft.y += dy;
    }
    /**
     * Save Properties
     */
    saveProperties() {
        return [
            ["topLeft", null],
            ["bottomRight", null]
        ];
    }
}

ESL.Math.Circle = class extends ESL.SaveableObject {
    /**
     * Represents a circle in 2D space.
     * @param {number} x - The x coordinate of the circle's center.
     * @param {number} y - The y coordinate of the circle's center.
     * @param {number} radius - The radius of the circle.
     */
    constructor(x, y, radius) {
        super();
        this.center = new ESL.Math.Vector2(x, y);
        this.radius = radius;
        this.klassName = "ESL.Math.Circle";
    }
    /**
     * Move
     * @param {number} x
     * @param {number} y
     */
    move(x, y) {
        const dx = x - this.center.x;
        const dy = y - this.center.y;
        this.center.x += dx;
        this.center.y += dy;
    }
    /**
     * Save Properties
     */
    saveProperties() {
        return [
            ["center", 0],
            ["radius", 0]
        ];
    }
}


ESL.Math.CollideChecker = class {
    /**
     * Static check Collision
     * @param {any} obj1
     * @param {any} obj2
     */
    static checkCollision(obj1, obj2) {
        if (obj1 instanceof ESL.Math.Rectangle && obj2 instanceof ESL.Math.Rectangle) {
            return this.checkRectangleCollision(obj1, obj2);
        } else if (obj1 instanceof ESL.Math.Circle && obj2 instanceof ESL.Math.Circle) {
            return this.checkCircleCollision(obj1, obj2);
        } else if (obj1 instanceof ESL.Math.Circle && obj2 instanceof ESL.Math.Rectangle) {
            return this.checkCircleRectangleCollision(obj1, obj2);
        } else if (obj1 instanceof ESL.Math.Rectangle && obj2 instanceof ESL.Math.Circle) {
            return this.checkCircleRectangleCollision(obj2, obj1);
        }
        return false;
    }
    /**
     * Static check Rectangle Collision
     * @param {ESL.Math.Rectangle} rect1
     * @param {ESL.Math.Rectangle} rect2
     */
    static checkRectangleCollision(rect1, rect2) {
        return !(rect2.topLeft.x > rect1.topLeft.x + rect1.width ||
            rect2.topLeft.x + rect2.width < rect1.topLeft.x ||
            rect2.topLeft.y > rect1.topLeft.y + rect1.height ||
            rect2.topLeft.y + rect2.height < rect1.topLeft.y);
    }
    /**
     * Static check Circle Collision
     * @param {ESL.Math.Circle} circle1
     * @param {ESL.Math.Circle} circle2
     */
    static checkCircleCollision(circle1, circle2) {
        const dx = circle1.center.x - circle2.center.x;
        const dy = circle1.center.y - circle2.center.y;
        const distanceSquared = dx * dx + dy * dy;
        const radiusSum = circle1.radius + circle2.radius;
        return distanceSquared <= radiusSum * radiusSum;
    }
    /**
     * Static check Circle Rectangle Collision
     * @param {ESL.Math.Circle} circle
     * @param {ESL.Math.Rectangle} rect
     */
    static checkCircleRectangleCollision(circle, rect) {
        var distX = Math.abs(circle.center.x - rect.topLeft.x - rect.width / 2);
        var distY = Math.abs(circle.center.y - rect.topLeft.y - rect.height / 2);
        if (distX > (rect.width / 2 + circle.radius)) { return false; }
        if (distY > (rect.height / 2 + circle.radius)) { return false; }
        if (distX <= (rect.width / 2)) { return true; }
        if (distY <= (rect.height / 2)) { return true; }
        var dx = distX - rect.width / 2;
        var dy = distY - rect.height / 2;
        return (dx * dx + dy * dy <= (circle.radius * circle.radius));
    }
    /**
     * Test
     */
    static test() {
        const rect1 = new MathCore.Rectangle(0, 0, 10, 10);
        const rect2 = new MathCore.Rectangle(5, 5, 15, 15);
        const circle1 = new MathCore.Circle(5, 5, 3);
        const circle2 = new MathCore.Circle(8, 8, 3);

        console.log(this.checkCollision(rect1, rect2)); // true
        console.log(this.checkCollision(circle1, circle2)); // true
        console.log(this.checkCollision(circle1, rect1)); // true
        console.log(this.checkCollision(circle2, rect2)); // true
    }
}

ESL.Stack = class {
    /**
     * Constructor
     */
    constructor() {
        this.stack = [];
    }
    /**
     * Push
     * @param {any} item
     */
    push(item) {
        return this.stack.push(item);
    }
    /**
     * Pop
     */
    pop() {
        return this.stack.pop();
    }
    /**
     * Peek
     */
    peek() {
        return this.stack[this.length - 1];
    }
    /**
     * Get length
     */
    get length() {
        return this.stack.length;
    }
    /**
     * Is Empty
     */
    isEmpty() {
        return this.length === 0;
    }
}

ESL.Queue = class {
    /**
     * Constructor
     */
    constructor() {
        this.queue = [];
    }
    /**
     * Enqueue
     * @param {any} item
     */
    enqueue(item) {
        return this.queue.unshift(item);
    }
    /**
     * Dequeue
     */
    dequeue() {
        return this.queue.pop();
    }
    /**
     * Peek
     */
    peek() {
        return this.queue[this.length - 1];
    }
    /**
     * Get length
     */
    get length() {
        return this.queue.length;
    }
    /**
     * Is Empty
     */
    isEmpty() {
        return this.queue.length === 0;
    }
}
//=============================================================================================================
//#region Array Core
//=============================================================================================================
ESL.Array = ESL.Array || {};
/**
 * Get random element from an array
 * @template T
 * @param {Array<T>} array 
 * @returns {T}
 */
ESL.Array.randomElement = function (array) {
    return array[Math.floor(Math.random() * array.length)];
}
/**
 * Shuffle an array
 * @template T
 * @link https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 * @param {Array<T>} array 
 * @returns {Array<T>}
 */
ESL.Array.shuffle = function (array) {
    let currentIndex = array.length
    let randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}
/**
 * Return a new copy of an array that dont contains falsy values.
 * @template T
 * @param {Array<T>} array 
 * @returns {Array<T>} an array with all falsy values removed
 */
ESL.Array.compact = function (array) {
    return array.filter(Boolean);
}
/**
 * uniq
 * @template T
 * @param {Array<T>} array - List of elements
 * @param {Boolean} [sort=false] - optional flag to sort
 * @return {Array<T>} Returns uniq values list
 */
ESL.Array.uniq = function (array, sort = false) {
    return sort ? [...new Set(array)].sort() : [...new Set(array)];
}
/**
 * intersection
 * @template T
 * @param {...*} args - List of arrays
 * @return {Array<T>} Returns a list of unique values
 */
ESL.Array.intersection = function (...args) {
    const [first, ...rest] = args;
    return first.filter(item => rest.flat().includes(item));
}
/**
 * diff
 * @template T
 * @param {...*} args - List of arrays
 * @return {Array<T>} Returns result of excluded values
 */
ESL.Array.diff = function (...args) {
    const [first, ...rest] = args;
    return first.filter(item => !rest.flat().includes(item));
}
/**
 * Find Last
 * @template T
 * @param {Array<T>} array
 * @param {(element: T) => bool} predicate
 * @return {T} Returns the last element that matches the predicate
 */
ESL.Array.findLast = function (array, predicate) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i])) {
            return array[i];
        }
    }
    return null;
}
/**
 * Return a list of all object that match multiple condition
 * 
 * @template T
 * @param {Array<T>} list 
 * @param {T} propList 
 */
ESL.Array.where = function (list, propList) {
    return list.filter((object) => {
        return Object.keys(propList).every(prop => {
            return object[prop] == propList[prop];
        });
    });
}
/**
 * Return the first object in the array that match multiple condition
 * 
 * @template T
 * @param {Array<T>} list 
 * @param {T} propList 
 */
ESL.Array.findWhere = function (list, propList) {
    for (let object of list) {
        const status = Object.keys(propList).every(prop => {
            return object[prop] == propList[prop];
        });
        if (status) return object;
    }
    return null;
}
/**
 * Group object by a specific property
 * 
 * @template T
 * @param {Array<T>} list 
 * @param {string} propName 
 * @return {Object.<string, Array<T>}
 */
ESL.Array.groupBy = function (list, propName) {
    /** @type {Object.<string, Array<T>} */
    const map = {}
    list.forEach(object => {
        const array = map[object[propName]] || [];
        if (array.length == 0) {
            map[object[propName]] = array;
        }
        array.push(object);
    });
    return map;
}

/**
 * Dynamic sort an array base on element's property
 * @template T
 * @param {Array<T>} array 
 * @param {string} property 
 */
ESL.Array.dynamicSort = function (array, property) {
    let sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return array.sort(function (a, b) {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    });
}

/**
 * Dynamic sort an array base on multiple element's property
 * @template T
 * @param {Array<T>} array 
 * @param {string[]} properties 
 */
ESL.Array.dynamicSortEx = function (array, properties) {
    var props = properties;
    function dynamicSort(property) {
        var sortOrder = 1;
        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a, b) {
            /* next line works with strings and numbers, 
             * and you may want to customize it to your needs
             */
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    }
    return array.sort(function (obj1, obj2) {
        var i = 0, result = 0, numberOfProperties = props.length;
        /* try getting a different result from 0 (equal)
         * as long as we have extra properties to compare
         */
        while (result === 0 && i < numberOfProperties) {
            result = dynamicSort(props[i])(obj1, obj2);
            i++;
        }
        return result;
    });
}
/**
 * Remove an element from a array
 * @template T
 * @param {Array<T>} array 
 * @param {T} element
 * @returns {boolean}
 */
ESL.Array.remove = function (array, element) {
    let index = array.indexOf(element);
    array.splice(index, 1);
    return index >= 0;
}
//=============================================================================================================
//#region Engine
//=============================================================================================================
ESL.Engine = ESL.Engine || {};
/**
 * Game Service
 * @abstract
 */
ESL.Engine.GameService = class extends ESL.SaveableObject {
    constructor() {
        super();
    }
    /**
     * On Map Loaded
     * @virtual
     */
    onMapLoaded() {

    }
    /**
     * On Map Update
     */
    onMapUpdate() {

    }
    /**
     * On Map Exit
     */
    onMapExit() {

    }
}
/**
 * This is a array to hold all the saveable services in the game so Game_System can create them.
 * @private
 */
ESL.SaveableServices = [];
ESL.addGameService = function (serviceName, klass) {
    ESL.SaveableServices.push({
        name: serviceName,
        klass: klass
    });
}
/** @type {ESL.Engine.GameService[]} */
ESL.Services = [];
/** @private */
ESL.ServicePrefix = "@Service_";
/** @private */
ESL.NotetagProcessors = {};
/**
 * @param {string} types
 * @param {(object: any, lines: string[])} processor 
 */
ESL.registerNotetagProcessor = function (types, processor) {
    types.split(",").forEach(type => {
        type = type.trim();
        ESL.NotetagProcessors[type] = ESL.NotetagProcessors[type] || [];
        ESL.NotetagProcessors[type].push(processor);
    });
}
/** @private */
ESL.AssetPreloaders = [];
/**
 * 
 * @param {(resolve: (result: any), reject: (reason: str)) => void} preloader 
 */
ESL.registerAssetPreloader = function (preloader) {
    ESL.AssetPreloaders.push(new Promise(preloader));
}
//-----------------------------------------------------------------------------------------------------------
/**
 * Get Item String
 * @param {rm.types.BaseItem} item 
 * @returns {string} the format of the item should be i{id} for item, w{id} for weapon, a{id} for armor
 */
ESL.Engine.getItemString = function (item) {
    let itemType = 'i';
    if (DataManager.isWeapon(item)) {
        itemType = 'w';
    } else if (DataManager.isArmor(item)) {
        itemType = 'a';
    }
    return itemType + item.id;
}

ESL.Engine.setVar = function (variableId, value) {
    $gameVariables.setValue(variableId, value);
}

ESL.Engine.getVar = function (variableId) {
    return $gameVariables.value(variableId);
}

ESL.Engine.addVar = function (variableId, value) {
    $gameVariables.setValue(variableId, $gameVariables.value(variableId) + value);
}

ESL.Engine.subVar = function (variableId, value) {
    $gameVariables.setValue(variableId, $gameVariables.value(variableId) - value);
}

ESL.Engine.multiplyVar = function (variableId, value) {
    $gameVariables.setValue(variableId, $gameVariables.value(variableId) * value);
}

ESL.Engine.divideVar = function (variableId, value) {
    $gameVariables.setValue(variableId, $gameVariables.value(variableId) / value);
}

ESL.Engine.setSwitch = function (switchId, value) {
    $gameSwitches.setValue(switchId, value);
}

ESL.Engine.getSwitch = function (switchId) {
    return $gameSwitches.value(switchId);
}

var DSI_CoreMZ_Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function () {
    DSI_CoreMZ_Game_System_initialize.call(this);
    this.recreateESLSaveableObjects();
}

Game_System.prototype.initSaveableObjects = function () {
    this.initGameServices();
    this.initCustomSaveableObjects();
}

Game_System.prototype.initGameServices = function () {
    ESL.Services.splice(0);
    ESL.SaveableServices.forEach(serviceConfig => {
        const service = new serviceConfig.klass();
        // Do not change the prefix of the service name
        this[ESL.ServicePrefix + serviceConfig.name] = service;
        ESL.Services.push(service);
        console.log("✨Core MZ: Service Initialized: " + service.constructor.name);
    });
    console.log("✅Core MZ: All Game Services Initialized. Total Services: " + ESL.Services.length);
}

Game_System.prototype.initCustomSaveableObjects = function () {
    // Override this method to add custom saveable objects
}

Game_System.prototype.callOnNewGameOnSaveableObjects = function () {
    for (let key in this) {
        const object = this[key];
        if (object instanceof ESL.SaveableObject) {
            object.onNewGame();
        }
    }
}

Game_System.prototype.callOnGameLoadedOnSaveableObjects = function () {
    for (let key in this) {
        const object = this[key];
        if (object instanceof ESL.SaveableObject) {
            object.onGameLoaded();
        }
    }
}

Game_System.prototype.recreateESLSaveableObjects = function () {
    this.initSaveableObjects();
    const savedData = this._eslSaveData || {};
    for (let key in savedData) {
        const object = this[key];
        const data = savedData[key];
        if (object instanceof ESL.SaveableObject) {
            object.loadSaveData(data);
        }
    }
    delete this._eslSaveData;
}

var DSI_CoreMZ_Game_System_onBeforeSave = Game_System.prototype.onBeforeSave;
Game_System.prototype.onBeforeSave = function () {
    DSI_CoreMZ_Game_System_onBeforeSave.call(this);
    const savedData = {};
    const originalSaveData = {};
    for (let key in this) {
        const object = this[key];
        if (object instanceof ESL.SaveableObject) {
            savedData[key] = object.getSaveData();
            originalSaveData[key] = object;
            delete this[key];
        }
    }
    this._eslSaveData = savedData;
    $gameTemp.setTempSaveData(originalSaveData);
}

Game_System.prototype.restoreOriginalSaveDataFromTemp = function () {
    const originalSaveData = $gameTemp.getTempSaveData();
    for (let key in originalSaveData) {
        this[key] = originalSaveData[key];
    }
    $gameTemp.setTempSaveData(null);
}

Game_Temp.prototype.setTempSaveData = function (data) {
    this._tempSaveData = data;
}

Game_Temp.prototype.getTempSaveData = function () {
    return this._tempSaveData;
}

var DSI_CoreMZ_DataManager_saveGame = DataManager.saveGame;
DataManager.saveGame = function (savefileId) {
    return new Promise((resolve, reject) => {
        DSI_CoreMZ_DataManager_saveGame.call(this, savefileId).then((saveData) => {
            $gameSystem.restoreOriginalSaveDataFromTemp();
            resolve();

        });
    });
};

var DSI_CoreMZ_DataManager_loadGame = DataManager.loadGame;
DataManager.loadGame = function (savefileId) {
    return new Promise((resolve, reject) => {
        DSI_CoreMZ_DataManager_loadGame.call(this, savefileId).then((savedData) => {
            $gameSystem.callOnGameLoadedOnSaveableObjects();
            $gameSystem.recreateESLSaveableObjects();
            resolve(savedData);
        });
    });
};

var DSI_CoreMZ_DataManager_createGameObjects = DataManager.setupNewGame;
DataManager.setupNewGame = function () {
    DSI_CoreMZ_DataManager_createGameObjects.call(this);
    $gameSystem.callOnNewGameOnSaveableObjects();
}

var DSI_CoreMZ_Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
Scene_Map.prototype.onMapLoaded = function () {
    DSI_CoreMZ_Scene_Map_onMapLoaded.call(this);
    this.callOnMapLoadedOnGameServices();
}

Scene_Map.prototype.callOnMapLoadedOnGameServices = function () {
    for (var service of ESL.Services) {
        service.onMapLoaded();
    }
}

var DSI_CoreMZ_Scene_Map_update = Scene_Map.prototype.updateScene;
Scene_Map.prototype.updateScene = function () {
    DSI_CoreMZ_Scene_Map_update.call(this);
    this.callOnMapUpdateOnGameServices();
}

Scene_Map.prototype.callOnMapUpdateOnGameServices = function () {
    for (var service of ESL.Services) {
        service.onMapUpdate();
    }
}

var DSI_CoreMZ_Scene_Map_terminate = Scene_Map.prototype.terminate;
Scene_Map.prototype.terminate = function () {
    this.callOnMapTerminatedOnGameServices();
    DSI_CoreMZ_Scene_Map_terminate.call(this);
}

Scene_Map.prototype.callOnMapTerminatedOnGameServices = function () {
    for (var service of ESL.Services) {
        service.onMapExit();
    }
}

var DSI_CoreMZ_Scene_Base_create = Scene_Base.prototype.create;
Scene_Base.prototype.create = function () {
    DSI_CoreMZ_Scene_Base_create.call(this);
    this.createTweenManager();
}

Scene_Base.prototype.createTweenManager = function () {
    this._tweenManager = new ESL.Tween.Manager();
}

var DSI_CoreMZ_Scene_Base_update = Scene_Base.prototype.update;
Scene_Base.prototype.update = function () {
    DSI_CoreMZ_Scene_Base_update.call(this);
    this.updateTweenManager();
}

Scene_Base.prototype.updateTweenManager = function () {
    this._tweenManager.update();
}

var DSI_CoreMZ_Scene_Boot_onDatabaseLoaded = Scene_Boot.prototype.onDatabaseLoaded;
Scene_Boot.prototype.onDatabaseLoaded = function () {
    DSI_CoreMZ_Scene_Boot_onDatabaseLoaded.call(this);
    this.processDatabaseNotetags();
    this.preloadCustomAssets();
    this.processAllMapData();
};

var DSI_CoreMZ_Scene_Boot_isReady = Scene_Boot.prototype.isReady;
Scene_Boot.prototype.isReady = function () {
    return DSI_CoreMZ_Scene_Boot_isReady.call(this) && this._customAssetsPreloaded;
}

Scene_Boot.prototype.processDatabaseNotetags = function () {
    console.log("✨Core MZ: Processing Notetags");
    const scanableTypes = {
        "item": $dataItems,
        "weapon": $dataWeapons,
        "armor": $dataArmors,
        "skill": $dataSkills,
        "state": $dataStates,
        "actor": $dataActors,
        "enemy": $dataEnemies,
    }
    let totalTimes = 0;
    for (let type in scanableTypes) {
        const data = scanableTypes[type];
        data.forEach(object => {
            if (object) {
                const lines = object.note.split(/[\r\n]+/);
                for (let processor of ESL.NotetagProcessors[type] || []) {
                    processor(object, lines);
                    totalTimes++;
                }
            }
        });
    }
    console.log(`✅Core MZ: Notetags Processed ${totalTimes} times`);
}

Scene_Boot.prototype.preloadCustomAssets = function () {
    Promise.all(ESL.AssetPreloaders).then(() => {
        this._customAssetsPreloaded = true;
        console.log("✅Core MZ: All Custom Assets Preloaded");
    });
}

ESL.RegionTable = ESL.RegionTable || {};
ESL.getRegionId = function (mapId, x, y) {
    if (!ESL.RegionTable[mapId]) return 0;
    const regionId = ESL.RegionTable[mapId][x + "_" + y];
    return regionId || 0;
}
ESL.MapDataProcessor = [];
/**
 * Register Map Data Processor
 * @param {(mapId: number, mapData: any)} processor
 */
ESL.registerMapDataProcessor = function (processor) {
    ESL.MapDataProcessor.push(processor);
}
Scene_Boot.prototype.processAllMapData = function () {
    $dataMapInfos.forEach(mapInfo => {
        if (!mapInfo) return;
        const mapId = mapInfo.id;
        ESL.File.loadMapDataAsync(mapId).then(mapData => {
            for (var x = 0; x < mapData.width; x++) {
                for (var y = 0; y < mapData.height; y++) {
                    const z = 5;
                    const regionId = mapData.data[(z * mapData.height + y) * mapData.width + x];
                    if (!regionId) continue;
                    ESL.RegionTable[mapId] = ESL.RegionTable[mapId] || {};
                    ESL.RegionTable[mapId][x + "_" + y] = regionId;
                }
            }
            for (let processor of ESL.MapDataProcessor) {
                processor(mapId, mapData);
            }
        }).catch(() => {
            throw new Error("Failed to load map data: " + mapId);
        });
    });
}
//#endregion
// #region Spriteset
ESL.Tilemap = ESL.Tilemap || {};
/** @type {Spriteset_Map} */
ESL.Tilemap.inst = null;
/**
 * Add Sprite
 * @param {Sprite} sprite
 */
ESL.Tilemap.addSprite = function (sprite) {
    ESL.Tilemap.inst._tilemap.addChild(sprite);
}
/**
 * Add Sprite To Tilemap
 * @param {string} key 
 * @param {Sprite} sprite 
 */
ESL.Tilemap.addSpriteByKey = function (key, sprite) {
    sprite.spriteKey = key;
    ESL.Tilemap.inst.addSpriteToTilemap(key, sprite);
}
/**
 * Remove Sprite From Tilemap
 * @param {Sprite} sprite 
 */
ESL.Tilemap.removeSprite = function (sprite) {
    ESL.Tilemap.inst._tilemap.removeChild(sprite);
    if (sprite.spriteKey) {
        delete ESL.Tilemap.inst._customMapSprites[sprite.spriteKey];
    }
}
/**
 * Remove Sprite From Tilemap
 * @param {Sprite} key 
 * @returns {Sprite}
 */
ESL.Tilemap.removeSpriteByKey = function (key) {
    const sprite = ESL.Tilemap.inst.removeCustomSpriteFromTilemap(key);
    return sprite;
}
/**
 * Get Custom Sprite From Tilemap
 * @param {string} key 
 * @returns {Sprite}
 */
ESL.Tilemap.getSprite = function (key) {
    return ESL.Tilemap.inst.getCustomSpriteFromTilemap(key);
}
/**
 * Add Character Sprite
 * @param {Game_Character} character
 */
ESL.Tilemap.addCharacterSprite = function (character) {
    return ESL.Tilemap.inst.addCharacterSprite(character);
}
/**
 * Remove Character Sprite
 * @param {Game_Character} character
 */
ESL.Tilemap.removeCharacterSprite = function (character) {
    ESL.Tilemap.inst.removeCharacterSprite(character);
}
/**
 * Get Screen Position
 * @param {number} mapX
 * @param {number} mapY
 */
ESL.Tilemap.getScreenPosition = function (mapX, mapY) {
    const screenX = $gameMap.adjustX(mapX) * $gameMap.tileWidth() + $gameMap.tileWidth() / 2;
    const screenY = $gameMap.adjustY(mapY) * $gameMap.tileHeight() + $gameMap.tileHeight();
    return { x: screenX, y: screenY };
}

var DSI_CoreMZ_Spriteset_Map_initialize = Spriteset_Map.prototype.initialize;
Spriteset_Map.prototype.initialize = function () {
    ESL.Tilemap.inst = this;
    DSI_CoreMZ_Spriteset_Map_initialize.call(this);
    this._customMapSprites = {};
}

Spriteset_Map.prototype.addSpriteToTilemap = function (key, sprite) {
    if (this._customMapSprites[key]) {
        return;
    }
    this._customMapSprites[key] = sprite;
    this._tilemap.addChild(sprite);
}

Spriteset_Map.prototype.removeCustomSpriteFromTilemap = function (key) {
    const sprite = this._customMapSprites[key];
    if (!sprite) {
        return;
    }
    this._tilemap.removeChild(sprite);
    delete this._customMapSprites[key];
    return sprite;
}

Spriteset_Map.prototype.getCustomSpriteFromTilemap = function (key) {
    return this._customMapSprites[key];
}

Spriteset_Map.prototype.addCharacterSprite = function (character) {
    const sprite = new Sprite_Character(character);
    this._tilemap.addChild(sprite);
    this._characterSprites.push(sprite);
    return sprite;
};

Spriteset_Map.prototype.removeCharacterSprite = function (character) {
    const sprite = this._characterSprites.find(s => s._character === character);
    if (sprite) {
        this._tilemap.removeChild(sprite);
        this._characterSprites.splice(this._characterSprites.indexOf(sprite), 1);
    }
}

var DSI_CoreMZ_Spriteset_Map_findTargetSprite = Spriteset_Map.prototype.findTargetSprite;
Spriteset_Map.prototype.findTargetSprite = function (target) {
    for (var sprite of Object.values(this._customMapSprites)) {
        if (sprite.targetObject === target) {
            return sprite;
        }
    }
    return DSI_CoreMZ_Spriteset_Map_findTargetSprite.call(this, target);
}
//#endregion

//#region Event
ESL.Event = ESL.Event || {};
/** @type {(event: Game_Event, lines: string[]) => void} */
ESL.Event.CommandProcessors = [];
/**
 * Register Event Command Processor
 * @param {(event: Game_Event, lines: string[]) => void} processor 
 */
ESL.registerEventCommandProcessor = function (processor) {
    ESL.Event.CommandProcessors.push(processor);
}
/**
 * Setup Page Settings
*/
var DSI_CoreMZ_Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
Game_Event.prototype.setupPageSettings = function () {
    DSI_CoreMZ_Game_Event_setupPageSettings.call(this);
    this.setupCustomEventSettings();
}
/**
 * Setup Custom Event Settings
 */
Game_Event.prototype.setupCustomEventSettings = function () {
    const comments = this.list().filter(command => command.code == 108 || command.code == 408);
    const lines = comments.map(comment => comment.parameters[0]);
    for (let processor of ESL.Event.CommandProcessors) {
        processor(this, lines);
    }
}

Game_Followers.prototype.forEach = function (callback, thisObject) {
    this._data.forEach(callback, thisObject);
};

Game_Interpreter.prototype.currentEvent = function () {
    return $gameMap.event(this._eventId);
}

Window_Base.prototype.drawGaugeEx = function (x, y, width, height, rate, color1, color2) {
    var fillW = Math.floor(width * rate);
    var gaugeY = y + this.lineHeight() - 8;
    this.contents.fillRect(x, gaugeY, width, height, ColorManager.gaugeBackColor());
    this.contents.gradientFillRect(x, gaugeY, fillW, height, color1, color2);
};

/**
 * Get Player Front Position
 * @virtual
 */
Game_Player.prototype.getFrontPosition = function (offset = 1) {
    let x = this.x;
    let y = this.y;
    const direction = this.direction();
    switch (direction) {
        case 2: // Down
            y += offset;
            break;
        case 4: // Left
            x -= offset;
            break;
        case 6: // Right
            x += offset;
            break;
        case 8: // Up
            y -= offset;
            break;
    }
    return { x, y };
}
//#endregion


//========================================================================
// END OF PLUGIN
//========================================================================