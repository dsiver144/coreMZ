//=======================================================================
// * Plugin Name  : DSI-EventSpawner.js
// * Last Updated : 4/20/2025
//========================================================================
/*:
 * @author sirogames
 * @plugindesc (v1.6) A utility plugin to spawn events from a template map.
 * @target MZ
 * @help 
 * ========================================================================
 * > Plugin Command:
 * ========================================================================
 * > spawnPersistantEvent
 * Spawn an event from the template map that persists across maps.
 * + uniqueId: A unique ID for the event. This is used to identify the event across maps.
 * + templateEventId: The ID of the event in the template map.
 * + direction: The direction to face the event.
 * + shouldUpdate: Should the event update its position data when it moves?
 * + location: The location to spawn the event.
 *
 * > transferPersistantEvent
 * Transfer a persistant event to a new map.
 * + uniqueId: The unique ID of the event.
 * + location: The location to transfer the event to.
 * + direction: The direction to face the event.
 * 
 * > despawnPersistantEvent
 * Despawn a persistant event.
 * + uniqueId: The unique ID of the event.
 * 
 * > despawnCurrentEvent
 * Despawn the current event.
 * 
 * > spawnPersistantEventByRegionId
 * Spawn an event from the template map that persists across maps.
 * + uniqueId: A unique ID for the event. This is used to identify the event across maps.
 * + templateEventId: The ID of the event in the template map.
 * + regionId: The region ID to spawn the event in. If there are multiple regions with the 
 *   same ID, one will be chosen at random.
 * + direction: The direction to face the event.
 * + mapId: The map ID to spawn the event in.
 * + shouldUpdate: Should the event update its position data when it moves?
 * 
 * > setClonedEventSelfSwitch
 * Set the self switch of a cloned event.
 * + uniqueId: The unique ID of the event.
 * + key: The key of the self switch to set.
 * + value: The value to set the self switch to.
 * 
 * ========================================================================
 * > Script Call:
 * ========================================================================
 * 
 * EventSpawner.inst.spawnPersistantEvent(uniqueId, templateEventId, x, y, direction, mapId, shouldUpdate);
 * ex: EventSpawner.inst.spawnPersistantEvent("testNpc1", 1, 8, 23, 2, 0, true);
 * Spawn the clone of event #1 at (8, 23) on the current map with uniqueId "testNpc1".
 * 
 * EventSpawner.inst.transferPersistantEvent(uniqueId, mapId, x, y, direction);
 * ex: EventSpawner.inst.transferPersistantEvent("testNpc1", 2, 8, 23, 6);
 * Transfer the event with uniqueId "testNpc1" to mapId 2 at (8, 23) facing right.
 * 
 * EventSpawner.inst.despawnPersistantEvent(uniqueId);
 * ex: EventSpawner.inst.despawnPersistantEvent("testNpc1");
 * Remove the event with uniqueId "testNpc1" from the game.
 * 
 * this.currentEvent().despawn();
 * This will remove the current event from the game.
 * 
 * ========================================================================
 * > Event Comment
 * ========================================================================
 * You can use the following comment tag to set the self switch condition for the cloned event.
 * <page self switch: selfSwitchId>
 * This is created to extend the self switch condition for the cloned event. You can use 
 * as many self switches as you want.
 * 
 * ex: <page self switch: F>
 * You can combine with the plugin command setClonedEventSelfSwitch to set the self switch.
 * 
 * 
 * @param templateMapId:num
 * @text Event Template Map ID
 * @desc This is where the event template is stored.
 * @type number
 * @default 0
 * 
 * @command spawnPersistantEvent
 * @text Spawn Persistant Event
 * @desc Spawn an event from the template map that persists across maps.
 * 
 * @arg uniqueId:string
 * @text Unique ID
 * @desc Enter a unique ID for the event. This is used to identify the event across maps.
 * @default random
 * 
 * @arg templateEventId:num
 * @text Template Event ID
 * @desc Enter a number
 * @default 1
 * @type number
 * 
 * @arg location:location
 * @text Location
 * @desc Enter a number
 * @type location
 * 
 * @arg direction:num
 * @text Direction
 * @desc Enter a number
 * @default 2
 * @type select
 * @option Down
 * @value 2
 * @option Left
 * @value 4
 * @option Right
 * @value 6
 * @option Up
 * @value 8
 * 
 * @arg shouldUpdate:bool
 * @text Should Update Position Data 
 * @desc Should the event update its position data when it moves?
 * @type boolean
 * @default false
 * 
 * @command transferPersistantEvent
 * @text Transfer Persistant Event
 * @desc Transfer a persistant event to a new map.
 * 
 * @arg uniqueId:string
 * @text Unique ID
 * @desc Enter a unique ID for the event. This is used to identify the event across maps.
 * 
 * @arg location:location
 * @text Location
 * @desc Enter the location to transfer the event to.
 * @type location
 * 
 * @arg direction:num
 * @text Direction
 * @desc Enter a number
 * @default 2
 * @type select
 * @option Down
 * @value 2
 * @option Left
 * @value 4
 * @option Right
 * @value 6
 * @option Up
 * @value 8
 * 
 * @command despawnPersistantEvent
 * @text Despawn Persistant Event
 * @desc Despawn a persistant event.
 * 
 * @arg uniqueId:string
 * @text Unique ID
 * @desc Enter a unique ID for the event. This is used to identify the event across maps.
 * 
 * @command despawnCurrentEvent
 * @text Despawn Current Event
 * @desc Despawn the current event.
 * 
 * @command spawnPersistantEventByRegionId
 * @text Spawn Persistant Event By Region Id
 * @desc Spawn an event from the template map that persists across maps.
 * 
 * @arg uniqueId:string
 * @text Unique ID
 * @desc Enter a unique ID for the event. This is used to identify the event across maps.
 * @default random
 * 
 * @arg templateEventId:num
 * @text Template Event ID
 * @desc Enter a number
 * @type number
 * 
 * @arg regionId:num
 * @text Region ID
 * @desc Enter a number
 * @type number
 * 
 * @arg mapId:num
 * @text Map ID
 * @desc Enter a number
 * @type number
 * 
 * @arg direction:num
 * @text Direction
 * @desc Enter a number
 * @default 2
 * @type select
 * @option Down
 * @value 2
 * @option Left
 * @value 4
 * @option Right
 * @value 6
 * @option Up
 * @value 8
 * 
 * @arg shouldUpdate:bool
 * @text Should Update Position Data
 * @desc Should the event update its position data when it moves?
 * @type boolean
 * @default false
 * 
 * @command setClonedEventSelfSwitch
 * @text Set Cloned Event Self Switch
 * @desc Set the self switch of a cloned event.
 * 
 * @arg uniqueId:string
 * @text Unique ID
 * @desc Enter a unique ID for the event. This is used to identify the event across maps.
 * @default current
 * 
 * @arg key:string
 * @text Key
 * @desc Enter a string
 * @default A
 * 
 * @arg value:bool
 * @text Value
 * @desc Enter a boolean value
 * @default true
 * @type boolean
 * 
 * 
 * 
 */
//========================================================================
// Plugin Code
//========================================================================
var Imported = Imported || {};
Imported["DSI-EventSpawner"] = true;

/** @type {DSI_EventSpawnerParams} */
const EventClonerParams = PluginManager.parametersEx('DSI-EventSpawner');

if (!EventClonerParams.templateMapId) {
    throw new Error("DSI-EventSpawner.js: templateMapId param is not set. Please set it in the plugin parameters.");
}

ESL.checkForNewVersion("https://raw.githubusercontent.com/dsiver144/coreMZ/refs/heads/master/eventSpawnerVersion.txt", "https://raw.githubusercontent.com/dsiver144/coreMZ/refs/heads/master/DSI-EventSpawner.js");

/** @type {rm.types.Event[]} */
var $gameTemplateEvents = [];

ESL.registerAssetPreloader((resolve, reject) => {
    ESL.File.loadMapDataAsync(EventClonerParams.templateMapId).then((mapData) => {
        $gameTemplateEvents = mapData.events;
        resolve(mapData);
        console.log("✅ DSI-EventSpawner.js: Template Map data loaded successfully.", mapData.events);
    });
});

PluginManager.registerCommand('DSI-EventSpawner', 'spawnPersistantEvent', (args) => {
    if (EventSpawner.inst) {
        const location = args.location;
        EventSpawner.inst.spawnPersistantEvent(args.uniqueId, args.templateEventId, +location.x, +location.y, args.direction, +location.mapId, args.shouldUpdate);
    } else {
        console.error("DSI-EventSpawner.js: EventSpawner instance is not initialized.");
    }
});

PluginManager.registerCommand('DSI-EventSpawner', 'spawnPersistantEventByRegionId', (args) => {
    if (EventSpawner.inst) {
        EventSpawner.inst.spawnPersistantEventByRegionId(args.uniqueId, args.templateEventId, args.regionId, args.direction, args.mapId, args.shouldUpdate);
    } else {
        console.error("DSI-EventSpawner.js: EventSpawner instance is not initialized.");
    }
});

PluginManager.registerCommand('DSI-EventSpawner', 'transferPersistantEvent', (args) => {
    if (EventSpawner.inst) {
        const location = args.location;
        EventSpawner.inst.transferPersistantEvent(args.uniqueId, +location.mapId, +location.x, +location.y, args.direction);
    } else {
        console.error("DSI-EventSpawner.js: EventSpawner instance is not initialized.");
    }
});

PluginManager.registerCommand('DSI-EventSpawner', 'despawnPersistantEvent', (args) => {
    if (EventSpawner.inst) {
        EventSpawner.inst.despawnPersistantEvent(args.uniqueId);
    } else {
        console.error("DSI-EventSpawner.js: EventSpawner instance is not initialized.");
    }
});

PluginManager.registerCommand('DSI-EventSpawner', 'despawnCurrentEvent', function () {
    const currentEvent = this.currentEvent();
    if (!currentEvent) return;
    if (!currentEvent instanceof Game_ClonedEvent) return;
    currentEvent.despawn();
});

PluginManager.registerCommand('DSI-EventSpawner', 'setClonedEventSelfSwitch', function (args) {
    if (EventSpawner.inst) {
        const uniqueId = args.uniqueId === "current" ? this.currentEvent().getPersistanceUniqueId() : args.uniqueId;
        EventSpawner.inst.setClonedEventSelfSwitch(uniqueId, args.key, args.value);
    } else {
        console.error("DSI-EventSpawner.js: EventSpawner instance is not initialized.");
    }
});

class Game_ClonedEvent extends Game_Event {
    /**
     * Initialize
     * @param {number} mapId
     * @param {number} eventId
     * @param {number} templateEventId
     */
    initialize(mapId, eventId, templateEventId) {
        this._templateEventId = templateEventId;
        super.initialize(mapId, eventId);
    }
    /**
     * Event
     */
    event() {
        return $gameTemplateEvents[this._templateEventId];
    }
    /**
     * Despawn
     */
    despawn() {
        EventSpawner.inst.despawnPersistantEvent(this.getPersistanceUniqueId());
    }
    /**
     * Set Persistant Data
     * @param {any} data
     */
    setPersistantData(data) {
        this._persistantData = data;
        this.refresh();
    }
    /**
     * Get Persistance Unique Id
     */
    getPersistanceUniqueId() {
        if (!this._persistantData) return null;
        return this._persistantData.uniqueId;
    }
    /**
     * Update
     */
    update() {
        super.update();
        this.updatePersistantData();
    }
    /**
     * Update Persistant Data
     */
    updatePersistantData() {
        if (!this._persistantData) return;
        if (!this._persistantData.shouldUpdate) return;
        this._persistantData.x = this._x;
        this._persistantData.y = this._y;
        this._persistantData.direction = this.direction();
    }
    /**
     * Transfer Event
     * @param {number} mapId
     * @param {number} x
     * @param {number} y
     * @param {number} direction
     */
    transferEvent(mapId, x, y, direction) {
        if (!this._persistantData) return;
        this._persistantData.mapId = mapId;
        this._persistantData.x = x;
        this._persistantData.y = y;
        this._persistantData.direction = direction;
    }
    /**
     * Meets Conditions
     * @param {rm.types.EventPage} page
     */
    meetsConditions(page) {
        const c = page.conditions;
        if (!c.readPageSelfSwitch) {
            const firstCommand = page.list[0];
            if (firstCommand.code == 108 || firstCommand.code == 408) {
                if (firstCommand.parameters[0].match(/<page self switch:\s*(.+)>/i)) {
                    c.selfSwitchValid = true;
                    c.selfSwitchCh = RegExp.$1;
                    c.readPageSelfSwitch = true;
                }
            }
        }
        if (c.selfSwitchValid && c.readPageSelfSwitch) {
            if (this.getSelfSwitchState(c.selfSwitchCh)) {
                return true;
            }
        }
        return super.meetsConditions(page);
    }
    /**
     * Get Self Switch State
     * @param {string} key
     */
    getSelfSwitchState(key) {
        if (!this._persistantData) return false;
        if (!this._persistantData.selfSwitch) return false;
        return this._persistantData.selfSwitch[key] || false;
    }
    /**
     * Set Spawned
     * @param {boolean} value
     */
    setSpawned(value) {
        this._spawned = value;
    }
    /**
     * Is Spawned
     */
    isSpawned() {
        return this._spawned || false;
    }
    /**
     * Set Should Collide With Characters
     * @param {boolean} value
     */
    setShouldCollideWithCharacters(value) {
        this._shouldCollideWithCharacters = value;
    }
    /**
     * Is Movement Succeeded
     */
    isMovementSucceeded() {
        if (this._mapId != $gameMap.mapId()) {
            return true;
        } else {
            return super.isMovementSucceeded();
        }
    }
    /**
     * Is Collided With Characters
     * @param {number} x
     * @param {number} y
     */
    isCollidedWithCharacters(x, y) {
        if (this._shouldCollideWithCharacters == false) {
            return false;
        }
        return super.isCollidedWithCharacters(x, y);
    }
    /**
     * Is Near The Screen
     */
    isNearTheScreen() {
        if (this._mapId == $gameMap.mapId()) {
            return super.isNearTheScreen();
        } else {
            return true;
        }
    }

}


class EventSpawner extends ESL.Engine.GameService {
    /**
     * EventSpawner
     */
    constructor() {
        super();
        EventSpawner.inst = this;
        this.initMembers();
    }
    /**
     * On New Game
     */
    onNewGame() {
        this._gameMap = $gameMap;
    }
    /**
     * Init Members
     */
    initMembers() {
        this._persistantCustomEvents = {};
    }
    /**
     * Save Properties
     */
    saveProperties() {
        return [
            ["_persistantCustomEvents", {}],
        ]
    }
    /**
     * On Map Loaded
     */
    onMapLoaded() {
        this._gameMap = $gameMap;
        this._originalEventCount = this._gameMap._events.length;
        this.spawnAllPersistantEvents();
        console.log("DSI-EventSpawner.js: Map loaded. Spawning all persistant events.");
    }
    /**
     * On Map Exit
     */
    onMapExit() {
        this.clearAllClonedEvents();
        this.clearEventCache();
        console.log("DSI-EventSpawner.js: Map exit. Clearing all custom events.");
    }
    /**
     * Spawn Event
     * @param {number} templateEventId
     * @param {number} x
     * @param {number} y
     */
    spawnEvent(templateEventId, x, y, direction = 2) {
        const event = this.createClonedEvent(templateEventId);
        this._gameMap._events[event.eventId()] = event;
        event.locate(x, y);
        event.setDirection(direction);
        event.setSpawned(true);
        ESL.Tilemap.addCharacterSprite(event);
        this.clearEventCache();
        return event;
    }
    /**
     * Spawn Existing Event
     * @param {Game_ClonedEvent} clonedEvent
     * @param {number} x
     * @param {number} y
     * @param {number} direction
     */
    spawnExistingEvent(clonedEvent, x, y, direction) {
        if (!clonedEvent) return;
        clonedEvent.setSpawned(true);
        clonedEvent._eventId = this.generateNewEventId();
        this._gameMap._events[clonedEvent.eventId()] = clonedEvent;
        clonedEvent.locate(x, y);
        clonedEvent.setDirection(direction);
        ESL.Tilemap.addCharacterSprite(clonedEvent);
        return clonedEvent;
    }
    /**
     * Spawn Persistant Event By Region Id
     * @param {string} uniqueId
     * @param {number} templateEventId
     * @param {number} regionId
     * @param {number} direction
     * @param {number} mapId
     * @param {number} shouldUpdate
     */
    spawnPersistantEventByRegionId(uniqueId, templateEventId, regionId, direction, mapId, shouldUpdate = false) {
        const regionTable = ESL.RegionTable[mapId];
        const possiblePositions = Object.keys(regionTable).filter(pos => regionTable[pos] == regionId);
        if (possiblePositions.length == 0) {
            throw new Error("DSI-EventSpawner.js: No positions found for regionId: " + regionId);
        }
        const randomPosition = ESL.Array.randomElement(possiblePositions);
        const position = randomPosition.split("_").map(Number);
        if (this.hasPersistantEventAt(mapId, position[0], position[1])) {
            return;
        }
        this.spawnPersistantEvent(uniqueId, templateEventId, position[0], position[1], direction, mapId, shouldUpdate);
    }
    /**
     * Spawn Persistant Event
     * @param {number} templateEventId
     * @param {number} x
     * @param {number} y
     */
    spawnPersistantEvent(uniqueId, templateEventId, x, y, direction, mapId, shouldUpdate = false) {
        if (!uniqueId) {
            throw new Error("DSI-EventSpawner.js: uniqueId is required for persistant events.");
        }
        if (uniqueId === "random") {
            uniqueId = ESL.Utils.generateUUID();
            console.log("DSI-EventSpawner.js: Generated random uniqueId:", uniqueId);

        }
        const data = this.addPersistantCustomEventData(uniqueId, templateEventId, x, y, direction, mapId, shouldUpdate);
        if (!data) {
            throw new Error("DSI-EventSpawner.js: Failed to add persistant event data.");
        }
        if (data.mapId !== this._gameMap.mapId()) {
            return;
        }
        const event = this.spawnEvent(templateEventId, x, y, direction);
        event.setPersistantData(data);
    }
    /**
     * Has Persistant Event At
     * @param {number} mapId
     * @param {number} x
     * @param {number} y
     */
    hasPersistantEventAt(mapId, x, y) {
        return Object.values(this._persistantCustomEvents).some(data => data.mapId == mapId && data.x == x && data.y == y);
    }
    /**
     * Despawn Persistant Event
     * @param {string} uniqueId
     */
    despawnPersistantEvent(uniqueId) {
        if (!uniqueId) {
            throw new Error("DSI-EventSpawner.js: uniqueId is required for persistant events.");
        }
        this.removePersistantCustomEvent(uniqueId);
        const event = this._gameMap._events.find(e => e instanceof Game_ClonedEvent && e.getPersistanceUniqueId() === uniqueId);
        if (event) {
            this.despawnEvent(event);
        }
    }
    /**
     * Transfer Persistant Event
     * @param {string} uniqueId
     * @param {number} mapId
     * @param {number} x
     * @param {number} y
     * @param {number} direction
     */
    transferPersistantEvent(uniqueId, mapId, x, y, direction) {
        if (!uniqueId) {
            throw new Error("DSI-EventSpawner.js: uniqueId is required for persistant events.");
        }
        const eventData = this._persistantCustomEvents[uniqueId];
        if (!eventData) {
            throw new Error("DSI-EventSpawner.js: Failed to find persistant event data for uniqueId: " + uniqueId);
        }
        const lastMapId = eventData.mapId;

        eventData.mapId = mapId;
        eventData.x = x;
        eventData.y = y;
        eventData.direction = direction;

        const currentMapId = this._gameMap.mapId();
        if (currentMapId == mapId) {
            if (mapId != lastMapId) {
                // Spawn the event to current map
                const event = this.spawnEvent(eventData.templateEventId, x, y, direction);
                event.setPersistantData(eventData);
            } else {
                // Re locate the event on current map
                const event = this._gameMap._events.find(e => e instanceof Game_ClonedEvent && e.getPersistanceUniqueId() === uniqueId);
                if (event) {
                    event.locate(x, y);
                    event.setDirection(direction);
                    event.setPersistantData(eventData);
                }
            }
        } else {
            if (lastMapId == currentMapId) {
                // Despawn the event from current map
                const event = this._gameMap._events.find(e => e instanceof Game_ClonedEvent && e.getPersistanceUniqueId() === uniqueId);
                if (event) {
                    this.despawnEvent(event);
                }
            }
        }
    }
    /**
     * Spawn All Persistant Events
     */
    spawnAllPersistantEvents() {
        const eventDatas = this._persistantCustomEvents;
        for (const uniqueId in eventDatas) {
            const data = eventDatas[uniqueId];
            if (!data) continue;
            if (data.mapId !== this._gameMap.mapId()) continue;
            const event = this.spawnEvent(data.templateEventId, data.x, data.y, data.direction);
            event.setPersistantData(data);
        }
    }
    /**
     * Despawn Event
     * @param {number} eventId
     */
    despawnEventById(eventId) {
        const event = this._gameMap._events[eventId];
        this.despawnEvent(event);
    }
    /**
     * Despawn Event
     * @param {Game_ClonedEvent} event
     */
    despawnEvent(event) {
        if (event && event instanceof Game_ClonedEvent) {
            event.setSpawned(false);
            this._gameMap._events[event.eventId()] = null;
            ESL.Tilemap.removeCharacterSprite(event);
        }
        this.clearEventCache();
    }
    /**
     * Create Cloned Event
     * @param {number} templateEventId
     */
    createClonedEvent(templateEventId) {
        const newEventId = this.generateNewEventId();
        const event = new Game_ClonedEvent(this._gameMap.mapId(), newEventId, templateEventId);
        return event;
    }
    /**
     * Clear All Cloned Events
     */
    clearAllClonedEvents() {
        $gameTemp._customEvents = [];
        for (const event of this._gameMap._events) {
            if (event instanceof Game_ClonedEvent) {
                this.despawnEvent(event);
            }
        }
    }
    /**
     * Generate New Event Id
     */
    generateNewEventId() {
        let eventId = 1;
        while (this._gameMap._events[eventId]) {
            eventId++;
        }
        return eventId;
    }
    /**
     * Add Persistant Custom Event Data
     * @param {string} uniqueId
     * @param {number} templateEventId
     * @param {number} x
     * @param {number} y
     * @param {number} direction
     * @param {number} mapId
     * @param {boolean} shouldUpdate
     */
    addPersistantCustomEventData(uniqueId, templateEventId, x, y, direction, mapId, shouldUpdate = false) {
        if (!uniqueId) {
            throw new Error("DSI-EventSpawner.js: uniqueId is required for persistant events.");
        }
        if (this._persistantCustomEvents[uniqueId]) {
            throw new Error("DSI-EventSpawner.js: uniqueId already exists. Please use a different uniqueId.");
        }
        var data = {
            templateEventId: templateEventId,
            mapId: mapId,
            x: x,
            y: y,
            direction: direction,
            uniqueId: uniqueId,
            shouldUpdate: shouldUpdate,
            selfSwitch: {},
        }
        this._persistantCustomEvents[uniqueId] = data;
        return data;
    }
    /**
     * Remove Persistant Custom Event
     * @param {string} uniqueId
     */
    removePersistantCustomEvent(uniqueId) {
        if (!uniqueId) {
            throw new Error("DSI-EventSpawner.js: uniqueId is required for persistant events.");
        }
        if (this._persistantCustomEvents[uniqueId]) {
            delete this._persistantCustomEvents[uniqueId];
        } else {
            console.warn("DSI-EventSpawner.js: No persistant event found with uniqueId:", uniqueId);
        }
    }
    /**
     * Set Cloned Event Self Switch
     * @param {string} uniqueId
     * @param {string} key
     * @param {boolean} value
     */
    setClonedEventSelfSwitch(uniqueId, key, value) {
        const data = this._persistantCustomEvents[uniqueId];
        if (!data) {
            console.warn("DSI-EventSpawner.js: No persistant event found with uniqueId:", uniqueId);
            return;
        }
        data.selfSwitch[key] = value;
        const event = this._gameMap._events.find(e => e instanceof Game_ClonedEvent && e.getPersistanceUniqueId() === uniqueId);
        if (event) {
            event.refresh();
        }
    }
	/**
     * Clear Event Cache
     * This is used to clear the event cache when spawn new events.
     * Compatibility fix for VisuMZ_1_EventsMoveCore
     */
    clearEventCache() {
        if ($gameMap.clearEventCache && typeof $gameMap.clearEventCache === "function") {
            $gameMap.clearEventCache();
        }
        if ($gameMap.clearEventMapCache && typeof $gameMap.clearEventMapCache === "function") {
            $gameMap.clearEventMapCache();
        }
    }
}
/** @type {EventSpawner} */
EventSpawner.inst = null;

ESL.addGameService("EventSpawner", EventSpawner);

//========================================================================
// Basic Structs
//========================================================================
/*~struct~PositionObject:
 * @param x:num
 * @text x
 * @desc X position
 *
 * @param y:num
 * @text y
 * @desc Y Position
 *
 */
//========================================================================
// END OF PLUGIN
//========================================================================