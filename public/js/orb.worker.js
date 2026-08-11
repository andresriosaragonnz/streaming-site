(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Orb"] = factory();
	else
		root["Orb"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/simulator/engine/d3-simulator-engine.ts":
/*!*****************************************************!*\
  !*** ./src/simulator/engine/d3-simulator-engine.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "D3SimulatorEngine": () => (/* binding */ D3SimulatorEngine),
/* harmony export */   "D3SimulatorEngineEventType": () => (/* binding */ D3SimulatorEngineEventType),
/* harmony export */   "DEFAULT_SETTINGS": () => (/* binding */ DEFAULT_SETTINGS),
/* harmony export */   "getManyBodyMaxDistance": () => (/* binding */ getManyBodyMaxDistance)
/* harmony export */ });
/* harmony import */ var d3_force__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! d3-force */ "./node_modules/d3-force/src/link.js");
/* harmony import */ var d3_force__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! d3-force */ "./node_modules/d3-force/src/simulation.js");
/* harmony import */ var d3_force__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! d3-force */ "./node_modules/d3-force/src/collide.js");
/* harmony import */ var d3_force__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! d3-force */ "./node_modules/d3-force/src/manyBody.js");
/* harmony import */ var d3_force__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! d3-force */ "./node_modules/d3-force/src/x.js");
/* harmony import */ var d3_force__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! d3-force */ "./node_modules/d3-force/src/y.js");
/* harmony import */ var d3_force__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! d3-force */ "./node_modules/d3-force/src/center.js");
/* harmony import */ var _utils_emitter_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/emitter.utils */ "./src/utils/emitter.utils.ts");
/* harmony import */ var _utils_object_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/object.utils */ "./src/utils/object.utils.ts");



const MANY_BODY_MAX_DISTANCE_TO_LINK_DISTANCE_RATIO = 100;
const DEFAULT_LINK_DISTANCE = 30;
var D3SimulatorEngineEventType;
(function (D3SimulatorEngineEventType) {
    D3SimulatorEngineEventType["TICK"] = "tick";
    D3SimulatorEngineEventType["END"] = "end";
    D3SimulatorEngineEventType["STABILIZATION_STARTED"] = "stabilizationStarted";
    D3SimulatorEngineEventType["STABILIZATION_PROGRESS"] = "stabilizationProgress";
    D3SimulatorEngineEventType["STABILIZATION_ENDED"] = "stabilizationEnded";
    D3SimulatorEngineEventType["NODE_DRAGGED"] = "nodeDragged";
    D3SimulatorEngineEventType["SETTINGS_UPDATED"] = "settingsUpdated";
})(D3SimulatorEngineEventType || (D3SimulatorEngineEventType = {}));
const getManyBodyMaxDistance = (linkDistance) => {
    const distance = linkDistance > 0 ? linkDistance : 1;
    return distance * MANY_BODY_MAX_DISTANCE_TO_LINK_DISTANCE_RATIO;
};
const DEFAULT_SETTINGS = {
    isPhysicsEnabled: false,
    alpha: {
        alpha: 1,
        alphaMin: 0.001,
        alphaDecay: 0.0228,
        alphaTarget: 0.1,
    },
    centering: {
        x: 0,
        y: 0,
        strength: 1,
    },
    collision: {
        radius: 15,
        strength: 1,
        iterations: 1,
    },
    links: {
        distance: DEFAULT_LINK_DISTANCE,
        strength: undefined,
        iterations: 1,
    },
    manyBody: {
        strength: -100,
        theta: 0.9,
        distanceMin: 0,
        distanceMax: getManyBodyMaxDistance(DEFAULT_LINK_DISTANCE),
    },
    positioning: {
        forceX: {
            x: 0,
            strength: 0.1,
        },
        forceY: {
            y: 0,
            strength: 0.1,
        },
    },
};
class D3SimulatorEngine extends _utils_emitter_utils__WEBPACK_IMPORTED_MODULE_0__.Emitter {
    constructor(settings) {
        super();
        this._edges = [];
        this._nodes = [];
        this._nodeIndexByNodeId = {};
        this._isDragging = false;
        this._isStabilizing = false;
        this.linkForce = (0,d3_force__WEBPACK_IMPORTED_MODULE_2__["default"])(this._edges).id((node) => node.id);
        this.simulation = (0,d3_force__WEBPACK_IMPORTED_MODULE_3__["default"])(this._nodes).force('link', this.linkForce).stop();
        this.settings = Object.assign((0,_utils_object_utils__WEBPACK_IMPORTED_MODULE_1__.copyObject)(DEFAULT_SETTINGS), settings);
        this.initSimulation(this.settings);
        this.simulation.on('tick', () => {
            this.emit(D3SimulatorEngineEventType.TICK, { nodes: this._nodes, edges: this._edges });
        });
        this.simulation.on('end', () => {
            this._isDragging = false;
            this._isStabilizing = false;
            this.emit(D3SimulatorEngineEventType.END, { nodes: this._nodes, edges: this._edges });
        });
    }
    getSettings() {
        return (0,_utils_object_utils__WEBPACK_IMPORTED_MODULE_1__.copyObject)(this.settings);
    }
    setSettings(settings) {
        const previousSettings = this.getSettings();
        Object.keys(settings).forEach((key) => {
            // @ts-ignore
            this.settings[key] = settings[key];
        });
        if ((0,_utils_object_utils__WEBPACK_IMPORTED_MODULE_1__.isObjectEqual)(this.settings, previousSettings)) {
            return;
        }
        this.initSimulation(settings);
        this.emit(D3SimulatorEngineEventType.SETTINGS_UPDATED, { settings: this.settings });
    }
    startDragNode() {
        this._isDragging = true;
        if (!this._isStabilizing) {
            this.activateSimulation();
        }
    }
    dragNode(data) {
        const node = this._nodes[this._nodeIndexByNodeId[data.id]];
        if (!node) {
            return;
        }
        if (!this._isDragging) {
            this.startDragNode();
        }
        node.fx = data.x;
        node.fy = data.y;
        if (!this.settings.isPhysicsEnabled) {
            node.x = data.x;
            node.y = data.y;
            // Notify the client that the node position changed.
            // This is otherwise handled by the simulation tick if physics is enabled.
            this.emit(D3SimulatorEngineEventType.NODE_DRAGGED, { nodes: this._nodes, edges: this._edges });
        }
    }
    endDragNode(data) {
        this._isDragging = false;
        this.simulation.alphaTarget(0);
        const node = this._nodes[this._nodeIndexByNodeId[data.id]];
        if (node) {
            releaseNode(node);
        }
    }
    activateSimulation() {
        if (this.settings.isPhysicsEnabled) {
            // Re-heat simulation.
            // This does not count as "stabilization" and won't emit any progress.
            this.simulation.alphaTarget(this.settings.alpha.alphaTarget).restart();
        }
    }
    fixDefinedNodes(data) {
        // Treat nodes that have existing coordinates as "fixed".
        for (let i = 0; i < data.nodes.length; i++) {
            if (data.nodes[i].x !== null && data.nodes[i].x !== undefined) {
                data.nodes[i].fx = data.nodes[i].x;
            }
            if (data.nodes[i].y !== null && data.nodes[i].y !== undefined) {
                data.nodes[i].fy = data.nodes[i].y;
            }
        }
        return data;
    }
    addData(data) {
        data = this.fixDefinedNodes(data);
        this._nodes.concat(data.nodes);
        this._edges.concat(data.edges);
        this.setNodeIndexByNodeId();
    }
    clearData() {
        this._nodes = [];
        this._edges = [];
        this.setNodeIndexByNodeId();
    }
    setData(data) {
        data = this.fixDefinedNodes(data);
        this.clearData();
        this.addData(data);
    }
    updateData(data) {
        data = this.fixDefinedNodes(data);
        // Keep existing nodes along with their (x, y, fx, fy) coordinates to avoid
        // rearranging the graph layout.
        // These nodes should not be reloaded into the array because the D3 simulation
        // will assign to them completely new coordinates, effectively restarting the animation.
        const newNodeIds = new Set(data.nodes.map((node) => node.id));
        // Remove old nodes that aren't present in the new data.
        const oldNodes = this._nodes.filter((node) => newNodeIds.has(node.id));
        const newNodes = data.nodes.filter((node) => this._nodeIndexByNodeId[node.id] === undefined);
        this._nodes = [...oldNodes, ...newNodes];
        this.setNodeIndexByNodeId();
        // Only keep new links and discard all old links.
        // Old links won't work as some discrepancies arise between the D3 index property
        // and Memgraph's `id` property which affects the source->target mapping.
        this._edges = data.edges;
    }
    simulate() {
        // Update simulation with new data.
        this.simulation.nodes(this._nodes);
        this.linkForce.links(this._edges);
        // Run stabilization "physics".
        this.runStabilization();
        if (!this.settings.isPhysicsEnabled) {
            this.fixNodes();
        }
    }
    startSimulation(data) {
        this.setData(data);
        // Update simulation with new data.
        this.simulation.nodes(this._nodes);
        this.linkForce.links(this._edges);
        // Run stabilization "physics".
        this.runStabilization();
    }
    updateSimulation(data) {
        // To avoid rearranging the graph layout during node expand/collapse/hide,
        // it is necessary to keep existing nodes along with their (x, y) coordinates.
        // These nodes should not be reloaded into the array because the D3 simulation
        // will assign to them completely new coordinates, effectively restarting the animation.
        const newNodeIds = new Set(data.nodes.map((node) => node.id));
        // const newNodes = data.nodes.filter((node) => !this.nodeIdentities.has(node.id));
        const newNodes = data.nodes.filter((node) => this._nodeIndexByNodeId[node.id] === undefined);
        const oldNodes = this._nodes.filter((node) => newNodeIds.has(node.id));
        if (!this.settings.isPhysicsEnabled) {
            oldNodes.forEach((node) => fixNode(node));
        }
        // Remove old nodes that aren't present in the new data.
        this._nodes = [...oldNodes, ...newNodes];
        this.setNodeIndexByNodeId();
        // Only keep new links and discard all old links.
        // Old links won't work as some discrepancies arise between the D3 index property
        // and Memgraph's `id` property which affects the source->target mapping.
        this._edges = data.edges;
        // Update simulation with new data.
        this.simulation.nodes(this._nodes);
        this.linkForce.links(this._edges);
        // If there are no new nodes, there is no need for the stabilization
        if (!this.settings.isPhysicsEnabled && !newNodes.length) {
            this.emit(D3SimulatorEngineEventType.STABILIZATION_ENDED, { nodes: this._nodes, edges: this._edges });
            return;
        }
        // Run stabilization "physics".
        this.runStabilization();
    }
    stopSimulation() {
        this.simulation.stop();
        this._nodes = [];
        this._edges = [];
        this.setNodeIndexByNodeId();
        this.simulation.nodes();
        this.linkForce.links();
    }
    initSimulation(settings) {
        var _a, _b, _c, _d;
        if (settings.alpha) {
            this.simulation
                .alpha(settings.alpha.alpha)
                .alphaMin(settings.alpha.alphaMin)
                .alphaDecay(settings.alpha.alphaDecay)
                .alphaTarget(settings.alpha.alphaTarget);
        }
        if (settings.links) {
            this.linkForce.distance(settings.links.distance).iterations(settings.links.iterations);
        }
        if (settings.collision) {
            const collision = (0,d3_force__WEBPACK_IMPORTED_MODULE_4__["default"])()
                .radius(settings.collision.radius)
                .strength(settings.collision.strength)
                .iterations(settings.collision.iterations);
            this.simulation.force('collide', collision);
        }
        if (settings.collision === null) {
            this.simulation.force('collide', null);
        }
        if (settings.manyBody) {
            const manyBody = (0,d3_force__WEBPACK_IMPORTED_MODULE_5__["default"])()
                .strength(settings.manyBody.strength)
                .theta(settings.manyBody.theta)
                .distanceMin(settings.manyBody.distanceMin)
                .distanceMax(settings.manyBody.distanceMax);
            this.simulation.force('charge', manyBody);
        }
        if (settings.manyBody === null) {
            this.simulation.force('charge', null);
        }
        if ((_a = settings.positioning) === null || _a === void 0 ? void 0 : _a.forceY) {
            const positioningForceX = (0,d3_force__WEBPACK_IMPORTED_MODULE_6__["default"])(settings.positioning.forceX.x).strength(settings.positioning.forceX.strength);
            this.simulation.force('x', positioningForceX);
        }
        if (((_b = settings.positioning) === null || _b === void 0 ? void 0 : _b.forceX) === null) {
            this.simulation.force('x', null);
        }
        if ((_c = settings.positioning) === null || _c === void 0 ? void 0 : _c.forceY) {
            const positioningForceY = (0,d3_force__WEBPACK_IMPORTED_MODULE_7__["default"])(settings.positioning.forceY.y).strength(settings.positioning.forceY.strength);
            this.simulation.force('y', positioningForceY);
        }
        if (((_d = settings.positioning) === null || _d === void 0 ? void 0 : _d.forceY) === null) {
            this.simulation.force('y', null);
        }
        if (settings.centering) {
            const centering = (0,d3_force__WEBPACK_IMPORTED_MODULE_8__["default"])(settings.centering.x, settings.centering.y).strength(settings.centering.strength);
            this.simulation.force('center', centering);
        }
        if (settings.centering === null) {
            this.simulation.force('center', null);
        }
    }
    // This is a blocking action - the user will not be able to interact with the graph
    // during the stabilization process.
    runStabilization() {
        if (this._isStabilizing) {
            return;
        }
        this.emit(D3SimulatorEngineEventType.STABILIZATION_STARTED, undefined);
        this._isStabilizing = true;
        this.simulation.alpha(this.settings.alpha.alpha).alphaTarget(this.settings.alpha.alphaTarget).stop();
        const totalSimulationSteps = Math.ceil(Math.log(this.settings.alpha.alphaMin) / Math.log(1 - this.settings.alpha.alphaDecay));
        let lastProgress = -1;
        for (let i = 0; i < totalSimulationSteps; i++) {
            const currentProgress = Math.round((i * 100) / totalSimulationSteps);
            // Emit progress maximum of 100 times (every percent)
            if (currentProgress > lastProgress) {
                lastProgress = currentProgress;
                this.emit(D3SimulatorEngineEventType.STABILIZATION_PROGRESS, {
                    nodes: this._nodes,
                    edges: this._edges,
                    progress: currentProgress / 100,
                });
            }
            this.simulation.tick();
        }
        this._isStabilizing = false;
        this.emit(D3SimulatorEngineEventType.STABILIZATION_ENDED, { nodes: this._nodes, edges: this._edges });
    }
    setNodeIndexByNodeId() {
        this._nodeIndexByNodeId = {};
        for (let i = 0; i < this._nodes.length; i++) {
            this._nodeIndexByNodeId[this._nodes[i].id] = i;
        }
    }
    fixNodes(nodes) {
        if (!nodes) {
            nodes = this._nodes;
        }
        for (let i = 0; i < nodes.length; i++) {
            fixNode(this._nodes[i]);
        }
    }
    releaseNodes(nodes) {
        if (!nodes) {
            nodes = this._nodes;
        }
        for (let i = 0; i < nodes.length; i++) {
            releaseNode(this._nodes[i]);
        }
    }
}
const fixNode = (node) => {
    // fx and fy fix the node position in the D3 simulation.
    node.fx = node.x;
    node.fy = node.y;
};
const releaseNode = (node) => {
    node.fx = null;
    node.fy = null;
};


/***/ }),

/***/ "./src/simulator/types/web-worker-simulator/message/worker-input.ts":
/*!**************************************************************************!*\
  !*** ./src/simulator/types/web-worker-simulator/message/worker-input.ts ***!
  \**************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "WorkerInputType": () => (/* binding */ WorkerInputType)
/* harmony export */ });
// Messages are objects going into the simulation worker.
// They can be thought of similar to requests.
// (not quite as there is no immediate response to a request)
var WorkerInputType;
(function (WorkerInputType) {
    // Set node and edge data without simulating
    WorkerInputType["SetData"] = "Set Data";
    WorkerInputType["AddData"] = "Add Data";
    WorkerInputType["UpdateData"] = "Update Data";
    WorkerInputType["ClearData"] = "Clear Data";
    // Simulation message types
    WorkerInputType["Simulate"] = "Simulate";
    WorkerInputType["ActivateSimulation"] = "Activate Simulation";
    WorkerInputType["StartSimulation"] = "Start Simulation";
    WorkerInputType["UpdateSimulation"] = "Update Simulation";
    WorkerInputType["StopSimulation"] = "Stop Simulation";
    // Node dragging message types
    WorkerInputType["StartDragNode"] = "Start Drag Node";
    WorkerInputType["DragNode"] = "Drag Node";
    WorkerInputType["EndDragNode"] = "End Drag Node";
    WorkerInputType["FixNodes"] = "Fix Nodes";
    WorkerInputType["ReleaseNodes"] = "Release Nodes";
    // Settings and special params
    WorkerInputType["SetSettings"] = "Set Settings";
})(WorkerInputType || (WorkerInputType = {}));


/***/ }),

/***/ "./src/simulator/types/web-worker-simulator/message/worker-output.ts":
/*!***************************************************************************!*\
  !*** ./src/simulator/types/web-worker-simulator/message/worker-output.ts ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "WorkerOutputType": () => (/* binding */ WorkerOutputType)
/* harmony export */ });
var WorkerOutputType;
(function (WorkerOutputType) {
    WorkerOutputType["StabilizationStarted"] = "Stabilization Started";
    WorkerOutputType["StabilizationProgress"] = "Stabilization Progress";
    WorkerOutputType["StabilizationEnded"] = "Stabilization Ended";
    WorkerOutputType["NodeDragged"] = "Node Dragged";
    WorkerOutputType["NodeDragEnded"] = "Node Drag Ended";
    WorkerOutputType["SettingsUpdated"] = "Settings Updated";
})(WorkerOutputType || (WorkerOutputType = {}));


/***/ }),

/***/ "./src/simulator/types/web-worker-simulator/process.worker.ts":
/*!********************************************************************!*\
  !*** ./src/simulator/types/web-worker-simulator/process.worker.ts ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _engine_d3_simulator_engine__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../engine/d3-simulator-engine */ "./src/simulator/engine/d3-simulator-engine.ts");
/* harmony import */ var _message_worker_input__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./message/worker-input */ "./src/simulator/types/web-worker-simulator/message/worker-input.ts");
/* harmony import */ var _message_worker_output__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./message/worker-output */ "./src/simulator/types/web-worker-simulator/message/worker-output.ts");
// / <reference lib="webworker" />



const simulator = new _engine_d3_simulator_engine__WEBPACK_IMPORTED_MODULE_0__.D3SimulatorEngine();
const emitToMain = (message) => {
    // @ts-ignore Web worker postMessage is a global function
    postMessage(message);
};
simulator.on(_engine_d3_simulator_engine__WEBPACK_IMPORTED_MODULE_0__.D3SimulatorEngineEventType.TICK, (data) => {
    emitToMain({ type: _message_worker_output__WEBPACK_IMPORTED_MODULE_2__.WorkerOutputType.NodeDragged, data });
});
simulator.on(_engine_d3_simulator_engine__WEBPACK_IMPORTED_MODULE_0__.D3SimulatorEngineEventType.END, (data) => {
    emitToMain({ type: _message_worker_output__WEBPACK_IMPORTED_MODULE_2__.WorkerOutputType.NodeDragEnded, data });
});
simulator.on(_engine_d3_simulator_engine__WEBPACK_IMPORTED_MODULE_0__.D3SimulatorEngineEventType.STABILIZATION_STARTED, () => {
    emitToMain({ type: _message_worker_output__WEBPACK_IMPORTED_MODULE_2__.WorkerOutputType.StabilizationStarted });
});
simulator.on(_engine_d3_simulator_engine__WEBPACK_IMPORTED_MODULE_0__.D3SimulatorEngineEventType.STABILIZATION_PROGRESS, (data) => {
    emitToMain({ type: _message_worker_output__WEBPACK_IMPORTED_MODULE_2__.WorkerOutputType.StabilizationProgress, data });
});
simulator.on(_engine_d3_simulator_engine__WEBPACK_IMPORTED_MODULE_0__.D3SimulatorEngineEventType.STABILIZATION_ENDED, (data) => {
    emitToMain({ type: _message_worker_output__WEBPACK_IMPORTED_MODULE_2__.WorkerOutputType.StabilizationEnded, data });
});
simulator.on(_engine_d3_simulator_engine__WEBPACK_IMPORTED_MODULE_0__.D3SimulatorEngineEventType.NODE_DRAGGED, (data) => {
    // Notify the client that the node position changed.
    // This is otherwise handled by the simulation tick if physics is enabled.
    emitToMain({ type: _message_worker_output__WEBPACK_IMPORTED_MODULE_2__.WorkerOutputType.NodeDragged, data });
});
simulator.on(_engine_d3_simulator_engine__WEBPACK_IMPORTED_MODULE_0__.D3SimulatorEngineEventType.SETTINGS_UPDATED, (data) => {
    emitToMain({ type: _message_worker_output__WEBPACK_IMPORTED_MODULE_2__.WorkerOutputType.SettingsUpdated, data });
});
addEventListener('message', ({ data }) => {
    switch (data.type) {
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.ActivateSimulation: {
            simulator.activateSimulation();
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.SetData: {
            simulator.setData(data.data);
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.AddData: {
            simulator.addData(data.data);
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.UpdateData: {
            simulator.updateData(data.data);
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.ClearData: {
            simulator.clearData();
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.Simulate: {
            simulator.simulate();
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.StartSimulation: {
            simulator.startSimulation(data.data);
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.UpdateSimulation: {
            simulator.updateSimulation(data.data);
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.StopSimulation: {
            simulator.stopSimulation();
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.StartDragNode: {
            simulator.startDragNode();
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.DragNode: {
            simulator.dragNode(data.data);
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.FixNodes: {
            simulator.fixNodes(data.data.nodes);
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.ReleaseNodes: {
            simulator.releaseNodes(data.data.nodes);
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.EndDragNode: {
            simulator.endDragNode(data.data);
            break;
        }
        case _message_worker_input__WEBPACK_IMPORTED_MODULE_1__.WorkerInputType.SetSettings: {
            simulator.setSettings(data.data);
            break;
        }
    }
});


/***/ }),

/***/ "./src/utils/emitter.utils.ts":
/*!************************************!*\
  !*** ./src/utils/emitter.utils.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Emitter": () => (/* binding */ Emitter)
/* harmony export */ });
class Emitter {
    constructor() {
        this._listeners = new Map();
    }
    /**
     * Adds a one-time listener function for the event named eventName. The next time eventName is
     * triggered, this listener is removed and then invoked.
     *
     * @see {@link https://nodejs.org/api/events.html#emitteronceeventname-listener}
     * @param {IEventKey} eventName Event name
     * @param {IEventReceiver} func Event function
     * @return {IEmitter} Reference to the EventEmitter, so that calls can be chained
     */
    once(eventName, func) {
        const newListener = {
            callable: func,
            isOnce: true,
        };
        const listeners = this._listeners.get(eventName);
        if (listeners) {
            listeners.push(newListener);
        }
        else {
            this._listeners.set(eventName, [newListener]);
        }
        return this;
    }
    /**
     * Adds the listener function to the end of the listeners array for the event named eventName.
     * No checks are made to see if the listener has already been added. Multiple calls passing
     * the same combination of eventName and listener will result in the listener being added,
     * and called, multiple times.
     *
     * @see {@link https://nodejs.org/api/events.html#emitteroneventname-listener}
     * @param {IEventKey} eventName Event name
     * @param {IEventReceiver} func Event function
     * @return {IEmitter} Reference to the EventEmitter, so that calls can be chained
     */
    on(eventName, func) {
        const newListener = {
            callable: func,
        };
        const listeners = this._listeners.get(eventName);
        if (listeners) {
            listeners.push(newListener);
        }
        else {
            this._listeners.set(eventName, [newListener]);
        }
        return this;
    }
    /**
     * Removes the specified listener from the listener array for the event named eventName.
     *
     * @see {@link https://nodejs.org/api/events.html#emitterremovelistenereventname-listener}
     * @param {IEventKey} eventName Event name
     * @param {IEventReceiver} func Event function
     * @return {IEmitter} Reference to the EventEmitter, so that calls can be chained
     */
    off(eventName, func) {
        const listeners = this._listeners.get(eventName);
        if (listeners) {
            const filteredListeners = listeners.filter((listener) => listener.callable !== func);
            this._listeners.set(eventName, filteredListeners);
        }
        return this;
    }
    /**
     * Synchronously calls each of the listeners registered for the event named eventName,
     * in the order they were registered, passing the supplied arguments to each.
     * Returns true if the event had listeners, false otherwise.
     *
     * @param {IEventKey} eventName Event name
     * @param {any} params Event parameters
     *
     * @return {boolean} True if the event had listeners, false otherwise
     */
    emit(eventName, params) {
        const listeners = this._listeners.get(eventName);
        if (!listeners || listeners.length === 0) {
            return false;
        }
        let hasOnceListener = false;
        for (let i = 0; i < listeners.length; i++) {
            if (listeners[i].isOnce) {
                hasOnceListener = true;
            }
            listeners[i].callable(params);
        }
        if (hasOnceListener) {
            const filteredListeners = listeners.filter((listener) => !listener.isOnce);
            this._listeners.set(eventName, filteredListeners);
        }
        return true;
    }
    /**
     * Returns an array listing the events for which the emitter has registered listeners.
     *
     * @see {@link https://nodejs.org/api/events.html#emittereventnames}
     * @return {IEventKey[]} Event names with registered listeners
     */
    eventNames() {
        return [...this._listeners.keys()];
    }
    /**
     * Returns the number of listeners listening to the event named eventName.
     *
     * @see {@link https://nodejs.org/api/events.html#emitterlistenercounteventname}
     * @param {IEventKey} eventName Event name
     * @return {number} Number of listeners listening to the event name
     */
    listenerCount(eventName) {
        const listeners = this._listeners.get(eventName);
        return listeners ? listeners.length : 0;
    }
    /**
     * Returns a copy of the array of listeners for the event named eventName.
     *
     * @see {@link https://nodejs.org/api/events.html#emitterlistenerseventname}
     * @param {IEventKey} eventName Event name
     * @return {IEventReceiver[]} Array of listeners for the event name
     */
    listeners(eventName) {
        const listeners = this._listeners.get(eventName);
        if (!listeners) {
            return [];
        }
        return listeners.map((listener) => listener.callable);
    }
    /**
     * Alias for emitter.on(eventName, listener).
     *
     * @see {@link https://nodejs.org/api/events.html#emitteraddlistenereventname-listener}
     * @param {IEventKey} eventName Event name
     * @param {IEventReceiver} func Event function
     * @return {IEmitter} Reference to the EventEmitter, so that calls can be chained
     */
    addListener(eventName, func) {
        return this.on(eventName, func);
    }
    /**
     * Alias for emitter.off(eventName, listener).
     *
     * @see {@link https://nodejs.org/api/events.html#emitterremovelistenereventname-listener}
     * @param {IEventKey} eventName Event name
     * @param {IEventReceiver} func Event function
     * @return {IEmitter} Reference to the EventEmitter, so that calls can be chained
     */
    removeListener(eventName, func) {
        return this.off(eventName, func);
    }
    /**
     * Removes all listeners, or those of the specified eventName.
     *
     * @see {@link https://nodejs.org/api/events.html#emitterremovealllistenerseventname}
     * @param {IEventKey} eventName Event name
     * @return {IEmitter} Reference to the EventEmitter, so that calls can be chained
     */
    removeAllListeners(eventName) {
        if (eventName) {
            this._listeners.delete(eventName);
        }
        else {
            this._listeners.clear();
        }
        return this;
    }
}


/***/ }),

/***/ "./src/utils/object.utils.ts":
/*!***********************************!*\
  !*** ./src/utils/object.utils.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "copyObject": () => (/* binding */ copyObject),
/* harmony export */   "isObjectEqual": () => (/* binding */ isObjectEqual)
/* harmony export */ });
/* harmony import */ var _type_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./type.utils */ "./src/utils/type.utils.ts");

/**
 * Creates a new deep copy of the received object. Dates, arrays and
 * plain objects will be created as new objects (new reference).
 *
 * @param {any} obj Object
 * @return {any} Deep copied object
 */
const copyObject = (obj) => {
    if ((0,_type_utils__WEBPACK_IMPORTED_MODULE_0__.isDate)(obj)) {
        return copyDate(obj);
    }
    if ((0,_type_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(obj)) {
        return copyArray(obj);
    }
    if ((0,_type_utils__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(obj)) {
        return copyPlainObject(obj);
    }
    // It is a primitive, function or a custom class
    return obj;
};
/**
 * Checks if two objects are equal by value. It does deep checking for
 * values within arrays or plain objects. Equality for anything that is
 * not a Date, Array, or a plain object will be checked as `a === b`.
 *
 * @param {any} obj1 Object
 * @param {any} obj2 Object
 * @return {boolean} True if objects are deeply equal, otherwise false
 */
const isObjectEqual = (obj1, obj2) => {
    const isDate1 = (0,_type_utils__WEBPACK_IMPORTED_MODULE_0__.isDate)(obj1);
    const isDate2 = (0,_type_utils__WEBPACK_IMPORTED_MODULE_0__.isDate)(obj2);
    if ((isDate1 && !isDate2) || (!isDate1 && isDate2)) {
        return false;
    }
    if (isDate1 && isDate2) {
        return obj1.getTime() === obj2.getTime();
    }
    const isArray1 = (0,_type_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(obj1);
    const isArray2 = (0,_type_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(obj2);
    if ((isArray1 && !isArray2) || (!isArray1 && isArray2)) {
        return false;
    }
    if (isArray1 && isArray2) {
        if (obj1.length !== obj2.length) {
            return false;
        }
        return obj1.every((value, index) => {
            return isObjectEqual(value, obj2[index]);
        });
    }
    const isObject1 = (0,_type_utils__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(obj1);
    const isObject2 = (0,_type_utils__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(obj2);
    if ((isObject1 && !isObject2) || (!isObject1 && isObject2)) {
        return false;
    }
    if (isObject1 && isObject2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (!isObjectEqual(keys1, keys2)) {
            return false;
        }
        return keys1.every((key) => {
            return isObjectEqual(obj1[key], obj2[key]);
        });
    }
    return obj1 === obj2;
};
/**
 * Copies date object into a new date object.
 *
 * @param {Date} date Date
 * @return {Date} Date object copy
 */
const copyDate = (date) => {
    return new Date(date);
};
/**
 * Deep copies an array into a new array. Array values will
 * be deep copied too.
 *
 * @param {Array} array Array
 * @return {Array} Deep copied array
 */
const copyArray = (array) => {
    return array.map((value) => copyObject(value));
};
/**
 * Deep copies a plain object into a new plain object. Object
 * values will be deep copied too.
 *
 * @param {Record} obj Object
 * @return {Record} Deep copied object
 */
const copyPlainObject = (obj) => {
    const newObject = {};
    Object.keys(obj).forEach((key) => {
        newObject[key] = copyObject(obj[key]);
    });
    return newObject;
};


/***/ }),

/***/ "./src/utils/type.utils.ts":
/*!*********************************!*\
  !*** ./src/utils/type.utils.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isArray": () => (/* binding */ isArray),
/* harmony export */   "isBoolean": () => (/* binding */ isBoolean),
/* harmony export */   "isDate": () => (/* binding */ isDate),
/* harmony export */   "isFunction": () => (/* binding */ isFunction),
/* harmony export */   "isNull": () => (/* binding */ isNull),
/* harmony export */   "isNumber": () => (/* binding */ isNumber),
/* harmony export */   "isPlainObject": () => (/* binding */ isPlainObject),
/* harmony export */   "isString": () => (/* binding */ isString)
/* harmony export */ });
/**
 * Type check for string values.
 *
 * @param {any} value Any value
 * @return {boolean} True if it is a string, false otherwise
 */
const isString = (value) => {
    return typeof value === 'string';
};
/**
 * Type check for number values.
 *
 * @param {any} value Any value
 * @return {boolean} True if it is a number, false otherwise
 */
const isNumber = (value) => {
    return typeof value === 'number';
};
/**
 * Type check for boolean values.
 *
 * @param {any} value Any value
 * @return {boolean} True if it is a boolean, false otherwise
 */
const isBoolean = (value) => {
    return typeof value === 'boolean';
};
/**
 * Type check for Date values.
 *
 * @param {any} value Any value
 * @return {boolean} True if it is a Date, false otherwise
 */
const isDate = (value) => {
    return value instanceof Date;
};
/**
 * Type check for Array values. Alias for `Array.isArray`.
 *
 * @param {any} value Any value
 * @return {boolean} True if it is an Array, false otherwise
 */
const isArray = (value) => {
    return Array.isArray(value);
};
/**
 * Type check for plain object values: { [key]: value }
 *
 * @param {any} value Any value
 * @return {boolean} True if it is a plain object, false otherwise
 */
const isPlainObject = (value) => {
    return value !== null && typeof value === 'object' && value.constructor.name === 'Object';
};
/**
 * Type check for null values.
 *
 * @param {any} value Any value
 * @return {boolean} True if it is a null, false otherwise
 */
const isNull = (value) => {
    return value === null;
};
/**
 * Type check for Function values.
 *
 * @param {any} value Any value
 * @return {boolean} True if it is a Function, false otherwise
 */
const isFunction = (value) => {
    return typeof value === 'function';
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_d3-force_src_center_js-node_modules_d3-force_src_collide_js-node_modules-04327d"], () => (__webpack_require__("./src/simulator/types/web-worker-simulator/process.worker.ts")))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames not based on template
/******/ 			if (chunkId === "vendors-node_modules_d3-force_src_center_js-node_modules_d3-force_src_collide_js-node_modules-04327d") return "orb.worker.vendor.js";
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			"process.worker": 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = (data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkOrb"] = self["webpackChunkOrb"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			return __webpack_require__.e("vendors-node_modules_d3-force_src_center_js-node_modules_d3-force_src_collide_js-node_modules-04327d").then(next);
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUVBOztXQUVBOzs7OztXQ3BDQTtXQUNBO1dBQ0E7V0FDQTs7Ozs7VUVIQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vT3JiL3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9PcmIvLi9zcmMvc2ltdWxhdG9yL2VuZ2luZS9kMy1zaW11bGF0b3ItZW5naW5lLnRzIiwid2VicGFjazovL09yYi8uL3NyYy9zaW11bGF0b3IvdHlwZXMvd2ViLXdvcmtlci1zaW11bGF0b3IvbWVzc2FnZS93b3JrZXItaW5wdXQudHMiLCJ3ZWJwYWNrOi8vT3JiLy4vc3JjL3NpbXVsYXRvci90eXBlcy93ZWItd29ya2VyLXNpbXVsYXRvci9tZXNzYWdlL3dvcmtlci1vdXRwdXQudHMiLCJ3ZWJwYWNrOi8vT3JiLy4vc3JjL3NpbXVsYXRvci90eXBlcy93ZWItd29ya2VyLXNpbXVsYXRvci9wcm9jZXNzLndvcmtlci50cyIsIndlYnBhY2s6Ly9PcmIvLi9zcmMvdXRpbHMvZW1pdHRlci51dGlscy50cyIsIndlYnBhY2s6Ly9PcmIvLi9zcmMvdXRpbHMvb2JqZWN0LnV0aWxzLnRzIiwid2VicGFjazovL09yYi8uL3NyYy91dGlscy90eXBlLnV0aWxzLnRzIiwid2VicGFjazovL09yYi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9PcmIvd2VicGFjay9ydW50aW1lL2NodW5rIGxvYWRlZCIsIndlYnBhY2s6Ly9PcmIvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL09yYi93ZWJwYWNrL3J1bnRpbWUvZW5zdXJlIGNodW5rIiwid2VicGFjazovL09yYi93ZWJwYWNrL3J1bnRpbWUvZ2V0IGphdmFzY3JpcHQgY2h1bmsgZmlsZW5hbWUiLCJ3ZWJwYWNrOi8vT3JiL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vT3JiL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vT3JiL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vT3JiL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL09yYi93ZWJwYWNrL3J1bnRpbWUvaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nIiwid2VicGFjazovL09yYi93ZWJwYWNrL3J1bnRpbWUvc3RhcnR1cCBjaHVuayBkZXBlbmRlbmNpZXMiLCJ3ZWJwYWNrOi8vT3JiL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vT3JiL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9PcmIvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIk9yYlwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJPcmJcIl0gPSBmYWN0b3J5KCk7XG59KShzZWxmLCAoKSA9PiB7XG5yZXR1cm4gIiwiaW1wb3J0IHtcbiAgZm9yY2VDZW50ZXIsXG4gIGZvcmNlQ29sbGlkZSxcbiAgZm9yY2VMaW5rLFxuICBGb3JjZUxpbmssXG4gIGZvcmNlTWFueUJvZHksXG4gIGZvcmNlU2ltdWxhdGlvbixcbiAgZm9yY2VYLFxuICBmb3JjZVksXG4gIFNpbXVsYXRpb24sXG4gIFNpbXVsYXRpb25MaW5rRGF0dW0sXG59IGZyb20gJ2QzLWZvcmNlJztcbmltcG9ydCB7IElQb3NpdGlvbiB9IGZyb20gJy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyBJU2ltdWxhdGlvbk5vZGUsIElTaW11bGF0aW9uRWRnZSB9IGZyb20gJy4uL3NoYXJlZCc7XG5pbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSAnLi4vLi4vdXRpbHMvZW1pdHRlci51dGlscyc7XG5pbXBvcnQgeyBpc09iamVjdEVxdWFsLCBjb3B5T2JqZWN0IH0gZnJvbSAnLi4vLi4vdXRpbHMvb2JqZWN0LnV0aWxzJztcblxuY29uc3QgTUFOWV9CT0RZX01BWF9ESVNUQU5DRV9UT19MSU5LX0RJU1RBTkNFX1JBVElPID0gMTAwO1xuY29uc3QgREVGQVVMVF9MSU5LX0RJU1RBTkNFID0gMzA7XG5cbmV4cG9ydCBlbnVtIEQzU2ltdWxhdG9yRW5naW5lRXZlbnRUeXBlIHtcbiAgVElDSyA9ICd0aWNrJyxcbiAgRU5EID0gJ2VuZCcsXG4gIFNUQUJJTElaQVRJT05fU1RBUlRFRCA9ICdzdGFiaWxpemF0aW9uU3RhcnRlZCcsXG4gIFNUQUJJTElaQVRJT05fUFJPR1JFU1MgPSAnc3RhYmlsaXphdGlvblByb2dyZXNzJyxcbiAgU1RBQklMSVpBVElPTl9FTkRFRCA9ICdzdGFiaWxpemF0aW9uRW5kZWQnLFxuICBOT0RFX0RSQUdHRUQgPSAnbm9kZURyYWdnZWQnLFxuICBTRVRUSU5HU19VUERBVEVEID0gJ3NldHRpbmdzVXBkYXRlZCcsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUQzU2ltdWxhdG9yRW5naW5lU2V0dGluZ3NBbHBoYSB7XG4gIGFscGhhOiBudW1iZXI7XG4gIGFscGhhTWluOiBudW1iZXI7XG4gIGFscGhhRGVjYXk6IG51bWJlcjtcbiAgYWxwaGFUYXJnZXQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRDNTaW11bGF0b3JFbmdpbmVTZXR0aW5nc0NlbnRlcmluZyB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xuICBzdHJlbmd0aDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElEM1NpbXVsYXRvckVuZ2luZVNldHRpbmdzQ29sbGlzaW9uIHtcbiAgcmFkaXVzOiBudW1iZXI7XG4gIHN0cmVuZ3RoOiBudW1iZXI7XG4gIGl0ZXJhdGlvbnM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRDNTaW11bGF0b3JFbmdpbmVTZXR0aW5nc0xpbmtzIHtcbiAgZGlzdGFuY2U6IG51bWJlcjtcbiAgc3RyZW5ndGg/OiBudW1iZXI7XG4gIGl0ZXJhdGlvbnM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRDNTaW11bGF0b3JFbmdpbmVTZXR0aW5nc01hbnlCb2R5IHtcbiAgc3RyZW5ndGg6IG51bWJlcjtcbiAgdGhldGE6IG51bWJlcjtcbiAgZGlzdGFuY2VNaW46IG51bWJlcjtcbiAgZGlzdGFuY2VNYXg6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRDNTaW11bGF0b3JFbmdpbmVTZXR0aW5nc1Bvc2l0aW9uaW5nIHtcbiAgZm9yY2VYOiB7XG4gICAgeDogbnVtYmVyO1xuICAgIHN0cmVuZ3RoOiBudW1iZXI7XG4gIH07XG4gIGZvcmNlWToge1xuICAgIHk6IG51bWJlcjtcbiAgICBzdHJlbmd0aDogbnVtYmVyO1xuICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElEM1NpbXVsYXRvckVuZ2luZVNldHRpbmdzIHtcbiAgaXNQaHlzaWNzRW5hYmxlZDogYm9vbGVhbjtcbiAgYWxwaGE6IElEM1NpbXVsYXRvckVuZ2luZVNldHRpbmdzQWxwaGE7XG4gIGNlbnRlcmluZzogSUQzU2ltdWxhdG9yRW5naW5lU2V0dGluZ3NDZW50ZXJpbmcgfCBudWxsO1xuICBjb2xsaXNpb246IElEM1NpbXVsYXRvckVuZ2luZVNldHRpbmdzQ29sbGlzaW9uIHwgbnVsbDtcbiAgbGlua3M6IElEM1NpbXVsYXRvckVuZ2luZVNldHRpbmdzTGlua3M7XG4gIG1hbnlCb2R5OiBJRDNTaW11bGF0b3JFbmdpbmVTZXR0aW5nc01hbnlCb2R5IHwgbnVsbDtcbiAgcG9zaXRpb25pbmc6IElEM1NpbXVsYXRvckVuZ2luZVNldHRpbmdzUG9zaXRpb25pbmcgfCBudWxsO1xufVxuXG5leHBvcnQgdHlwZSBJRDNTaW11bGF0b3JFbmdpbmVTZXR0aW5nc1VwZGF0ZSA9IFBhcnRpYWw8SUQzU2ltdWxhdG9yRW5naW5lU2V0dGluZ3M+O1xuXG5leHBvcnQgY29uc3QgZ2V0TWFueUJvZHlNYXhEaXN0YW5jZSA9IChsaW5rRGlzdGFuY2U6IG51bWJlcikgPT4ge1xuICBjb25zdCBkaXN0YW5jZSA9IGxpbmtEaXN0YW5jZSA+IDAgPyBsaW5rRGlzdGFuY2UgOiAxO1xuICByZXR1cm4gZGlzdGFuY2UgKiBNQU5ZX0JPRFlfTUFYX0RJU1RBTkNFX1RPX0xJTktfRElTVEFOQ0VfUkFUSU87XG59O1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogSUQzU2ltdWxhdG9yRW5naW5lU2V0dGluZ3MgPSB7XG4gIGlzUGh5c2ljc0VuYWJsZWQ6IGZhbHNlLFxuICBhbHBoYToge1xuICAgIGFscGhhOiAxLFxuICAgIGFscGhhTWluOiAwLjAwMSxcbiAgICBhbHBoYURlY2F5OiAwLjAyMjgsXG4gICAgYWxwaGFUYXJnZXQ6IDAuMSxcbiAgfSxcbiAgY2VudGVyaW5nOiB7XG4gICAgeDogMCxcbiAgICB5OiAwLFxuICAgIHN0cmVuZ3RoOiAxLFxuICB9LFxuICBjb2xsaXNpb246IHtcbiAgICByYWRpdXM6IDE1LFxuICAgIHN0cmVuZ3RoOiAxLFxuICAgIGl0ZXJhdGlvbnM6IDEsXG4gIH0sXG4gIGxpbmtzOiB7XG4gICAgZGlzdGFuY2U6IERFRkFVTFRfTElOS19ESVNUQU5DRSxcbiAgICBzdHJlbmd0aDogdW5kZWZpbmVkLFxuICAgIGl0ZXJhdGlvbnM6IDEsXG4gIH0sXG4gIG1hbnlCb2R5OiB7XG4gICAgc3RyZW5ndGg6IC0xMDAsXG4gICAgdGhldGE6IDAuOSxcbiAgICBkaXN0YW5jZU1pbjogMCxcbiAgICBkaXN0YW5jZU1heDogZ2V0TWFueUJvZHlNYXhEaXN0YW5jZShERUZBVUxUX0xJTktfRElTVEFOQ0UpLFxuICB9LFxuICBwb3NpdGlvbmluZzoge1xuICAgIGZvcmNlWDoge1xuICAgICAgeDogMCxcbiAgICAgIHN0cmVuZ3RoOiAwLjEsXG4gICAgfSxcbiAgICBmb3JjZVk6IHtcbiAgICAgIHk6IDAsXG4gICAgICBzdHJlbmd0aDogMC4xLFxuICAgIH0sXG4gIH0sXG59O1xuXG5pbnRlcmZhY2UgSUQzU2ltdWxhdG9yUHJvZ3Jlc3Mge1xuICBwcm9ncmVzczogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgSUQzU2ltdWxhdG9yR3JhcGgge1xuICBub2RlczogSVNpbXVsYXRpb25Ob2RlW107XG4gIGVkZ2VzOiBJU2ltdWxhdGlvbkVkZ2VbXTtcbn1cblxuaW50ZXJmYWNlIElEM1NpbXVsYXRvck5vZGVJZCB7XG4gIGlkOiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBJRDNTaW11bGF0b3JTZXR0aW5ncyB7XG4gIHNldHRpbmdzOiBJRDNTaW11bGF0b3JFbmdpbmVTZXR0aW5ncztcbn1cblxuZXhwb3J0IGNsYXNzIEQzU2ltdWxhdG9yRW5naW5lIGV4dGVuZHMgRW1pdHRlcjx7XG4gIFtEM1NpbXVsYXRvckVuZ2luZUV2ZW50VHlwZS5USUNLXTogSUQzU2ltdWxhdG9yR3JhcGg7XG4gIFtEM1NpbXVsYXRvckVuZ2luZUV2ZW50VHlwZS5FTkRdOiBJRDNTaW11bGF0b3JHcmFwaDtcbiAgW0QzU2ltdWxhdG9yRW5naW5lRXZlbnRUeXBlLlNUQUJJTElaQVRJT05fU1RBUlRFRF06IHVuZGVmaW5lZDtcbiAgW0QzU2ltdWxhdG9yRW5naW5lRXZlbnRUeXBlLlNUQUJJTElaQVRJT05fUFJPR1JFU1NdOiBJRDNTaW11bGF0b3JHcmFwaCAmIElEM1NpbXVsYXRvclByb2dyZXNzO1xuICBbRDNTaW11bGF0b3JFbmdpbmVFdmVudFR5cGUuU1RBQklMSVpBVElPTl9FTkRFRF06IElEM1NpbXVsYXRvckdyYXBoO1xuICBbRDNTaW11bGF0b3JFbmdpbmVFdmVudFR5cGUuTk9ERV9EUkFHR0VEXTogSUQzU2ltdWxhdG9yR3JhcGg7XG4gIFtEM1NpbXVsYXRvckVuZ2luZUV2ZW50VHlwZS5TRVRUSU5HU19VUERBVEVEXTogSUQzU2ltdWxhdG9yU2V0dGluZ3M7XG59PiB7XG4gIHByb3RlY3RlZCByZWFkb25seSBsaW5rRm9yY2U6IEZvcmNlTGluazxJU2ltdWxhdGlvbk5vZGUsIFNpbXVsYXRpb25MaW5rRGF0dW08SVNpbXVsYXRpb25Ob2RlPj47XG4gIHByb3RlY3RlZCByZWFkb25seSBzaW11bGF0aW9uOiBTaW11bGF0aW9uPElTaW11bGF0aW9uTm9kZSwgdW5kZWZpbmVkPjtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHNldHRpbmdzOiBJRDNTaW11bGF0b3JFbmdpbmVTZXR0aW5ncztcblxuICBwcm90ZWN0ZWQgX2VkZ2VzOiBJU2ltdWxhdGlvbkVkZ2VbXSA9IFtdO1xuICBwcm90ZWN0ZWQgX25vZGVzOiBJU2ltdWxhdGlvbk5vZGVbXSA9IFtdO1xuICBwcm90ZWN0ZWQgX25vZGVJbmRleEJ5Tm9kZUlkOiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+ID0ge307XG5cbiAgcHJvdGVjdGVkIF9pc0RyYWdnaW5nID0gZmFsc2U7XG4gIHByb3RlY3RlZCBfaXNTdGFiaWxpemluZyA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHNldHRpbmdzPzogSUQzU2ltdWxhdG9yRW5naW5lU2V0dGluZ3MpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5saW5rRm9yY2UgPSBmb3JjZUxpbms8SVNpbXVsYXRpb25Ob2RlLCBTaW11bGF0aW9uTGlua0RhdHVtPElTaW11bGF0aW9uTm9kZT4+KHRoaXMuX2VkZ2VzKS5pZChcbiAgICAgIChub2RlKSA9PiBub2RlLmlkLFxuICAgICk7XG4gICAgdGhpcy5zaW11bGF0aW9uID0gZm9yY2VTaW11bGF0aW9uKHRoaXMuX25vZGVzKS5mb3JjZSgnbGluaycsIHRoaXMubGlua0ZvcmNlKS5zdG9wKCk7XG5cbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbihjb3B5T2JqZWN0KERFRkFVTFRfU0VUVElOR1MpLCBzZXR0aW5ncyk7XG4gICAgdGhpcy5pbml0U2ltdWxhdGlvbih0aGlzLnNldHRpbmdzKTtcblxuICAgIHRoaXMuc2ltdWxhdGlvbi5vbigndGljaycsICgpID0+IHtcbiAgICAgIHRoaXMuZW1pdChEM1NpbXVsYXRvckVuZ2luZUV2ZW50VHlwZS5USUNLLCB7IG5vZGVzOiB0aGlzLl9ub2RlcywgZWRnZXM6IHRoaXMuX2VkZ2VzIH0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zaW11bGF0aW9uLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICB0aGlzLl9pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLl9pc1N0YWJpbGl6aW5nID0gZmFsc2U7XG4gICAgICB0aGlzLmVtaXQoRDNTaW11bGF0b3JFbmdpbmVFdmVudFR5cGUuRU5ELCB7IG5vZGVzOiB0aGlzLl9ub2RlcywgZWRnZXM6IHRoaXMuX2VkZ2VzIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0U2V0dGluZ3MoKTogSUQzU2ltdWxhdG9yRW5naW5lU2V0dGluZ3Mge1xuICAgIHJldHVybiBjb3B5T2JqZWN0KHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgc2V0U2V0dGluZ3Moc2V0dGluZ3M6IElEM1NpbXVsYXRvckVuZ2luZVNldHRpbmdzVXBkYXRlKSB7XG4gICAgY29uc3QgcHJldmlvdXNTZXR0aW5ncyA9IHRoaXMuZ2V0U2V0dGluZ3MoKTtcbiAgICBPYmplY3Qua2V5cyhzZXR0aW5ncykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLnNldHRpbmdzW2tleV0gPSBzZXR0aW5nc1trZXldO1xuICAgIH0pO1xuXG4gICAgaWYgKGlzT2JqZWN0RXF1YWwodGhpcy5zZXR0aW5ncywgcHJldmlvdXNTZXR0aW5ncykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmluaXRTaW11bGF0aW9uKHNldHRpbmdzKTtcbiAgICB0aGlzLmVtaXQoRDNTaW11bGF0b3JFbmdpbmVFdmVudFR5cGUuU0VUVElOR1NfVVBEQVRFRCwgeyBzZXR0aW5nczogdGhpcy5zZXR0aW5ncyB9KTtcbiAgfVxuXG4gIHN0YXJ0RHJhZ05vZGUoKSB7XG4gICAgdGhpcy5faXNEcmFnZ2luZyA9IHRydWU7XG5cbiAgICBpZiAoIXRoaXMuX2lzU3RhYmlsaXppbmcpIHtcbiAgICAgIHRoaXMuYWN0aXZhdGVTaW11bGF0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgZHJhZ05vZGUoZGF0YTogSUQzU2ltdWxhdG9yTm9kZUlkICYgSVBvc2l0aW9uKSB7XG4gICAgY29uc3Qgbm9kZSA9IHRoaXMuX25vZGVzW3RoaXMuX25vZGVJbmRleEJ5Tm9kZUlkW2RhdGEuaWRdXTtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX2lzRHJhZ2dpbmcpIHtcbiAgICAgIHRoaXMuc3RhcnREcmFnTm9kZSgpO1xuICAgIH1cblxuICAgIG5vZGUuZnggPSBkYXRhLng7XG4gICAgbm9kZS5meSA9IGRhdGEueTtcblxuICAgIGlmICghdGhpcy5zZXR0aW5ncy5pc1BoeXNpY3NFbmFibGVkKSB7XG4gICAgICBub2RlLnggPSBkYXRhLng7XG4gICAgICBub2RlLnkgPSBkYXRhLnk7XG5cbiAgICAgIC8vIE5vdGlmeSB0aGUgY2xpZW50IHRoYXQgdGhlIG5vZGUgcG9zaXRpb24gY2hhbmdlZC5cbiAgICAgIC8vIFRoaXMgaXMgb3RoZXJ3aXNlIGhhbmRsZWQgYnkgdGhlIHNpbXVsYXRpb24gdGljayBpZiBwaHlzaWNzIGlzIGVuYWJsZWQuXG4gICAgICB0aGlzLmVtaXQoRDNTaW11bGF0b3JFbmdpbmVFdmVudFR5cGUuTk9ERV9EUkFHR0VELCB7IG5vZGVzOiB0aGlzLl9ub2RlcywgZWRnZXM6IHRoaXMuX2VkZ2VzIH0pO1xuICAgIH1cbiAgfVxuXG4gIGVuZERyYWdOb2RlKGRhdGE6IElEM1NpbXVsYXRvck5vZGVJZCkge1xuICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgIHRoaXMuc2ltdWxhdGlvbi5hbHBoYVRhcmdldCgwKTtcbiAgICBjb25zdCBub2RlID0gdGhpcy5fbm9kZXNbdGhpcy5fbm9kZUluZGV4QnlOb2RlSWRbZGF0YS5pZF1dO1xuICAgIGlmIChub2RlKSB7XG4gICAgICByZWxlYXNlTm9kZShub2RlKTtcbiAgICB9XG4gIH1cblxuICBhY3RpdmF0ZVNpbXVsYXRpb24oKSB7XG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaXNQaHlzaWNzRW5hYmxlZCkge1xuICAgICAgLy8gUmUtaGVhdCBzaW11bGF0aW9uLlxuICAgICAgLy8gVGhpcyBkb2VzIG5vdCBjb3VudCBhcyBcInN0YWJpbGl6YXRpb25cIiBhbmQgd29uJ3QgZW1pdCBhbnkgcHJvZ3Jlc3MuXG4gICAgICB0aGlzLnNpbXVsYXRpb24uYWxwaGFUYXJnZXQodGhpcy5zZXR0aW5ncy5hbHBoYS5hbHBoYVRhcmdldCkucmVzdGFydCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZml4RGVmaW5lZE5vZGVzKGRhdGE6IElEM1NpbXVsYXRvckdyYXBoKSB7XG4gICAgLy8gVHJlYXQgbm9kZXMgdGhhdCBoYXZlIGV4aXN0aW5nIGNvb3JkaW5hdGVzIGFzIFwiZml4ZWRcIi5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChkYXRhLm5vZGVzW2ldLnggIT09IG51bGwgJiYgZGF0YS5ub2Rlc1tpXS54ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZGF0YS5ub2Rlc1tpXS5meCA9IGRhdGEubm9kZXNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChkYXRhLm5vZGVzW2ldLnkgIT09IG51bGwgJiYgZGF0YS5ub2Rlc1tpXS55ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZGF0YS5ub2Rlc1tpXS5meSA9IGRhdGEubm9kZXNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBhZGREYXRhKGRhdGE6IElEM1NpbXVsYXRvckdyYXBoKSB7XG4gICAgZGF0YSA9IHRoaXMuZml4RGVmaW5lZE5vZGVzKGRhdGEpO1xuICAgIHRoaXMuX25vZGVzLmNvbmNhdChkYXRhLm5vZGVzKTtcbiAgICB0aGlzLl9lZGdlcy5jb25jYXQoZGF0YS5lZGdlcyk7XG4gICAgdGhpcy5zZXROb2RlSW5kZXhCeU5vZGVJZCgpO1xuICB9XG5cbiAgY2xlYXJEYXRhKCkge1xuICAgIHRoaXMuX25vZGVzID0gW107XG4gICAgdGhpcy5fZWRnZXMgPSBbXTtcbiAgICB0aGlzLnNldE5vZGVJbmRleEJ5Tm9kZUlkKCk7XG4gIH1cblxuICBzZXREYXRhKGRhdGE6IElEM1NpbXVsYXRvckdyYXBoKSB7XG4gICAgZGF0YSA9IHRoaXMuZml4RGVmaW5lZE5vZGVzKGRhdGEpO1xuICAgIHRoaXMuY2xlYXJEYXRhKCk7XG4gICAgdGhpcy5hZGREYXRhKGRhdGEpO1xuICB9XG5cbiAgdXBkYXRlRGF0YShkYXRhOiBJRDNTaW11bGF0b3JHcmFwaCkge1xuICAgIGRhdGEgPSB0aGlzLmZpeERlZmluZWROb2RlcyhkYXRhKTtcbiAgICAvLyBLZWVwIGV4aXN0aW5nIG5vZGVzIGFsb25nIHdpdGggdGhlaXIgKHgsIHksIGZ4LCBmeSkgY29vcmRpbmF0ZXMgdG8gYXZvaWRcbiAgICAvLyByZWFycmFuZ2luZyB0aGUgZ3JhcGggbGF5b3V0LlxuICAgIC8vIFRoZXNlIG5vZGVzIHNob3VsZCBub3QgYmUgcmVsb2FkZWQgaW50byB0aGUgYXJyYXkgYmVjYXVzZSB0aGUgRDMgc2ltdWxhdGlvblxuICAgIC8vIHdpbGwgYXNzaWduIHRvIHRoZW0gY29tcGxldGVseSBuZXcgY29vcmRpbmF0ZXMsIGVmZmVjdGl2ZWx5IHJlc3RhcnRpbmcgdGhlIGFuaW1hdGlvbi5cbiAgICBjb25zdCBuZXdOb2RlSWRzID0gbmV3IFNldChkYXRhLm5vZGVzLm1hcCgobm9kZSkgPT4gbm9kZS5pZCkpO1xuXG4gICAgLy8gUmVtb3ZlIG9sZCBub2RlcyB0aGF0IGFyZW4ndCBwcmVzZW50IGluIHRoZSBuZXcgZGF0YS5cbiAgICBjb25zdCBvbGROb2RlcyA9IHRoaXMuX25vZGVzLmZpbHRlcigobm9kZSkgPT4gbmV3Tm9kZUlkcy5oYXMobm9kZS5pZCkpO1xuICAgIGNvbnN0IG5ld05vZGVzID0gZGF0YS5ub2Rlcy5maWx0ZXIoKG5vZGUpID0+IHRoaXMuX25vZGVJbmRleEJ5Tm9kZUlkW25vZGUuaWRdID09PSB1bmRlZmluZWQpO1xuXG4gICAgdGhpcy5fbm9kZXMgPSBbLi4ub2xkTm9kZXMsIC4uLm5ld05vZGVzXTtcbiAgICB0aGlzLnNldE5vZGVJbmRleEJ5Tm9kZUlkKCk7XG5cbiAgICAvLyBPbmx5IGtlZXAgbmV3IGxpbmtzIGFuZCBkaXNjYXJkIGFsbCBvbGQgbGlua3MuXG4gICAgLy8gT2xkIGxpbmtzIHdvbid0IHdvcmsgYXMgc29tZSBkaXNjcmVwYW5jaWVzIGFyaXNlIGJldHdlZW4gdGhlIEQzIGluZGV4IHByb3BlcnR5XG4gICAgLy8gYW5kIE1lbWdyYXBoJ3MgYGlkYCBwcm9wZXJ0eSB3aGljaCBhZmZlY3RzIHRoZSBzb3VyY2UtPnRhcmdldCBtYXBwaW5nLlxuICAgIHRoaXMuX2VkZ2VzID0gZGF0YS5lZGdlcztcbiAgfVxuXG4gIHNpbXVsYXRlKCkge1xuICAgIC8vIFVwZGF0ZSBzaW11bGF0aW9uIHdpdGggbmV3IGRhdGEuXG4gICAgdGhpcy5zaW11bGF0aW9uLm5vZGVzKHRoaXMuX25vZGVzKTtcbiAgICB0aGlzLmxpbmtGb3JjZS5saW5rcyh0aGlzLl9lZGdlcyk7XG5cbiAgICAvLyBSdW4gc3RhYmlsaXphdGlvbiBcInBoeXNpY3NcIi5cbiAgICB0aGlzLnJ1blN0YWJpbGl6YXRpb24oKTtcblxuICAgIGlmICghdGhpcy5zZXR0aW5ncy5pc1BoeXNpY3NFbmFibGVkKSB7XG4gICAgICB0aGlzLmZpeE5vZGVzKCk7XG4gICAgfVxuICB9XG5cbiAgc3RhcnRTaW11bGF0aW9uKGRhdGE6IElEM1NpbXVsYXRvckdyYXBoKSB7XG4gICAgdGhpcy5zZXREYXRhKGRhdGEpO1xuXG4gICAgLy8gVXBkYXRlIHNpbXVsYXRpb24gd2l0aCBuZXcgZGF0YS5cbiAgICB0aGlzLnNpbXVsYXRpb24ubm9kZXModGhpcy5fbm9kZXMpO1xuICAgIHRoaXMubGlua0ZvcmNlLmxpbmtzKHRoaXMuX2VkZ2VzKTtcblxuICAgIC8vIFJ1biBzdGFiaWxpemF0aW9uIFwicGh5c2ljc1wiLlxuICAgIHRoaXMucnVuU3RhYmlsaXphdGlvbigpO1xuICB9XG5cbiAgdXBkYXRlU2ltdWxhdGlvbihkYXRhOiBJRDNTaW11bGF0b3JHcmFwaCkge1xuICAgIC8vIFRvIGF2b2lkIHJlYXJyYW5naW5nIHRoZSBncmFwaCBsYXlvdXQgZHVyaW5nIG5vZGUgZXhwYW5kL2NvbGxhcHNlL2hpZGUsXG4gICAgLy8gaXQgaXMgbmVjZXNzYXJ5IHRvIGtlZXAgZXhpc3Rpbmcgbm9kZXMgYWxvbmcgd2l0aCB0aGVpciAoeCwgeSkgY29vcmRpbmF0ZXMuXG4gICAgLy8gVGhlc2Ugbm9kZXMgc2hvdWxkIG5vdCBiZSByZWxvYWRlZCBpbnRvIHRoZSBhcnJheSBiZWNhdXNlIHRoZSBEMyBzaW11bGF0aW9uXG4gICAgLy8gd2lsbCBhc3NpZ24gdG8gdGhlbSBjb21wbGV0ZWx5IG5ldyBjb29yZGluYXRlcywgZWZmZWN0aXZlbHkgcmVzdGFydGluZyB0aGUgYW5pbWF0aW9uLlxuICAgIGNvbnN0IG5ld05vZGVJZHMgPSBuZXcgU2V0KGRhdGEubm9kZXMubWFwKChub2RlKSA9PiBub2RlLmlkKSk7XG5cbiAgICAvLyBjb25zdCBuZXdOb2RlcyA9IGRhdGEubm9kZXMuZmlsdGVyKChub2RlKSA9PiAhdGhpcy5ub2RlSWRlbnRpdGllcy5oYXMobm9kZS5pZCkpO1xuICAgIGNvbnN0IG5ld05vZGVzID0gZGF0YS5ub2Rlcy5maWx0ZXIoKG5vZGUpID0+IHRoaXMuX25vZGVJbmRleEJ5Tm9kZUlkW25vZGUuaWRdID09PSB1bmRlZmluZWQpO1xuICAgIGNvbnN0IG9sZE5vZGVzID0gdGhpcy5fbm9kZXMuZmlsdGVyKChub2RlKSA9PiBuZXdOb2RlSWRzLmhhcyhub2RlLmlkKSk7XG5cbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuaXNQaHlzaWNzRW5hYmxlZCkge1xuICAgICAgb2xkTm9kZXMuZm9yRWFjaCgobm9kZSkgPT4gZml4Tm9kZShub2RlKSk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIG9sZCBub2RlcyB0aGF0IGFyZW4ndCBwcmVzZW50IGluIHRoZSBuZXcgZGF0YS5cbiAgICB0aGlzLl9ub2RlcyA9IFsuLi5vbGROb2RlcywgLi4ubmV3Tm9kZXNdO1xuICAgIHRoaXMuc2V0Tm9kZUluZGV4QnlOb2RlSWQoKTtcblxuICAgIC8vIE9ubHkga2VlcCBuZXcgbGlua3MgYW5kIGRpc2NhcmQgYWxsIG9sZCBsaW5rcy5cbiAgICAvLyBPbGQgbGlua3Mgd29uJ3Qgd29yayBhcyBzb21lIGRpc2NyZXBhbmNpZXMgYXJpc2UgYmV0d2VlbiB0aGUgRDMgaW5kZXggcHJvcGVydHlcbiAgICAvLyBhbmQgTWVtZ3JhcGgncyBgaWRgIHByb3BlcnR5IHdoaWNoIGFmZmVjdHMgdGhlIHNvdXJjZS0+dGFyZ2V0IG1hcHBpbmcuXG4gICAgdGhpcy5fZWRnZXMgPSBkYXRhLmVkZ2VzO1xuXG4gICAgLy8gVXBkYXRlIHNpbXVsYXRpb24gd2l0aCBuZXcgZGF0YS5cbiAgICB0aGlzLnNpbXVsYXRpb24ubm9kZXModGhpcy5fbm9kZXMpO1xuICAgIHRoaXMubGlua0ZvcmNlLmxpbmtzKHRoaXMuX2VkZ2VzKTtcblxuICAgIC8vIElmIHRoZXJlIGFyZSBubyBuZXcgbm9kZXMsIHRoZXJlIGlzIG5vIG5lZWQgZm9yIHRoZSBzdGFiaWxpemF0aW9uXG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmlzUGh5c2ljc0VuYWJsZWQgJiYgIW5ld05vZGVzLmxlbmd0aCkge1xuICAgICAgdGhpcy5lbWl0KEQzU2ltdWxhdG9yRW5naW5lRXZlbnRUeXBlLlNUQUJJTElaQVRJT05fRU5ERUQsIHsgbm9kZXM6IHRoaXMuX25vZGVzLCBlZGdlczogdGhpcy5fZWRnZXMgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUnVuIHN0YWJpbGl6YXRpb24gXCJwaHlzaWNzXCIuXG4gICAgdGhpcy5ydW5TdGFiaWxpemF0aW9uKCk7XG4gIH1cblxuICBzdG9wU2ltdWxhdGlvbigpIHtcbiAgICB0aGlzLnNpbXVsYXRpb24uc3RvcCgpO1xuICAgIHRoaXMuX25vZGVzID0gW107XG4gICAgdGhpcy5fZWRnZXMgPSBbXTtcbiAgICB0aGlzLnNldE5vZGVJbmRleEJ5Tm9kZUlkKCk7XG4gICAgdGhpcy5zaW11bGF0aW9uLm5vZGVzKCk7XG4gICAgdGhpcy5saW5rRm9yY2UubGlua3MoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBpbml0U2ltdWxhdGlvbihzZXR0aW5nczogSUQzU2ltdWxhdG9yRW5naW5lU2V0dGluZ3NVcGRhdGUpIHtcbiAgICBpZiAoc2V0dGluZ3MuYWxwaGEpIHtcbiAgICAgIHRoaXMuc2ltdWxhdGlvblxuICAgICAgICAuYWxwaGEoc2V0dGluZ3MuYWxwaGEuYWxwaGEpXG4gICAgICAgIC5hbHBoYU1pbihzZXR0aW5ncy5hbHBoYS5hbHBoYU1pbilcbiAgICAgICAgLmFscGhhRGVjYXkoc2V0dGluZ3MuYWxwaGEuYWxwaGFEZWNheSlcbiAgICAgICAgLmFscGhhVGFyZ2V0KHNldHRpbmdzLmFscGhhLmFscGhhVGFyZ2V0KTtcbiAgICB9XG4gICAgaWYgKHNldHRpbmdzLmxpbmtzKSB7XG4gICAgICB0aGlzLmxpbmtGb3JjZS5kaXN0YW5jZShzZXR0aW5ncy5saW5rcy5kaXN0YW5jZSkuaXRlcmF0aW9ucyhzZXR0aW5ncy5saW5rcy5pdGVyYXRpb25zKTtcbiAgICB9XG4gICAgaWYgKHNldHRpbmdzLmNvbGxpc2lvbikge1xuICAgICAgY29uc3QgY29sbGlzaW9uID0gZm9yY2VDb2xsaWRlKClcbiAgICAgICAgLnJhZGl1cyhzZXR0aW5ncy5jb2xsaXNpb24ucmFkaXVzKVxuICAgICAgICAuc3RyZW5ndGgoc2V0dGluZ3MuY29sbGlzaW9uLnN0cmVuZ3RoKVxuICAgICAgICAuaXRlcmF0aW9ucyhzZXR0aW5ncy5jb2xsaXNpb24uaXRlcmF0aW9ucyk7XG4gICAgICB0aGlzLnNpbXVsYXRpb24uZm9yY2UoJ2NvbGxpZGUnLCBjb2xsaXNpb24pO1xuICAgIH1cbiAgICBpZiAoc2V0dGluZ3MuY29sbGlzaW9uID09PSBudWxsKSB7XG4gICAgICB0aGlzLnNpbXVsYXRpb24uZm9yY2UoJ2NvbGxpZGUnLCBudWxsKTtcbiAgICB9XG4gICAgaWYgKHNldHRpbmdzLm1hbnlCb2R5KSB7XG4gICAgICBjb25zdCBtYW55Qm9keSA9IGZvcmNlTWFueUJvZHkoKVxuICAgICAgICAuc3RyZW5ndGgoc2V0dGluZ3MubWFueUJvZHkuc3RyZW5ndGgpXG4gICAgICAgIC50aGV0YShzZXR0aW5ncy5tYW55Qm9keS50aGV0YSlcbiAgICAgICAgLmRpc3RhbmNlTWluKHNldHRpbmdzLm1hbnlCb2R5LmRpc3RhbmNlTWluKVxuICAgICAgICAuZGlzdGFuY2VNYXgoc2V0dGluZ3MubWFueUJvZHkuZGlzdGFuY2VNYXgpO1xuICAgICAgdGhpcy5zaW11bGF0aW9uLmZvcmNlKCdjaGFyZ2UnLCBtYW55Qm9keSk7XG4gICAgfVxuICAgIGlmIChzZXR0aW5ncy5tYW55Qm9keSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5zaW11bGF0aW9uLmZvcmNlKCdjaGFyZ2UnLCBudWxsKTtcbiAgICB9XG4gICAgaWYgKHNldHRpbmdzLnBvc2l0aW9uaW5nPy5mb3JjZVkpIHtcbiAgICAgIGNvbnN0IHBvc2l0aW9uaW5nRm9yY2VYID0gZm9yY2VYKHNldHRpbmdzLnBvc2l0aW9uaW5nLmZvcmNlWC54KS5zdHJlbmd0aChzZXR0aW5ncy5wb3NpdGlvbmluZy5mb3JjZVguc3RyZW5ndGgpO1xuICAgICAgdGhpcy5zaW11bGF0aW9uLmZvcmNlKCd4JywgcG9zaXRpb25pbmdGb3JjZVgpO1xuICAgIH1cbiAgICBpZiAoc2V0dGluZ3MucG9zaXRpb25pbmc/LmZvcmNlWCA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5zaW11bGF0aW9uLmZvcmNlKCd4JywgbnVsbCk7XG4gICAgfVxuICAgIGlmIChzZXR0aW5ncy5wb3NpdGlvbmluZz8uZm9yY2VZKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbmluZ0ZvcmNlWSA9IGZvcmNlWShzZXR0aW5ncy5wb3NpdGlvbmluZy5mb3JjZVkueSkuc3RyZW5ndGgoc2V0dGluZ3MucG9zaXRpb25pbmcuZm9yY2VZLnN0cmVuZ3RoKTtcbiAgICAgIHRoaXMuc2ltdWxhdGlvbi5mb3JjZSgneScsIHBvc2l0aW9uaW5nRm9yY2VZKTtcbiAgICB9XG4gICAgaWYgKHNldHRpbmdzLnBvc2l0aW9uaW5nPy5mb3JjZVkgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuc2ltdWxhdGlvbi5mb3JjZSgneScsIG51bGwpO1xuICAgIH1cbiAgICBpZiAoc2V0dGluZ3MuY2VudGVyaW5nKSB7XG4gICAgICBjb25zdCBjZW50ZXJpbmcgPSBmb3JjZUNlbnRlcihzZXR0aW5ncy5jZW50ZXJpbmcueCwgc2V0dGluZ3MuY2VudGVyaW5nLnkpLnN0cmVuZ3RoKHNldHRpbmdzLmNlbnRlcmluZy5zdHJlbmd0aCk7XG4gICAgICB0aGlzLnNpbXVsYXRpb24uZm9yY2UoJ2NlbnRlcicsIGNlbnRlcmluZyk7XG4gICAgfVxuICAgIGlmIChzZXR0aW5ncy5jZW50ZXJpbmcgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuc2ltdWxhdGlvbi5mb3JjZSgnY2VudGVyJywgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgLy8gVGhpcyBpcyBhIGJsb2NraW5nIGFjdGlvbiAtIHRoZSB1c2VyIHdpbGwgbm90IGJlIGFibGUgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgZ3JhcGhcbiAgLy8gZHVyaW5nIHRoZSBzdGFiaWxpemF0aW9uIHByb2Nlc3MuXG4gIHByb3RlY3RlZCBydW5TdGFiaWxpemF0aW9uKCkge1xuICAgIGlmICh0aGlzLl9pc1N0YWJpbGl6aW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5lbWl0KEQzU2ltdWxhdG9yRW5naW5lRXZlbnRUeXBlLlNUQUJJTElaQVRJT05fU1RBUlRFRCwgdW5kZWZpbmVkKTtcblxuICAgIHRoaXMuX2lzU3RhYmlsaXppbmcgPSB0cnVlO1xuICAgIHRoaXMuc2ltdWxhdGlvbi5hbHBoYSh0aGlzLnNldHRpbmdzLmFscGhhLmFscGhhKS5hbHBoYVRhcmdldCh0aGlzLnNldHRpbmdzLmFscGhhLmFscGhhVGFyZ2V0KS5zdG9wKCk7XG5cbiAgICBjb25zdCB0b3RhbFNpbXVsYXRpb25TdGVwcyA9IE1hdGguY2VpbChcbiAgICAgIE1hdGgubG9nKHRoaXMuc2V0dGluZ3MuYWxwaGEuYWxwaGFNaW4pIC8gTWF0aC5sb2coMSAtIHRoaXMuc2V0dGluZ3MuYWxwaGEuYWxwaGFEZWNheSksXG4gICAgKTtcblxuICAgIGxldCBsYXN0UHJvZ3Jlc3MgPSAtMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsU2ltdWxhdGlvblN0ZXBzOyBpKyspIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRQcm9ncmVzcyA9IE1hdGgucm91bmQoKGkgKiAxMDApIC8gdG90YWxTaW11bGF0aW9uU3RlcHMpO1xuICAgICAgLy8gRW1pdCBwcm9ncmVzcyBtYXhpbXVtIG9mIDEwMCB0aW1lcyAoZXZlcnkgcGVyY2VudClcbiAgICAgIGlmIChjdXJyZW50UHJvZ3Jlc3MgPiBsYXN0UHJvZ3Jlc3MpIHtcbiAgICAgICAgbGFzdFByb2dyZXNzID0gY3VycmVudFByb2dyZXNzO1xuICAgICAgICB0aGlzLmVtaXQoRDNTaW11bGF0b3JFbmdpbmVFdmVudFR5cGUuU1RBQklMSVpBVElPTl9QUk9HUkVTUywge1xuICAgICAgICAgIG5vZGVzOiB0aGlzLl9ub2RlcyxcbiAgICAgICAgICBlZGdlczogdGhpcy5fZWRnZXMsXG4gICAgICAgICAgcHJvZ3Jlc3M6IGN1cnJlbnRQcm9ncmVzcyAvIDEwMCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNpbXVsYXRpb24udGljaygpO1xuICAgIH1cblxuICAgIHRoaXMuX2lzU3RhYmlsaXppbmcgPSBmYWxzZTtcbiAgICB0aGlzLmVtaXQoRDNTaW11bGF0b3JFbmdpbmVFdmVudFR5cGUuU1RBQklMSVpBVElPTl9FTkRFRCwgeyBub2RlczogdGhpcy5fbm9kZXMsIGVkZ2VzOiB0aGlzLl9lZGdlcyB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzZXROb2RlSW5kZXhCeU5vZGVJZCgpIHtcbiAgICB0aGlzLl9ub2RlSW5kZXhCeU5vZGVJZCA9IHt9O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuX25vZGVJbmRleEJ5Tm9kZUlkW3RoaXMuX25vZGVzW2ldLmlkXSA9IGk7XG4gICAgfVxuICB9XG5cbiAgZml4Tm9kZXMobm9kZXM/OiBJU2ltdWxhdGlvbk5vZGVbXSkge1xuICAgIGlmICghbm9kZXMpIHtcbiAgICAgIG5vZGVzID0gdGhpcy5fbm9kZXM7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgZml4Tm9kZSh0aGlzLl9ub2Rlc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgcmVsZWFzZU5vZGVzKG5vZGVzPzogSVNpbXVsYXRpb25Ob2RlW10pIHtcbiAgICBpZiAoIW5vZGVzKSB7XG4gICAgICBub2RlcyA9IHRoaXMuX25vZGVzO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlbGVhc2VOb2RlKHRoaXMuX25vZGVzW2ldKTtcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgZml4Tm9kZSA9IChub2RlOiBJU2ltdWxhdGlvbk5vZGUpID0+IHtcbiAgLy8gZnggYW5kIGZ5IGZpeCB0aGUgbm9kZSBwb3NpdGlvbiBpbiB0aGUgRDMgc2ltdWxhdGlvbi5cbiAgbm9kZS5meCA9IG5vZGUueDtcbiAgbm9kZS5meSA9IG5vZGUueTtcbn07XG5cbmNvbnN0IHJlbGVhc2VOb2RlID0gKG5vZGU6IElTaW11bGF0aW9uTm9kZSkgPT4ge1xuICBub2RlLmZ4ID0gbnVsbDtcbiAgbm9kZS5meSA9IG51bGw7XG59O1xuIiwiaW1wb3J0IHsgSVBvc2l0aW9uIH0gZnJvbSAnLi4vLi4vLi4vLi4vY29tbW9uJztcbmltcG9ydCB7IElTaW11bGF0aW9uTm9kZSwgSVNpbXVsYXRpb25FZGdlIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkJztcbmltcG9ydCB7IElEM1NpbXVsYXRvckVuZ2luZVNldHRpbmdzVXBkYXRlIH0gZnJvbSAnLi4vLi4vLi4vZW5naW5lL2QzLXNpbXVsYXRvci1lbmdpbmUnO1xuaW1wb3J0IHsgSVdvcmtlclBheWxvYWQgfSBmcm9tICcuL3dvcmtlci1wYXlsb2FkJztcblxuLy8gTWVzc2FnZXMgYXJlIG9iamVjdHMgZ29pbmcgaW50byB0aGUgc2ltdWxhdGlvbiB3b3JrZXIuXG4vLyBUaGV5IGNhbiBiZSB0aG91Z2h0IG9mIHNpbWlsYXIgdG8gcmVxdWVzdHMuXG4vLyAobm90IHF1aXRlIGFzIHRoZXJlIGlzIG5vIGltbWVkaWF0ZSByZXNwb25zZSB0byBhIHJlcXVlc3QpXG5cbmV4cG9ydCBlbnVtIFdvcmtlcklucHV0VHlwZSB7XG4gIC8vIFNldCBub2RlIGFuZCBlZGdlIGRhdGEgd2l0aG91dCBzaW11bGF0aW5nXG4gIFNldERhdGEgPSAnU2V0IERhdGEnLFxuICBBZGREYXRhID0gJ0FkZCBEYXRhJyxcbiAgVXBkYXRlRGF0YSA9ICdVcGRhdGUgRGF0YScsXG4gIENsZWFyRGF0YSA9ICdDbGVhciBEYXRhJyxcblxuICAvLyBTaW11bGF0aW9uIG1lc3NhZ2UgdHlwZXNcbiAgU2ltdWxhdGUgPSAnU2ltdWxhdGUnLFxuICBBY3RpdmF0ZVNpbXVsYXRpb24gPSAnQWN0aXZhdGUgU2ltdWxhdGlvbicsXG4gIFN0YXJ0U2ltdWxhdGlvbiA9ICdTdGFydCBTaW11bGF0aW9uJyxcbiAgVXBkYXRlU2ltdWxhdGlvbiA9ICdVcGRhdGUgU2ltdWxhdGlvbicsXG4gIFN0b3BTaW11bGF0aW9uID0gJ1N0b3AgU2ltdWxhdGlvbicsXG5cbiAgLy8gTm9kZSBkcmFnZ2luZyBtZXNzYWdlIHR5cGVzXG4gIFN0YXJ0RHJhZ05vZGUgPSAnU3RhcnQgRHJhZyBOb2RlJyxcbiAgRHJhZ05vZGUgPSAnRHJhZyBOb2RlJyxcbiAgRW5kRHJhZ05vZGUgPSAnRW5kIERyYWcgTm9kZScsXG4gIEZpeE5vZGVzID0gJ0ZpeCBOb2RlcycsXG4gIFJlbGVhc2VOb2RlcyA9ICdSZWxlYXNlIE5vZGVzJyxcblxuICAvLyBTZXR0aW5ncyBhbmQgc3BlY2lhbCBwYXJhbXNcbiAgU2V0U2V0dGluZ3MgPSAnU2V0IFNldHRpbmdzJyxcbn1cblxudHlwZSBJV29ya2VySW5wdXRTZXREYXRhUGF5bG9hZCA9IElXb3JrZXJQYXlsb2FkPFxuICBXb3JrZXJJbnB1dFR5cGUuU2V0RGF0YSxcbiAge1xuICAgIG5vZGVzOiBJU2ltdWxhdGlvbk5vZGVbXTtcbiAgICBlZGdlczogSVNpbXVsYXRpb25FZGdlW107XG4gIH1cbj47XG5cbnR5cGUgSVdvcmtlcklucHV0QWRkRGF0YVBheWxvYWQgPSBJV29ya2VyUGF5bG9hZDxcbiAgV29ya2VySW5wdXRUeXBlLkFkZERhdGEsXG4gIHtcbiAgICBub2RlczogSVNpbXVsYXRpb25Ob2RlW107XG4gICAgZWRnZXM6IElTaW11bGF0aW9uRWRnZVtdO1xuICB9XG4+O1xuXG50eXBlIElXb3JrZXJJbnB1dFVwZGF0ZURhdGFQYXlsb2FkID0gSVdvcmtlclBheWxvYWQ8XG4gIFdvcmtlcklucHV0VHlwZS5VcGRhdGVEYXRhLFxuICB7XG4gICAgbm9kZXM6IElTaW11bGF0aW9uTm9kZVtdO1xuICAgIGVkZ2VzOiBJU2ltdWxhdGlvbkVkZ2VbXTtcbiAgfVxuPjtcblxudHlwZSBJV29ya2VySW5wdXRDbGVhckRhdGFQYXlsb2FkID0gSVdvcmtlclBheWxvYWQ8V29ya2VySW5wdXRUeXBlLkNsZWFyRGF0YT47XG5cbnR5cGUgSVdvcmtlcklucHV0U2ltdWxhdGVQYXlsb2FkID0gSVdvcmtlclBheWxvYWQ8V29ya2VySW5wdXRUeXBlLlNpbXVsYXRlPjtcblxudHlwZSBJV29ya2VySW5wdXRBY3RpdmF0ZVNpbXVsYXRpb25QYXlsb2FkID0gSVdvcmtlclBheWxvYWQ8V29ya2VySW5wdXRUeXBlLkFjdGl2YXRlU2ltdWxhdGlvbj47XG5cbnR5cGUgSVdvcmtlcklucHV0U3RhcnRTaW11bGF0aW9uUGF5bG9hZCA9IElXb3JrZXJQYXlsb2FkPFxuICBXb3JrZXJJbnB1dFR5cGUuU3RhcnRTaW11bGF0aW9uLFxuICB7XG4gICAgbm9kZXM6IElTaW11bGF0aW9uTm9kZVtdO1xuICAgIGVkZ2VzOiBJU2ltdWxhdGlvbkVkZ2VbXTtcbiAgfVxuPjtcblxudHlwZSBJV29ya2VySW5wdXRVcGRhdGVTaW11bGF0aW9uUGF5bG9hZCA9IElXb3JrZXJQYXlsb2FkPFxuICBXb3JrZXJJbnB1dFR5cGUuVXBkYXRlU2ltdWxhdGlvbixcbiAge1xuICAgIG5vZGVzOiBJU2ltdWxhdGlvbk5vZGVbXTtcbiAgICBlZGdlczogSVNpbXVsYXRpb25FZGdlW107XG4gIH1cbj47XG5cbnR5cGUgSVdvcmtlcklucHV0U3RvcFNpbXVsYXRpb25QYXlsb2FkID0gSVdvcmtlclBheWxvYWQ8V29ya2VySW5wdXRUeXBlLlN0b3BTaW11bGF0aW9uPjtcblxudHlwZSBJV29ya2VySW5wdXRTdGFydERyYWdOb2RlUGF5bG9hZCA9IElXb3JrZXJQYXlsb2FkPFdvcmtlcklucHV0VHlwZS5TdGFydERyYWdOb2RlPjtcblxudHlwZSBJV29ya2VySW5wdXREcmFnTm9kZVBheWxvYWQgPSBJV29ya2VyUGF5bG9hZDxXb3JrZXJJbnB1dFR5cGUuRHJhZ05vZGUsIHsgaWQ6IG51bWJlciB9ICYgSVBvc2l0aW9uPjtcblxudHlwZSBJV29ya2VySW5wdXRFbmREcmFnTm9kZVBheWxvYWQgPSBJV29ya2VyUGF5bG9hZDxcbiAgV29ya2VySW5wdXRUeXBlLkVuZERyYWdOb2RlLFxuICB7XG4gICAgaWQ6IG51bWJlcjtcbiAgfVxuPjtcblxudHlwZSBJV29ya2VySW5wdXRGaXhOb2Rlc1BheWxvYWQgPSBJV29ya2VyUGF5bG9hZDxcbiAgV29ya2VySW5wdXRUeXBlLkZpeE5vZGVzLFxuICB7XG4gICAgbm9kZXM6IElTaW11bGF0aW9uTm9kZVtdIHwgdW5kZWZpbmVkO1xuICB9XG4+O1xuXG50eXBlIElXb3JrZXJJbnB1dFJlbGVhc2VOb2Rlc1BheWxvYWQgPSBJV29ya2VyUGF5bG9hZDxcbiAgV29ya2VySW5wdXRUeXBlLlJlbGVhc2VOb2RlcyxcbiAge1xuICAgIG5vZGVzOiBJU2ltdWxhdGlvbk5vZGVbXSB8IHVuZGVmaW5lZDtcbiAgfVxuPjtcblxudHlwZSBJV29ya2VySW5wdXRTZXRTZXR0aW5nc1BheWxvYWQgPSBJV29ya2VyUGF5bG9hZDxXb3JrZXJJbnB1dFR5cGUuU2V0U2V0dGluZ3MsIElEM1NpbXVsYXRvckVuZ2luZVNldHRpbmdzVXBkYXRlPjtcblxuZXhwb3J0IHR5cGUgSVdvcmtlcklucHV0UGF5bG9hZCA9XG4gIHwgSVdvcmtlcklucHV0U2V0RGF0YVBheWxvYWRcbiAgfCBJV29ya2VySW5wdXRBZGREYXRhUGF5bG9hZFxuICB8IElXb3JrZXJJbnB1dFVwZGF0ZURhdGFQYXlsb2FkXG4gIHwgSVdvcmtlcklucHV0Q2xlYXJEYXRhUGF5bG9hZFxuICB8IElXb3JrZXJJbnB1dFNpbXVsYXRlUGF5bG9hZFxuICB8IElXb3JrZXJJbnB1dEFjdGl2YXRlU2ltdWxhdGlvblBheWxvYWRcbiAgfCBJV29ya2VySW5wdXRTdGFydFNpbXVsYXRpb25QYXlsb2FkXG4gIHwgSVdvcmtlcklucHV0VXBkYXRlU2ltdWxhdGlvblBheWxvYWRcbiAgfCBJV29ya2VySW5wdXRTdG9wU2ltdWxhdGlvblBheWxvYWRcbiAgfCBJV29ya2VySW5wdXRTdGFydERyYWdOb2RlUGF5bG9hZFxuICB8IElXb3JrZXJJbnB1dERyYWdOb2RlUGF5bG9hZFxuICB8IElXb3JrZXJJbnB1dEZpeE5vZGVzUGF5bG9hZFxuICB8IElXb3JrZXJJbnB1dFJlbGVhc2VOb2Rlc1BheWxvYWRcbiAgfCBJV29ya2VySW5wdXRFbmREcmFnTm9kZVBheWxvYWRcbiAgfCBJV29ya2VySW5wdXRTZXRTZXR0aW5nc1BheWxvYWQ7XG4iLCJpbXBvcnQgeyBJU2ltdWxhdGlvbk5vZGUsIElTaW11bGF0aW9uRWRnZSB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZCc7XG5pbXBvcnQgeyBJV29ya2VyUGF5bG9hZCB9IGZyb20gJy4vd29ya2VyLXBheWxvYWQnO1xuaW1wb3J0IHsgSUQzU2ltdWxhdG9yRW5naW5lU2V0dGluZ3MgfSBmcm9tICcuLi8uLi8uLi9lbmdpbmUvZDMtc2ltdWxhdG9yLWVuZ2luZSc7XG5cbmV4cG9ydCBlbnVtIFdvcmtlck91dHB1dFR5cGUge1xuICBTdGFiaWxpemF0aW9uU3RhcnRlZCA9ICdTdGFiaWxpemF0aW9uIFN0YXJ0ZWQnLFxuICBTdGFiaWxpemF0aW9uUHJvZ3Jlc3MgPSAnU3RhYmlsaXphdGlvbiBQcm9ncmVzcycsXG4gIFN0YWJpbGl6YXRpb25FbmRlZCA9ICdTdGFiaWxpemF0aW9uIEVuZGVkJyxcbiAgTm9kZURyYWdnZWQgPSAnTm9kZSBEcmFnZ2VkJyxcbiAgTm9kZURyYWdFbmRlZCA9ICdOb2RlIERyYWcgRW5kZWQnLFxuICBTZXR0aW5nc1VwZGF0ZWQgPSAnU2V0dGluZ3MgVXBkYXRlZCcsXG59XG5cbnR5cGUgSVdvcmtlck91dHB1dFN0YWJpbGl6YXRpb25TdGFydGVkUGF5bG9hZCA9IElXb3JrZXJQYXlsb2FkPFdvcmtlck91dHB1dFR5cGUuU3RhYmlsaXphdGlvblN0YXJ0ZWQ+O1xuXG50eXBlIElXb3JrZXJPdXRwdXRTdGFiaWxpemF0aW9uUHJvZ3Jlc3NQYXlsb2FkID0gSVdvcmtlclBheWxvYWQ8XG4gIFdvcmtlck91dHB1dFR5cGUuU3RhYmlsaXphdGlvblByb2dyZXNzLFxuICB7XG4gICAgbm9kZXM6IElTaW11bGF0aW9uTm9kZVtdO1xuICAgIGVkZ2VzOiBJU2ltdWxhdGlvbkVkZ2VbXTtcbiAgICBwcm9ncmVzczogbnVtYmVyO1xuICB9XG4+O1xuXG50eXBlIElXb3JrZXJPdXRwdXRTdGFiaWxpemF0aW9uRW5kZWRQYXlsb2FkID0gSVdvcmtlclBheWxvYWQ8XG4gIFdvcmtlck91dHB1dFR5cGUuU3RhYmlsaXphdGlvbkVuZGVkLFxuICB7XG4gICAgbm9kZXM6IElTaW11bGF0aW9uTm9kZVtdO1xuICAgIGVkZ2VzOiBJU2ltdWxhdGlvbkVkZ2VbXTtcbiAgfVxuPjtcblxudHlwZSBJV29ya2VyT3V0cHV0Tm9kZURyYWdnZWRQYXlsb2FkID0gSVdvcmtlclBheWxvYWQ8XG4gIFdvcmtlck91dHB1dFR5cGUuTm9kZURyYWdnZWQsXG4gIHtcbiAgICBub2RlczogSVNpbXVsYXRpb25Ob2RlW107XG4gICAgZWRnZXM6IElTaW11bGF0aW9uRWRnZVtdO1xuICB9XG4+O1xuXG50eXBlIElXb3JrZXJPdXRwdXROb2RlRHJhZ0VuZGVkUGF5bG9hZCA9IElXb3JrZXJQYXlsb2FkPFxuICBXb3JrZXJPdXRwdXRUeXBlLk5vZGVEcmFnRW5kZWQsXG4gIHtcbiAgICBub2RlczogSVNpbXVsYXRpb25Ob2RlW107XG4gICAgZWRnZXM6IElTaW11bGF0aW9uRWRnZVtdO1xuICB9XG4+O1xuXG50eXBlIElXb3JrZXJPdXRwdXRTZXR0aW5nc1VwZGF0ZWRQYXlsb2FkID0gSVdvcmtlclBheWxvYWQ8XG4gIFdvcmtlck91dHB1dFR5cGUuU2V0dGluZ3NVcGRhdGVkLFxuICB7XG4gICAgc2V0dGluZ3M6IElEM1NpbXVsYXRvckVuZ2luZVNldHRpbmdzO1xuICB9XG4+O1xuXG5leHBvcnQgdHlwZSBJV29ya2VyT3V0cHV0UGF5bG9hZCA9XG4gIHwgSVdvcmtlck91dHB1dFN0YWJpbGl6YXRpb25TdGFydGVkUGF5bG9hZFxuICB8IElXb3JrZXJPdXRwdXRTdGFiaWxpemF0aW9uUHJvZ3Jlc3NQYXlsb2FkXG4gIHwgSVdvcmtlck91dHB1dFN0YWJpbGl6YXRpb25FbmRlZFBheWxvYWRcbiAgfCBJV29ya2VyT3V0cHV0Tm9kZURyYWdnZWRQYXlsb2FkXG4gIHwgSVdvcmtlck91dHB1dE5vZGVEcmFnRW5kZWRQYXlsb2FkXG4gIHwgSVdvcmtlck91dHB1dFNldHRpbmdzVXBkYXRlZFBheWxvYWQ7XG4iLCIvLyAvIDxyZWZlcmVuY2UgbGliPVwid2Vid29ya2VyXCIgLz5cbmltcG9ydCB7IEQzU2ltdWxhdG9yRW5naW5lLCBEM1NpbXVsYXRvckVuZ2luZUV2ZW50VHlwZSB9IGZyb20gJy4uLy4uL2VuZ2luZS9kMy1zaW11bGF0b3ItZW5naW5lJztcbmltcG9ydCB7IElXb3JrZXJJbnB1dFBheWxvYWQsIFdvcmtlcklucHV0VHlwZSB9IGZyb20gJy4vbWVzc2FnZS93b3JrZXItaW5wdXQnO1xuaW1wb3J0IHsgSVdvcmtlck91dHB1dFBheWxvYWQsIFdvcmtlck91dHB1dFR5cGUgfSBmcm9tICcuL21lc3NhZ2Uvd29ya2VyLW91dHB1dCc7XG5cbmNvbnN0IHNpbXVsYXRvciA9IG5ldyBEM1NpbXVsYXRvckVuZ2luZSgpO1xuXG5jb25zdCBlbWl0VG9NYWluID0gKG1lc3NhZ2U6IElXb3JrZXJPdXRwdXRQYXlsb2FkKSA9PiB7XG4gIC8vIEB0cy1pZ25vcmUgV2ViIHdvcmtlciBwb3N0TWVzc2FnZSBpcyBhIGdsb2JhbCBmdW5jdGlvblxuICBwb3N0TWVzc2FnZShtZXNzYWdlKTtcbn07XG5cbnNpbXVsYXRvci5vbihEM1NpbXVsYXRvckVuZ2luZUV2ZW50VHlwZS5USUNLLCAoZGF0YSkgPT4ge1xuICBlbWl0VG9NYWluKHsgdHlwZTogV29ya2VyT3V0cHV0VHlwZS5Ob2RlRHJhZ2dlZCwgZGF0YSB9KTtcbn0pO1xuXG5zaW11bGF0b3Iub24oRDNTaW11bGF0b3JFbmdpbmVFdmVudFR5cGUuRU5ELCAoZGF0YSkgPT4ge1xuICBlbWl0VG9NYWluKHsgdHlwZTogV29ya2VyT3V0cHV0VHlwZS5Ob2RlRHJhZ0VuZGVkLCBkYXRhIH0pO1xufSk7XG5cbnNpbXVsYXRvci5vbihEM1NpbXVsYXRvckVuZ2luZUV2ZW50VHlwZS5TVEFCSUxJWkFUSU9OX1NUQVJURUQsICgpID0+IHtcbiAgZW1pdFRvTWFpbih7IHR5cGU6IFdvcmtlck91dHB1dFR5cGUuU3RhYmlsaXphdGlvblN0YXJ0ZWQgfSk7XG59KTtcblxuc2ltdWxhdG9yLm9uKEQzU2ltdWxhdG9yRW5naW5lRXZlbnRUeXBlLlNUQUJJTElaQVRJT05fUFJPR1JFU1MsIChkYXRhKSA9PiB7XG4gIGVtaXRUb01haW4oeyB0eXBlOiBXb3JrZXJPdXRwdXRUeXBlLlN0YWJpbGl6YXRpb25Qcm9ncmVzcywgZGF0YSB9KTtcbn0pO1xuXG5zaW11bGF0b3Iub24oRDNTaW11bGF0b3JFbmdpbmVFdmVudFR5cGUuU1RBQklMSVpBVElPTl9FTkRFRCwgKGRhdGEpID0+IHtcbiAgZW1pdFRvTWFpbih7IHR5cGU6IFdvcmtlck91dHB1dFR5cGUuU3RhYmlsaXphdGlvbkVuZGVkLCBkYXRhIH0pO1xufSk7XG5cbnNpbXVsYXRvci5vbihEM1NpbXVsYXRvckVuZ2luZUV2ZW50VHlwZS5OT0RFX0RSQUdHRUQsIChkYXRhKSA9PiB7XG4gIC8vIE5vdGlmeSB0aGUgY2xpZW50IHRoYXQgdGhlIG5vZGUgcG9zaXRpb24gY2hhbmdlZC5cbiAgLy8gVGhpcyBpcyBvdGhlcndpc2UgaGFuZGxlZCBieSB0aGUgc2ltdWxhdGlvbiB0aWNrIGlmIHBoeXNpY3MgaXMgZW5hYmxlZC5cbiAgZW1pdFRvTWFpbih7IHR5cGU6IFdvcmtlck91dHB1dFR5cGUuTm9kZURyYWdnZWQsIGRhdGEgfSk7XG59KTtcblxuc2ltdWxhdG9yLm9uKEQzU2ltdWxhdG9yRW5naW5lRXZlbnRUeXBlLlNFVFRJTkdTX1VQREFURUQsIChkYXRhKSA9PiB7XG4gIGVtaXRUb01haW4oeyB0eXBlOiBXb3JrZXJPdXRwdXRUeXBlLlNldHRpbmdzVXBkYXRlZCwgZGF0YSB9KTtcbn0pO1xuXG5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKHsgZGF0YSB9OiBNZXNzYWdlRXZlbnQ8SVdvcmtlcklucHV0UGF5bG9hZD4pID0+IHtcbiAgc3dpdGNoIChkYXRhLnR5cGUpIHtcbiAgICBjYXNlIFdvcmtlcklucHV0VHlwZS5BY3RpdmF0ZVNpbXVsYXRpb246IHtcbiAgICAgIHNpbXVsYXRvci5hY3RpdmF0ZVNpbXVsYXRpb24oKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgV29ya2VySW5wdXRUeXBlLlNldERhdGE6IHtcbiAgICAgIHNpbXVsYXRvci5zZXREYXRhKGRhdGEuZGF0YSk7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjYXNlIFdvcmtlcklucHV0VHlwZS5BZGREYXRhOiB7XG4gICAgICBzaW11bGF0b3IuYWRkRGF0YShkYXRhLmRhdGEpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSBXb3JrZXJJbnB1dFR5cGUuVXBkYXRlRGF0YToge1xuICAgICAgc2ltdWxhdG9yLnVwZGF0ZURhdGEoZGF0YS5kYXRhKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgV29ya2VySW5wdXRUeXBlLkNsZWFyRGF0YToge1xuICAgICAgc2ltdWxhdG9yLmNsZWFyRGF0YSgpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSBXb3JrZXJJbnB1dFR5cGUuU2ltdWxhdGU6IHtcbiAgICAgIHNpbXVsYXRvci5zaW11bGF0ZSgpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSBXb3JrZXJJbnB1dFR5cGUuU3RhcnRTaW11bGF0aW9uOiB7XG4gICAgICBzaW11bGF0b3Iuc3RhcnRTaW11bGF0aW9uKGRhdGEuZGF0YSk7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjYXNlIFdvcmtlcklucHV0VHlwZS5VcGRhdGVTaW11bGF0aW9uOiB7XG4gICAgICBzaW11bGF0b3IudXBkYXRlU2ltdWxhdGlvbihkYXRhLmRhdGEpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSBXb3JrZXJJbnB1dFR5cGUuU3RvcFNpbXVsYXRpb246IHtcbiAgICAgIHNpbXVsYXRvci5zdG9wU2ltdWxhdGlvbigpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSBXb3JrZXJJbnB1dFR5cGUuU3RhcnREcmFnTm9kZToge1xuICAgICAgc2ltdWxhdG9yLnN0YXJ0RHJhZ05vZGUoKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgV29ya2VySW5wdXRUeXBlLkRyYWdOb2RlOiB7XG4gICAgICBzaW11bGF0b3IuZHJhZ05vZGUoZGF0YS5kYXRhKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgV29ya2VySW5wdXRUeXBlLkZpeE5vZGVzOiB7XG4gICAgICBzaW11bGF0b3IuZml4Tm9kZXMoZGF0YS5kYXRhLm5vZGVzKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgV29ya2VySW5wdXRUeXBlLlJlbGVhc2VOb2Rlczoge1xuICAgICAgc2ltdWxhdG9yLnJlbGVhc2VOb2RlcyhkYXRhLmRhdGEubm9kZXMpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSBXb3JrZXJJbnB1dFR5cGUuRW5kRHJhZ05vZGU6IHtcbiAgICAgIHNpbXVsYXRvci5lbmREcmFnTm9kZShkYXRhLmRhdGEpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSBXb3JrZXJJbnB1dFR5cGUuU2V0U2V0dGluZ3M6IHtcbiAgICAgIHNpbXVsYXRvci5zZXRTZXR0aW5ncyhkYXRhLmRhdGEpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59KTtcbiIsIi8vIFJlZmVyZW5jZTogaHR0cHM6Ly9yanphd29yc2tpLmNvbS8yMDE5LzEwL2V2ZW50LWVtaXR0ZXJzLWluLXR5cGVzY3JpcHRcbmV4cG9ydCB0eXBlIElFdmVudE1hcCA9IFJlY29yZDxzdHJpbmcsIGFueT47XG50eXBlIElFdmVudEtleTxUIGV4dGVuZHMgSUV2ZW50TWFwPiA9IHN0cmluZyAmIGtleW9mIFQ7XG50eXBlIElFdmVudFJlY2VpdmVyPFQ+ID0gKHBhcmFtczogVCkgPT4gdm9pZDtcblxuZXhwb3J0IGludGVyZmFjZSBJRW1pdHRlcjxUIGV4dGVuZHMgSUV2ZW50TWFwPiB7XG4gIG9uY2U8SyBleHRlbmRzIElFdmVudEtleTxUPj4oZXZlbnROYW1lOiBLLCBmdW5jOiBJRXZlbnRSZWNlaXZlcjxUW0tdPik6IElFbWl0dGVyPFQ+O1xuICBvbjxLIGV4dGVuZHMgSUV2ZW50S2V5PFQ+PihldmVudE5hbWU6IEssIGZ1bmM6IElFdmVudFJlY2VpdmVyPFRbS10+KTogSUVtaXR0ZXI8VD47XG4gIG9mZjxLIGV4dGVuZHMgSUV2ZW50S2V5PFQ+PihldmVudE5hbWU6IEssIGZ1bmM6IElFdmVudFJlY2VpdmVyPFRbS10+KTogSUVtaXR0ZXI8VD47XG4gIGVtaXQ8SyBleHRlbmRzIElFdmVudEtleTxUPj4oZXZlbnROYW1lOiBLLCBwYXJhbXM6IFRbS10pOiBib29sZWFuO1xuICBldmVudE5hbWVzPEsgZXh0ZW5kcyBJRXZlbnRLZXk8VD4+KCk6IEtbXTtcbiAgbGlzdGVuZXJDb3VudDxLIGV4dGVuZHMgSUV2ZW50S2V5PFQ+PihldmVudE5hbWU6IEspOiBudW1iZXI7XG4gIGxpc3RlbmVyczxLIGV4dGVuZHMgSUV2ZW50S2V5PFQ+PihldmVudE5hbWU6IEspOiBJRXZlbnRSZWNlaXZlcjxUW0tdPltdO1xuICBhZGRMaXN0ZW5lcjxLIGV4dGVuZHMgSUV2ZW50S2V5PFQ+PihldmVudE5hbWU6IEssIGZ1bmM6IElFdmVudFJlY2VpdmVyPFRbS10+KTogSUVtaXR0ZXI8VD47XG4gIHJlbW92ZUxpc3RlbmVyPEsgZXh0ZW5kcyBJRXZlbnRLZXk8VD4+KGV2ZW50TmFtZTogSywgZnVuYzogSUV2ZW50UmVjZWl2ZXI8VFtLXT4pOiBJRW1pdHRlcjxUPjtcbiAgcmVtb3ZlQWxsTGlzdGVuZXJzPEsgZXh0ZW5kcyBJRXZlbnRLZXk8VD4+KGV2ZW50TmFtZT86IEspOiBJRW1pdHRlcjxUPjtcbn1cblxuaW50ZXJmYWNlIElFbW1pdGVyTGlzdGVuZXI8VCBleHRlbmRzIElFdmVudE1hcD4ge1xuICBjYWxsYWJsZTogSUV2ZW50UmVjZWl2ZXI8VFthbnldPjtcbiAgaXNPbmNlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIEVtaXR0ZXI8VCBleHRlbmRzIElFdmVudE1hcD4gaW1wbGVtZW50cyBJRW1pdHRlcjxUPiB7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2xpc3RlbmVycyA9IG5ldyBNYXA8SUV2ZW50S2V5PFQ+LCBJRW1taXRlckxpc3RlbmVyPFQ+W10+KCk7XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBvbmUtdGltZSBsaXN0ZW5lciBmdW5jdGlvbiBmb3IgdGhlIGV2ZW50IG5hbWVkIGV2ZW50TmFtZS4gVGhlIG5leHQgdGltZSBldmVudE5hbWUgaXNcbiAgICogdHJpZ2dlcmVkLCB0aGlzIGxpc3RlbmVyIGlzIHJlbW92ZWQgYW5kIHRoZW4gaW52b2tlZC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9ldmVudHMuaHRtbCNlbWl0dGVyb25jZWV2ZW50bmFtZS1saXN0ZW5lcn1cbiAgICogQHBhcmFtIHtJRXZlbnRLZXl9IGV2ZW50TmFtZSBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7SUV2ZW50UmVjZWl2ZXJ9IGZ1bmMgRXZlbnQgZnVuY3Rpb25cbiAgICogQHJldHVybiB7SUVtaXR0ZXJ9IFJlZmVyZW5jZSB0byB0aGUgRXZlbnRFbWl0dGVyLCBzbyB0aGF0IGNhbGxzIGNhbiBiZSBjaGFpbmVkXG4gICAqL1xuICBvbmNlPEsgZXh0ZW5kcyBJRXZlbnRLZXk8VD4+KGV2ZW50TmFtZTogSywgZnVuYzogSUV2ZW50UmVjZWl2ZXI8VFtLXT4pOiBJRW1pdHRlcjxUPiB7XG4gICAgY29uc3QgbmV3TGlzdGVuZXI6IElFbW1pdGVyTGlzdGVuZXI8VD4gPSB7XG4gICAgICBjYWxsYWJsZTogZnVuYyxcbiAgICAgIGlzT25jZTogdHJ1ZSxcbiAgICB9O1xuXG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzLmdldChldmVudE5hbWUpO1xuICAgIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgIGxpc3RlbmVycy5wdXNoKG5ld0xpc3RlbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbGlzdGVuZXJzLnNldChldmVudE5hbWUsIFtuZXdMaXN0ZW5lcl0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBlbmQgb2YgdGhlIGxpc3RlbmVycyBhcnJheSBmb3IgdGhlIGV2ZW50IG5hbWVkIGV2ZW50TmFtZS5cbiAgICogTm8gY2hlY2tzIGFyZSBtYWRlIHRvIHNlZSBpZiB0aGUgbGlzdGVuZXIgaGFzIGFscmVhZHkgYmVlbiBhZGRlZC4gTXVsdGlwbGUgY2FsbHMgcGFzc2luZ1xuICAgKiB0aGUgc2FtZSBjb21iaW5hdGlvbiBvZiBldmVudE5hbWUgYW5kIGxpc3RlbmVyIHdpbGwgcmVzdWx0IGluIHRoZSBsaXN0ZW5lciBiZWluZyBhZGRlZCxcbiAgICogYW5kIGNhbGxlZCwgbXVsdGlwbGUgdGltZXMuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWwjZW1pdHRlcm9uZXZlbnRuYW1lLWxpc3RlbmVyfVxuICAgKiBAcGFyYW0ge0lFdmVudEtleX0gZXZlbnROYW1lIEV2ZW50IG5hbWVcbiAgICogQHBhcmFtIHtJRXZlbnRSZWNlaXZlcn0gZnVuYyBFdmVudCBmdW5jdGlvblxuICAgKiBAcmV0dXJuIHtJRW1pdHRlcn0gUmVmZXJlbmNlIHRvIHRoZSBFdmVudEVtaXR0ZXIsIHNvIHRoYXQgY2FsbHMgY2FuIGJlIGNoYWluZWRcbiAgICovXG4gIG9uPEsgZXh0ZW5kcyBJRXZlbnRLZXk8VD4+KGV2ZW50TmFtZTogSywgZnVuYzogSUV2ZW50UmVjZWl2ZXI8VFtLXT4pOiBJRW1pdHRlcjxUPiB7XG4gICAgY29uc3QgbmV3TGlzdGVuZXI6IElFbW1pdGVyTGlzdGVuZXI8VD4gPSB7XG4gICAgICBjYWxsYWJsZTogZnVuYyxcbiAgICB9O1xuXG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzLmdldChldmVudE5hbWUpO1xuICAgIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgIGxpc3RlbmVycy5wdXNoKG5ld0xpc3RlbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbGlzdGVuZXJzLnNldChldmVudE5hbWUsIFtuZXdMaXN0ZW5lcl0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIHNwZWNpZmllZCBsaXN0ZW5lciBmcm9tIHRoZSBsaXN0ZW5lciBhcnJheSBmb3IgdGhlIGV2ZW50IG5hbWVkIGV2ZW50TmFtZS5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9ldmVudHMuaHRtbCNlbWl0dGVycmVtb3ZlbGlzdGVuZXJldmVudG5hbWUtbGlzdGVuZXJ9XG4gICAqIEBwYXJhbSB7SUV2ZW50S2V5fSBldmVudE5hbWUgRXZlbnQgbmFtZVxuICAgKiBAcGFyYW0ge0lFdmVudFJlY2VpdmVyfSBmdW5jIEV2ZW50IGZ1bmN0aW9uXG4gICAqIEByZXR1cm4ge0lFbWl0dGVyfSBSZWZlcmVuY2UgdG8gdGhlIEV2ZW50RW1pdHRlciwgc28gdGhhdCBjYWxscyBjYW4gYmUgY2hhaW5lZFxuICAgKi9cbiAgb2ZmPEsgZXh0ZW5kcyBJRXZlbnRLZXk8VD4+KGV2ZW50TmFtZTogSywgZnVuYzogSUV2ZW50UmVjZWl2ZXI8VFtLXT4pOiBJRW1pdHRlcjxUPiB7XG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzLmdldChldmVudE5hbWUpO1xuICAgIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgIGNvbnN0IGZpbHRlcmVkTGlzdGVuZXJzID0gbGlzdGVuZXJzLmZpbHRlcigobGlzdGVuZXIpID0+IGxpc3RlbmVyLmNhbGxhYmxlICE9PSBmdW5jKTtcbiAgICAgIHRoaXMuX2xpc3RlbmVycy5zZXQoZXZlbnROYW1lLCBmaWx0ZXJlZExpc3RlbmVycyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU3luY2hyb25vdXNseSBjYWxscyBlYWNoIG9mIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgdGhlIGV2ZW50IG5hbWVkIGV2ZW50TmFtZSxcbiAgICogaW4gdGhlIG9yZGVyIHRoZXkgd2VyZSByZWdpc3RlcmVkLCBwYXNzaW5nIHRoZSBzdXBwbGllZCBhcmd1bWVudHMgdG8gZWFjaC5cbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqXG4gICAqIEBwYXJhbSB7SUV2ZW50S2V5fSBldmVudE5hbWUgRXZlbnQgbmFtZVxuICAgKiBAcGFyYW0ge2FueX0gcGFyYW1zIEV2ZW50IHBhcmFtZXRlcnNcbiAgICpcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgZXZlbnQgaGFkIGxpc3RlbmVycywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBlbWl0PEsgZXh0ZW5kcyBJRXZlbnRLZXk8VD4+KGV2ZW50TmFtZTogSywgcGFyYW1zOiBUW0tdKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzLmdldChldmVudE5hbWUpO1xuICAgIGlmICghbGlzdGVuZXJzIHx8IGxpc3RlbmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgaGFzT25jZUxpc3RlbmVyID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0uaXNPbmNlKSB7XG4gICAgICAgIGhhc09uY2VMaXN0ZW5lciA9IHRydWU7XG4gICAgICB9XG4gICAgICBsaXN0ZW5lcnNbaV0uY2FsbGFibGUocGFyYW1zKTtcbiAgICB9XG5cbiAgICBpZiAoaGFzT25jZUxpc3RlbmVyKSB7XG4gICAgICBjb25zdCBmaWx0ZXJlZExpc3RlbmVycyA9IGxpc3RlbmVycy5maWx0ZXIoKGxpc3RlbmVyKSA9PiAhbGlzdGVuZXIuaXNPbmNlKTtcbiAgICAgIHRoaXMuX2xpc3RlbmVycy5zZXQoZXZlbnROYW1lLCBmaWx0ZXJlZExpc3RlbmVycyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZCBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWwjZW1pdHRlcmV2ZW50bmFtZXN9XG4gICAqIEByZXR1cm4ge0lFdmVudEtleVtdfSBFdmVudCBuYW1lcyB3aXRoIHJlZ2lzdGVyZWQgbGlzdGVuZXJzXG4gICAqL1xuICBldmVudE5hbWVzPEsgZXh0ZW5kcyBJRXZlbnRLZXk8VD4+KCk6IEtbXSB7XG4gICAgcmV0dXJuIFsuLi50aGlzLl9saXN0ZW5lcnMua2V5cygpXSBhcyBLW107XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGxpc3RlbmVycyBsaXN0ZW5pbmcgdG8gdGhlIGV2ZW50IG5hbWVkIGV2ZW50TmFtZS5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9ldmVudHMuaHRtbCNlbWl0dGVybGlzdGVuZXJjb3VudGV2ZW50bmFtZX1cbiAgICogQHBhcmFtIHtJRXZlbnRLZXl9IGV2ZW50TmFtZSBFdmVudCBuYW1lXG4gICAqIEByZXR1cm4ge251bWJlcn0gTnVtYmVyIG9mIGxpc3RlbmVycyBsaXN0ZW5pbmcgdG8gdGhlIGV2ZW50IG5hbWVcbiAgICovXG4gIGxpc3RlbmVyQ291bnQ8SyBleHRlbmRzIElFdmVudEtleTxUPj4oZXZlbnROYW1lOiBLKTogbnVtYmVyIHtcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnMuZ2V0KGV2ZW50TmFtZSk7XG4gICAgcmV0dXJuIGxpc3RlbmVycyA/IGxpc3RlbmVycy5sZW5ndGggOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgZm9yIHRoZSBldmVudCBuYW1lZCBldmVudE5hbWUuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWwjZW1pdHRlcmxpc3RlbmVyc2V2ZW50bmFtZX1cbiAgICogQHBhcmFtIHtJRXZlbnRLZXl9IGV2ZW50TmFtZSBFdmVudCBuYW1lXG4gICAqIEByZXR1cm4ge0lFdmVudFJlY2VpdmVyW119IEFycmF5IG9mIGxpc3RlbmVycyBmb3IgdGhlIGV2ZW50IG5hbWVcbiAgICovXG4gIGxpc3RlbmVyczxLIGV4dGVuZHMgSUV2ZW50S2V5PFQ+PihldmVudE5hbWU6IEspOiBJRXZlbnRSZWNlaXZlcjxUW0tdPltdIHtcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnMuZ2V0KGV2ZW50TmFtZSk7XG4gICAgaWYgKCFsaXN0ZW5lcnMpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcmV0dXJuIGxpc3RlbmVycy5tYXAoKGxpc3RlbmVyKSA9PiBsaXN0ZW5lci5jYWxsYWJsZSk7XG4gIH1cblxuICAvKipcbiAgICogQWxpYXMgZm9yIGVtaXR0ZXIub24oZXZlbnROYW1lLCBsaXN0ZW5lcikuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWwjZW1pdHRlcmFkZGxpc3RlbmVyZXZlbnRuYW1lLWxpc3RlbmVyfVxuICAgKiBAcGFyYW0ge0lFdmVudEtleX0gZXZlbnROYW1lIEV2ZW50IG5hbWVcbiAgICogQHBhcmFtIHtJRXZlbnRSZWNlaXZlcn0gZnVuYyBFdmVudCBmdW5jdGlvblxuICAgKiBAcmV0dXJuIHtJRW1pdHRlcn0gUmVmZXJlbmNlIHRvIHRoZSBFdmVudEVtaXR0ZXIsIHNvIHRoYXQgY2FsbHMgY2FuIGJlIGNoYWluZWRcbiAgICovXG4gIGFkZExpc3RlbmVyPEsgZXh0ZW5kcyBJRXZlbnRLZXk8VD4+KGV2ZW50TmFtZTogSywgZnVuYzogSUV2ZW50UmVjZWl2ZXI8VFtLXT4pOiBJRW1pdHRlcjxUPiB7XG4gICAgcmV0dXJuIHRoaXMub248Sz4oZXZlbnROYW1lLCBmdW5jKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGlhcyBmb3IgZW1pdHRlci5vZmYoZXZlbnROYW1lLCBsaXN0ZW5lcikuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWwjZW1pdHRlcnJlbW92ZWxpc3RlbmVyZXZlbnRuYW1lLWxpc3RlbmVyfVxuICAgKiBAcGFyYW0ge0lFdmVudEtleX0gZXZlbnROYW1lIEV2ZW50IG5hbWVcbiAgICogQHBhcmFtIHtJRXZlbnRSZWNlaXZlcn0gZnVuYyBFdmVudCBmdW5jdGlvblxuICAgKiBAcmV0dXJuIHtJRW1pdHRlcn0gUmVmZXJlbmNlIHRvIHRoZSBFdmVudEVtaXR0ZXIsIHNvIHRoYXQgY2FsbHMgY2FuIGJlIGNoYWluZWRcbiAgICovXG4gIHJlbW92ZUxpc3RlbmVyPEsgZXh0ZW5kcyBJRXZlbnRLZXk8VD4+KGV2ZW50TmFtZTogSywgZnVuYzogSUV2ZW50UmVjZWl2ZXI8VFtLXT4pOiBJRW1pdHRlcjxUPiB7XG4gICAgcmV0dXJuIHRoaXMub2ZmPEs+KGV2ZW50TmFtZSwgZnVuYyk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzLCBvciB0aG9zZSBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50TmFtZS5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9ldmVudHMuaHRtbCNlbWl0dGVycmVtb3ZlYWxsbGlzdGVuZXJzZXZlbnRuYW1lfVxuICAgKiBAcGFyYW0ge0lFdmVudEtleX0gZXZlbnROYW1lIEV2ZW50IG5hbWVcbiAgICogQHJldHVybiB7SUVtaXR0ZXJ9IFJlZmVyZW5jZSB0byB0aGUgRXZlbnRFbWl0dGVyLCBzbyB0aGF0IGNhbGxzIGNhbiBiZSBjaGFpbmVkXG4gICAqL1xuICByZW1vdmVBbGxMaXN0ZW5lcnM8SyBleHRlbmRzIElFdmVudEtleTxUPj4oZXZlbnROYW1lPzogSyk6IElFbWl0dGVyPFQ+IHtcbiAgICBpZiAoZXZlbnROYW1lKSB7XG4gICAgICB0aGlzLl9saXN0ZW5lcnMuZGVsZXRlKGV2ZW50TmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2xpc3RlbmVycy5jbGVhcigpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iLCJpbXBvcnQgeyBpc0FycmF5LCBpc0RhdGUsIGlzUGxhaW5PYmplY3QgfSBmcm9tICcuL3R5cGUudXRpbHMnO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZGVlcCBjb3B5IG9mIHRoZSByZWNlaXZlZCBvYmplY3QuIERhdGVzLCBhcnJheXMgYW5kXG4gKiBwbGFpbiBvYmplY3RzIHdpbGwgYmUgY3JlYXRlZCBhcyBuZXcgb2JqZWN0cyAobmV3IHJlZmVyZW5jZSkuXG4gKlxuICogQHBhcmFtIHthbnl9IG9iaiBPYmplY3RcbiAqIEByZXR1cm4ge2FueX0gRGVlcCBjb3BpZWQgb2JqZWN0XG4gKi9cbmV4cG9ydCBjb25zdCBjb3B5T2JqZWN0ID0gPFQgZXh0ZW5kcyBhbnlbXSB8IGFueT4ob2JqOiBUKTogVCA9PiB7XG4gIGlmIChpc0RhdGUob2JqKSkge1xuICAgIHJldHVybiBjb3B5RGF0ZShvYmopIGFzIFQ7XG4gIH1cblxuICBpZiAoaXNBcnJheShvYmopKSB7XG4gICAgcmV0dXJuIGNvcHlBcnJheShvYmopIGFzIFQ7XG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChvYmopKSB7XG4gICAgcmV0dXJuIGNvcHlQbGFpbk9iamVjdChvYmopIGFzIFQ7XG4gIH1cblxuICAvLyBJdCBpcyBhIHByaW1pdGl2ZSwgZnVuY3Rpb24gb3IgYSBjdXN0b20gY2xhc3NcbiAgcmV0dXJuIG9iajtcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbCBieSB2YWx1ZS4gSXQgZG9lcyBkZWVwIGNoZWNraW5nIGZvclxuICogdmFsdWVzIHdpdGhpbiBhcnJheXMgb3IgcGxhaW4gb2JqZWN0cy4gRXF1YWxpdHkgZm9yIGFueXRoaW5nIHRoYXQgaXNcbiAqIG5vdCBhIERhdGUsIEFycmF5LCBvciBhIHBsYWluIG9iamVjdCB3aWxsIGJlIGNoZWNrZWQgYXMgYGEgPT09IGJgLlxuICpcbiAqIEBwYXJhbSB7YW55fSBvYmoxIE9iamVjdFxuICogQHBhcmFtIHthbnl9IG9iajIgT2JqZWN0XG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIG9iamVjdHMgYXJlIGRlZXBseSBlcXVhbCwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbmV4cG9ydCBjb25zdCBpc09iamVjdEVxdWFsID0gKG9iajE6IGFueSwgb2JqMjogYW55KTogYm9vbGVhbiA9PiB7XG4gIGNvbnN0IGlzRGF0ZTEgPSBpc0RhdGUob2JqMSk7XG4gIGNvbnN0IGlzRGF0ZTIgPSBpc0RhdGUob2JqMik7XG5cbiAgaWYgKChpc0RhdGUxICYmICFpc0RhdGUyKSB8fCAoIWlzRGF0ZTEgJiYgaXNEYXRlMikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoaXNEYXRlMSAmJiBpc0RhdGUyKSB7XG4gICAgcmV0dXJuIG9iajEuZ2V0VGltZSgpID09PSBvYmoyLmdldFRpbWUoKTtcbiAgfVxuXG4gIGNvbnN0IGlzQXJyYXkxID0gaXNBcnJheShvYmoxKTtcbiAgY29uc3QgaXNBcnJheTIgPSBpc0FycmF5KG9iajIpO1xuXG4gIGlmICgoaXNBcnJheTEgJiYgIWlzQXJyYXkyKSB8fCAoIWlzQXJyYXkxICYmIGlzQXJyYXkyKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChpc0FycmF5MSAmJiBpc0FycmF5Mikge1xuICAgIGlmIChvYmoxLmxlbmd0aCAhPT0gb2JqMi5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqMS5ldmVyeSgodmFsdWU6IGFueSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgcmV0dXJuIGlzT2JqZWN0RXF1YWwodmFsdWUsIG9iajJbaW5kZXhdKTtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGlzT2JqZWN0MSA9IGlzUGxhaW5PYmplY3Qob2JqMSk7XG4gIGNvbnN0IGlzT2JqZWN0MiA9IGlzUGxhaW5PYmplY3Qob2JqMik7XG5cbiAgaWYgKChpc09iamVjdDEgJiYgIWlzT2JqZWN0MikgfHwgKCFpc09iamVjdDEgJiYgaXNPYmplY3QyKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChpc09iamVjdDEgJiYgaXNPYmplY3QyKSB7XG4gICAgY29uc3Qga2V5czEgPSBPYmplY3Qua2V5cyhvYmoxKTtcbiAgICBjb25zdCBrZXlzMiA9IE9iamVjdC5rZXlzKG9iajIpO1xuXG4gICAgaWYgKCFpc09iamVjdEVxdWFsKGtleXMxLCBrZXlzMikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4ga2V5czEuZXZlcnkoKGtleSkgPT4ge1xuICAgICAgcmV0dXJuIGlzT2JqZWN0RXF1YWwob2JqMVtrZXldLCBvYmoyW2tleV0pO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIG9iajEgPT09IG9iajI7XG59O1xuXG4vKipcbiAqIENvcGllcyBkYXRlIG9iamVjdCBpbnRvIGEgbmV3IGRhdGUgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZSBEYXRlXG4gKiBAcmV0dXJuIHtEYXRlfSBEYXRlIG9iamVjdCBjb3B5XG4gKi9cbmNvbnN0IGNvcHlEYXRlID0gKGRhdGU6IERhdGUpOiBEYXRlID0+IHtcbiAgcmV0dXJuIG5ldyBEYXRlKGRhdGUpO1xufTtcblxuLyoqXG4gKiBEZWVwIGNvcGllcyBhbiBhcnJheSBpbnRvIGEgbmV3IGFycmF5LiBBcnJheSB2YWx1ZXMgd2lsbFxuICogYmUgZGVlcCBjb3BpZWQgdG9vLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IEFycmF5XG4gKiBAcmV0dXJuIHtBcnJheX0gRGVlcCBjb3BpZWQgYXJyYXlcbiAqL1xuY29uc3QgY29weUFycmF5ID0gPFQ+KGFycmF5OiBUW10pOiBUW10gPT4ge1xuICByZXR1cm4gYXJyYXkubWFwKCh2YWx1ZSkgPT4gY29weU9iamVjdCh2YWx1ZSkpO1xufTtcblxuLyoqXG4gKiBEZWVwIGNvcGllcyBhIHBsYWluIG9iamVjdCBpbnRvIGEgbmV3IHBsYWluIG9iamVjdC4gT2JqZWN0XG4gKiB2YWx1ZXMgd2lsbCBiZSBkZWVwIGNvcGllZCB0b28uXG4gKlxuICogQHBhcmFtIHtSZWNvcmR9IG9iaiBPYmplY3RcbiAqIEByZXR1cm4ge1JlY29yZH0gRGVlcCBjb3BpZWQgb2JqZWN0XG4gKi9cbmNvbnN0IGNvcHlQbGFpbk9iamVjdCA9IDxUPihvYmo6IFJlY29yZDxzdHJpbmcsIFQ+KTogUmVjb3JkPHN0cmluZywgVD4gPT4ge1xuICBjb25zdCBuZXdPYmplY3Q6IFJlY29yZDxzdHJpbmcsIFQ+ID0ge307XG4gIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgbmV3T2JqZWN0W2tleV0gPSBjb3B5T2JqZWN0KG9ialtrZXldKTtcbiAgfSk7XG4gIHJldHVybiBuZXdPYmplY3Q7XG59O1xuIiwiLyoqXG4gKiBNYWtlcyBhbGwgZGVlcCBwcm9wZXJ0aWVzIHBhcnRpYWwuIFNhbWUgYXMgUGFydGlhbDxUPiBidXQgZGVlcC5cbiAqL1xuZXhwb3J0IHR5cGUgRGVlcFBhcnRpYWw8VD4gPSBUIGV4dGVuZHMgb2JqZWN0ID8geyBbUCBpbiBrZXlvZiBUXT86IERlZXBQYXJ0aWFsPFRbUF0+IH0gOiBUO1xuXG4vKipcbiAqIE1ha2VzIGFsbCBkZWVwIHByb3BlcnRpZXMgcmVxdWlyZWQuIFNhbWUgYXMgUmVxdWlyZWQ8VD4gYnV0IGRlZXAuXG4gKi9cbmV4cG9ydCB0eXBlIERlZXBSZXF1aXJlZDxUPiA9IFQgZXh0ZW5kcyBvYmplY3QgPyB7IFtQIGluIGtleW9mIFRdLT86IERlZXBSZXF1aXJlZDxUW1BdPiB9IDogVDtcblxuLyoqXG4gKiBUeXBlIGNoZWNrIGZvciBzdHJpbmcgdmFsdWVzLlxuICpcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSBBbnkgdmFsdWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgaXQgaXMgYSBzdHJpbmcsIGZhbHNlIG90aGVyd2lzZVxuICovXG5leHBvcnQgY29uc3QgaXNTdHJpbmcgPSAodmFsdWU6IGFueSk6IHZhbHVlIGlzIHN0cmluZyA9PiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xufTtcblxuLyoqXG4gKiBUeXBlIGNoZWNrIGZvciBudW1iZXIgdmFsdWVzLlxuICpcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSBBbnkgdmFsdWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgaXQgaXMgYSBudW1iZXIsIGZhbHNlIG90aGVyd2lzZVxuICovXG5leHBvcnQgY29uc3QgaXNOdW1iZXIgPSAodmFsdWU6IGFueSk6IHZhbHVlIGlzIG51bWJlciA9PiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInO1xufTtcblxuLyoqXG4gKiBUeXBlIGNoZWNrIGZvciBib29sZWFuIHZhbHVlcy5cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgQW55IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIGl0IGlzIGEgYm9vbGVhbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gKi9cbmV4cG9ydCBjb25zdCBpc0Jvb2xlYW4gPSAodmFsdWU6IGFueSk6IHZhbHVlIGlzIGJvb2xlYW4gPT4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbic7XG59O1xuXG4vKipcbiAqIFR5cGUgY2hlY2sgZm9yIERhdGUgdmFsdWVzLlxuICpcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSBBbnkgdmFsdWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgaXQgaXMgYSBEYXRlLCBmYWxzZSBvdGhlcndpc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGlzRGF0ZSA9ICh2YWx1ZTogYW55KTogdmFsdWUgaXMgRGF0ZSA9PiB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIERhdGU7XG59O1xuXG4vKipcbiAqIFR5cGUgY2hlY2sgZm9yIEFycmF5IHZhbHVlcy4gQWxpYXMgZm9yIGBBcnJheS5pc0FycmF5YC5cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgQW55IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIGl0IGlzIGFuIEFycmF5LCBmYWxzZSBvdGhlcndpc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGlzQXJyYXkgPSAodmFsdWU6IGFueSk6IHZhbHVlIGlzIEFycmF5PGFueT4gPT4ge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG59O1xuXG4vKipcbiAqIFR5cGUgY2hlY2sgZm9yIHBsYWluIG9iamVjdCB2YWx1ZXM6IHsgW2tleV06IHZhbHVlIH1cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgQW55IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIGl0IGlzIGEgcGxhaW4gb2JqZWN0LCBmYWxzZSBvdGhlcndpc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGlzUGxhaW5PYmplY3QgPSAodmFsdWU6IGFueSk6IHZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIGFueT4gPT4ge1xuICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0Jztcbn07XG5cbi8qKlxuICogVHlwZSBjaGVjayBmb3IgbnVsbCB2YWx1ZXMuXG4gKlxuICogQHBhcmFtIHthbnl9IHZhbHVlIEFueSB2YWx1ZVxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiBpdCBpcyBhIG51bGwsIGZhbHNlIG90aGVyd2lzZVxuICovXG5leHBvcnQgY29uc3QgaXNOdWxsID0gKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBudWxsID0+IHtcbiAgcmV0dXJuIHZhbHVlID09PSBudWxsO1xufTtcblxuLyoqXG4gKiBUeXBlIGNoZWNrIGZvciBGdW5jdGlvbiB2YWx1ZXMuXG4gKlxuICogQHBhcmFtIHthbnl9IHZhbHVlIEFueSB2YWx1ZVxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiBpdCBpcyBhIEZ1bmN0aW9uLCBmYWxzZSBvdGhlcndpc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGlzRnVuY3Rpb24gPSAodmFsdWU6IGFueSk6IHZhbHVlIGlzIEZ1bmN0aW9uID0+IHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn07XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuLy8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbl9fd2VicGFja19yZXF1aXJlX18ubSA9IF9fd2VicGFja19tb2R1bGVzX187XG5cbi8vIHRoZSBzdGFydHVwIGZ1bmN0aW9uXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuXHQvLyBUaGlzIGVudHJ5IG1vZHVsZSBkZXBlbmRzIG9uIG90aGVyIGxvYWRlZCBjaHVua3MgYW5kIGV4ZWN1dGlvbiBuZWVkIHRvIGJlIGRlbGF5ZWRcblx0dmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8odW5kZWZpbmVkLCBbXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc19kMy1mb3JjZV9zcmNfY2VudGVyX2pzLW5vZGVfbW9kdWxlc19kMy1mb3JjZV9zcmNfY29sbGlkZV9qcy1ub2RlX21vZHVsZXMtMDQzMjdkXCJdLCAoKSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL3NpbXVsYXRvci90eXBlcy93ZWItd29ya2VyLXNpbXVsYXRvci9wcm9jZXNzLndvcmtlci50c1wiKSkpXG5cdF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8oX193ZWJwYWNrX2V4cG9ydHNfXyk7XG5cdHJldHVybiBfX3dlYnBhY2tfZXhwb3J0c19fO1xufTtcblxuIiwidmFyIGRlZmVycmVkID0gW107XG5fX3dlYnBhY2tfcmVxdWlyZV9fLk8gPSAocmVzdWx0LCBjaHVua0lkcywgZm4sIHByaW9yaXR5KSA9PiB7XG5cdGlmKGNodW5rSWRzKSB7XG5cdFx0cHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuXHRcdGZvcih2YXIgaSA9IGRlZmVycmVkLmxlbmd0aDsgaSA+IDAgJiYgZGVmZXJyZWRbaSAtIDFdWzJdID4gcHJpb3JpdHk7IGktLSkgZGVmZXJyZWRbaV0gPSBkZWZlcnJlZFtpIC0gMV07XG5cdFx0ZGVmZXJyZWRbaV0gPSBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV07XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciBub3RGdWxmaWxsZWQgPSBJbmZpbml0eTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZC5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV0gPSBkZWZlcnJlZFtpXTtcblx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGNodW5rSWRzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRpZiAoKHByaW9yaXR5ICYgMSA9PT0gMCB8fCBub3RGdWxmaWxsZWQgPj0gcHJpb3JpdHkpICYmIE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uTykuZXZlcnkoKGtleSkgPT4gKF9fd2VicGFja19yZXF1aXJlX18uT1trZXldKGNodW5rSWRzW2pdKSkpKSB7XG5cdFx0XHRcdGNodW5rSWRzLnNwbGljZShqLS0sIDEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZnVsZmlsbGVkID0gZmFsc2U7XG5cdFx0XHRcdGlmKHByaW9yaXR5IDwgbm90RnVsZmlsbGVkKSBub3RGdWxmaWxsZWQgPSBwcmlvcml0eTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYoZnVsZmlsbGVkKSB7XG5cdFx0XHRkZWZlcnJlZC5zcGxpY2UoaS0tLCAxKVxuXHRcdFx0dmFyIHIgPSBmbigpO1xuXHRcdFx0aWYgKHIgIT09IHVuZGVmaW5lZCkgcmVzdWx0ID0gcjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5mID0ge307XG4vLyBUaGlzIGZpbGUgY29udGFpbnMgb25seSB0aGUgZW50cnkgY2h1bmsuXG4vLyBUaGUgY2h1bmsgbG9hZGluZyBmdW5jdGlvbiBmb3IgYWRkaXRpb25hbCBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18uZSA9IChjaHVua0lkKSA9PiB7XG5cdHJldHVybiBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLmYpLnJlZHVjZSgocHJvbWlzZXMsIGtleSkgPT4ge1xuXHRcdF9fd2VicGFja19yZXF1aXJlX18uZltrZXldKGNodW5rSWQsIHByb21pc2VzKTtcblx0XHRyZXR1cm4gcHJvbWlzZXM7XG5cdH0sIFtdKSk7XG59OyIsIi8vIFRoaXMgZnVuY3Rpb24gYWxsb3cgdG8gcmVmZXJlbmNlIGFzeW5jIGNodW5rcyBhbmQgc2libGluZyBjaHVua3MgZm9yIHRoZSBlbnRyeXBvaW50XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnUgPSAoY2h1bmtJZCkgPT4ge1xuXHQvLyByZXR1cm4gdXJsIGZvciBmaWxlbmFtZXMgbm90IGJhc2VkIG9uIHRlbXBsYXRlXG5cdGlmIChjaHVua0lkID09PSBcInZlbmRvcnMtbm9kZV9tb2R1bGVzX2QzLWZvcmNlX3NyY19jZW50ZXJfanMtbm9kZV9tb2R1bGVzX2QzLWZvcmNlX3NyY19jb2xsaWRlX2pzLW5vZGVfbW9kdWxlcy0wNDMyN2RcIikgcmV0dXJuIFwib3JiLndvcmtlci52ZW5kb3IuanNcIjtcblx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG5cdHJldHVybiB1bmRlZmluZWQ7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsInZhciBzY3JpcHRVcmw7XG5pZiAoX193ZWJwYWNrX3JlcXVpcmVfXy5nLmltcG9ydFNjcmlwdHMpIHNjcmlwdFVybCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5sb2NhdGlvbiArIFwiXCI7XG52YXIgZG9jdW1lbnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcuZG9jdW1lbnQ7XG5pZiAoIXNjcmlwdFVybCAmJiBkb2N1bWVudCkge1xuXHRpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdClcblx0XHRzY3JpcHRVcmwgPSBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyY1xuXHRpZiAoIXNjcmlwdFVybCkge1xuXHRcdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XG5cdFx0aWYoc2NyaXB0cy5sZW5ndGgpIHNjcmlwdFVybCA9IHNjcmlwdHNbc2NyaXB0cy5sZW5ndGggLSAxXS5zcmNcblx0fVxufVxuLy8gV2hlbiBzdXBwb3J0aW5nIGJyb3dzZXJzIHdoZXJlIGFuIGF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgeW91IG11c3Qgc3BlY2lmeSBhbiBvdXRwdXQucHVibGljUGF0aCBtYW51YWxseSB2aWEgY29uZmlndXJhdGlvblxuLy8gb3IgcGFzcyBhbiBlbXB0eSBzdHJpbmcgKFwiXCIpIGFuZCBzZXQgdGhlIF9fd2VicGFja19wdWJsaWNfcGF0aF9fIHZhcmlhYmxlIGZyb20geW91ciBjb2RlIHRvIHVzZSB5b3VyIG93biBsb2dpYy5cbmlmICghc2NyaXB0VXJsKSB0aHJvdyBuZXcgRXJyb3IoXCJBdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcbnNjcmlwdFVybCA9IHNjcmlwdFVybC5yZXBsYWNlKC8jLiokLywgXCJcIikucmVwbGFjZSgvXFw/LiokLywgXCJcIikucmVwbGFjZSgvXFwvW15cXC9dKyQvLCBcIi9cIik7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBzY3JpcHRVcmw7IiwiLy8gbm8gYmFzZVVSSVxuXG4vLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGNodW5rc1xuLy8gXCIxXCIgbWVhbnMgXCJhbHJlYWR5IGxvYWRlZFwiXG52YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuXHRcInByb2Nlc3Mud29ya2VyXCI6IDFcbn07XG5cbi8vIGltcG9ydFNjcmlwdHMgY2h1bmsgbG9hZGluZ1xudmFyIGluc3RhbGxDaHVuayA9IChkYXRhKSA9PiB7XG5cdHZhciBbY2h1bmtJZHMsIG1vcmVNb2R1bGVzLCBydW50aW1lXSA9IGRhdGE7XG5cdGZvcih2YXIgbW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8obW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuXHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcblx0XHR9XG5cdH1cblx0aWYocnVudGltZSkgcnVudGltZShfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblx0d2hpbGUoY2h1bmtJZHMubGVuZ3RoKVxuXHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkcy5wb3AoKV0gPSAxO1xuXHRwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbihkYXRhKTtcbn07XG5fX3dlYnBhY2tfcmVxdWlyZV9fLmYuaSA9IChjaHVua0lkLCBwcm9taXNlcykgPT4ge1xuXHQvLyBcIjFcIiBpcyB0aGUgc2lnbmFsIGZvciBcImFscmVhZHkgbG9hZGVkXCJcblx0aWYoIWluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuXHRcdGlmKHRydWUpIHsgLy8gYWxsIGNodW5rcyBoYXZlIEpTXG5cdFx0XHRpbXBvcnRTY3JpcHRzKF9fd2VicGFja19yZXF1aXJlX18ucCArIF9fd2VicGFja19yZXF1aXJlX18udShjaHVua0lkKSk7XG5cdFx0fVxuXHR9XG59O1xuXG52YXIgY2h1bmtMb2FkaW5nR2xvYmFsID0gc2VsZltcIndlYnBhY2tDaHVua09yYlwiXSA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtPcmJcIl0gfHwgW107XG52YXIgcGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24gPSBjaHVua0xvYWRpbmdHbG9iYWwucHVzaC5iaW5kKGNodW5rTG9hZGluZ0dsb2JhbCk7XG5jaHVua0xvYWRpbmdHbG9iYWwucHVzaCA9IGluc3RhbGxDaHVuaztcblxuLy8gbm8gSE1SXG5cbi8vIG5vIEhNUiBtYW5pZmVzdCIsInZhciBuZXh0ID0gX193ZWJwYWNrX3JlcXVpcmVfXy54O1xuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXy5lKFwidmVuZG9ycy1ub2RlX21vZHVsZXNfZDMtZm9yY2Vfc3JjX2NlbnRlcl9qcy1ub2RlX21vZHVsZXNfZDMtZm9yY2Vfc3JjX2NvbGxpZGVfanMtbm9kZV9tb2R1bGVzLTA0MzI3ZFwiKS50aGVuKG5leHQpO1xufTsiLCIiLCIvLyBydW4gc3RhcnR1cFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLngoKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==