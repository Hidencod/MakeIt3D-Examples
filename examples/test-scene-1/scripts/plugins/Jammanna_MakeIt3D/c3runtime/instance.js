const C3 = globalThis.C3;

// Update the DOM_COMPONENT_ID to be unique to your plugin.
// It must match the value set in domSide.js as well.
const DOM_COMPONENT_ID = "Jammanna_MakeIt3D";

C3.Plugins.Jammanna_MakeIt3D.Instance = class DOMMessagingInstance extends globalThis.ISDKInstanceBase {
	constructor() {
		// Note that DOM_COMPONENT_ID must be passed to the base class as an additional parameter.
		super({ domComponentId: DOM_COMPONENT_ID });

		// The document title is not directly accessible in a worker. Therefore keep a copy of the
		// current document title on the runtime side so it can be returned from an expression.
		this._documentTitle = "";
		this._msg = "Hello";
		this._isThreeJsLoaded = false;
		this._lastAddedObjectId = "";
		this._lastAnimationFinished = {
			objectId: "",
			name: "",
			index: -1
		};
		this._object_three_property = {
			"x":0,
			"y":0,
			"y":0
		};
		this.Mouse = {
			"x":0,
			"y":0
		}
		this.Touch = {
			"x": 0,
			"y": 0
		}
		this._raycastHits = [];
		this.latestRaycastHit = {
			objectId:  "objectId",
			point: null,
			distance: 0,
			uv:  null,
			faceIndex:  0,
			updated: false,
			normal: null
		};
		this._x=0;
		// Initialize object cache
		this._objectCache = {};
		this._currentForeachIndex = 0;
		this._currentObject = 
		{
			position:{ x: 0, y: 0, z: 0 },
			rotation:{ x: 0, y: 0, z: 0 },
			scale:{ x: 1, y: 1, z: 1 },
			color: 0x00ff00,
			visible: true,
			type: "",
			tag:  "",
			animations: []
		};
		
		// Initialise object properties
		this._testProperty = 0;
		this._autoLoadLibraries = true; // Default to true for backward compatibility
		this._last_error_msg="";
		const properties = this._getInitProperties();
		if (properties) { // note properties may be null in some cases
			this._testProperty = properties[0];
			this._autoLoadLibraries = properties[1] !== undefined ? properties[1] : true;
		}

		// Post to the DOM to retrieve the initial state
		this.runtime.sdk.addLoadPromise(
			this._postToDOMAsync("get-initial-state")
				.then(data => {
					this._documentTitle = data["document-title"];
					
					// Auto-load libraries if enabled
					if (this._autoLoadLibraries) {
						this._LoadThreeJsLibraries();
					}
				})
		);
		
		//this comes from DOM domSide.js
		
		// this._addDOMMessageHandler("on-threejs-load-status", async (data) => {
		// 	this._onThreeJsLoaded(data);
		// });
		
		this._addDOMMessageHandler("on-scene-create-status", async (data) => {
			this._onSceneCreateStatus(data);
		});
		
		 this._addDOMMessageHandler("on-object-added", async (data) => {
			this._onObjectAdded(data)
		 });
		this._addDOMMessageHandler("property-result", async (data) => {
			this._getPropertyX(data)
		});
		this._addDOMMessageHandler("on-animation-finished", async (data) => {
			this._OnAnimationFinished(data)
		});
		this._addDOMMessageHandler("on-animation-loop-finished", async (data) => {
			this._OnAnimationLoopFinished(data)
		});
		this._addDOMMessageHandler("set-object-material", async (data) => {
			this._onSetObjectMaterial(data);
		});
		
		// Set up periodic cache update
		//this._setupCacheUpdate();
		// console.log(this.runtime.platformInfo)
		// 	console.log(this.runtime.getHTMLLayer(0))
		
		
		
	}
	
	_setupCacheUpdate() {
		// Update cache every 250ms instead of 100ms
		this._cacheUpdateInterval = setInterval(async () => {
			// Only update if there are objects in the cache
			if (Object.keys(this._objectCache).length > 0) {
				await this._updatePropertyCache();
			}
		}, 1);
	}

	async _updatePropertyCache() {
		try {
			// Get all object IDs from the cache
			const objectIds = Object.keys(this._objectCache);
			
			// Update properties for each object
			for (const objectId of objectIds) {
				// Only update if the object is visible
				if (this._objectCache[objectId].visible) {
					// Batch all property requests into a single DOM call
					const properties = await this._postToDOMAsync("get-object-properties", {
						objectId,
						properties: ["position", "rotation", "scale", "color", "visible", "type", "tag"]
					});

					if (properties) {
						// Only update if values have changed
						const currentCache = this._objectCache[objectId];
						const newValues = {
							position: properties.position || currentCache.position,
							rotation: properties.rotation || currentCache.rotation,
							scale: properties.scale || currentCache.scale,
							color: properties.color || currentCache.color,
							visible: properties.visible !== undefined ? properties.visible : currentCache.visible,
							type: properties.type || currentCache.type,
							tag: properties.tag || currentCache.tag
						};

						// Check if any values actually changed
						if (JSON.stringify(currentCache) !== JSON.stringify(newValues)) {
							this._objectCache[objectId] = newValues;
						}
					}
				}
			}
		} catch (error) {
			console.error("Error updating property cache:", error);
		}
	}

	_release() {
		super._release();
		// Clear any intervals when instance is released
		if (this._cacheUpdateInterval) {
			clearInterval(this._cacheUpdateInterval);
		}
	}
	// Called when Three.js successfully loads
	_onThreeJsLoaded(response) {
		console.log("Three js loaded ====================",response);
		if (response.success) {
			this._isThreeJsLoaded = true;
			
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnThreeJsLoad);
		} else {
			this._isThreeJsLoaded = false;
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnThreeJsLoadFail);
		}
	}
	async _onCheckThreeJsLoaded()
	{
		// Always check with DOM side to ensure accurate loading state
		this._postToDOMAsync("load-threejs-libraries")
			.then(response => {
				this._onThreeJsLoaded(response);
				return true;
			})
			.catch(error => {
				console.error("Error checking Three.js loading status:", error);
				
				this._isThreeJsLoaded = false;
				this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnThreeJsLoadFail);
				return false;
			});
	}
	_onSceneCreateStatus(success) {
		if(success)
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnSceneCreated);
		else
		this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnSceneCreateFail);
	}
	_setCameraPosition(e)
	{
		this._postToDOMAsync("set-camera-position", {
			x: e.x,
			y: e.y,
			z: e.z
		})
		.then(response => {
			if (response && response.success) {
				//console.log("Camera position set successfully:", response.position);
			} else {
				console.error("Failed to set camera position:", response?.error);
			}
		})
		.catch(error => {
			console.error("Error setting camera position:", error);
		});
	}
	_setCameraAngle(e) {
		this._postToDOMAsync("set-camera-angle", {
			x: e.x,
			y: e.y,
			z: e.z
		})
			.then(response => {
				if (response && response.success) {
					//console.log("Camera position set successfully:", response.position);
				} else {
					console.error("Failed to set camera position:", response?.error);
				}
			})
			.catch(error => {
				console.error("Error setting camera position:", error);
			});
	}
	_setCameraLookAt(e)
	{
		this._postToDOM("set-camera-lookat", {
			x: e.x,
			y: e.y,
			z: e.z
		})
	}
	_setCameraLookAtObject(e) {
		this._postToDOM("set-camera-lookat-object", e)
	}
	_setCameraFollowObject(e) {
		this._postToDOM("set-camera-follow-object", e)
	}
	_setCameraTranslation(e)
	{
		this._postToDOM("set-camera-translation", e)
	}
	_updateRenderLoop(e)
	{
		this._postToDOM("update-render-loop", {
			deltaTime: e.dt
		})
	}
	_addPrimitiveAtPosition(e)
	{
		console.log("e=============",e)
		this._postToDOMAsync("add-primitive-at-position",e).then(response => {
			//console.log("Responeeee==============",response)
				this._onObjectAdded(response);
				return true;
			})
			.catch(error => {
				console.error("Error checking Three.js loading status:", error);
			});
	}
	_addLightAtPosition(e)
	{
		console.log("e=============",e)
		this._postToDOMAsync("add-light-at-position", {
			e
		}).then(response => {
				this._onObjectAdded(response);
				return true;
			})
			.catch(error => {
				console.error("Error checking Three.js loading status:", error);
			});
	}
	_onObjectAdded(data) {
		// Check if there was an error
		if (!data.success) {
			this._last_error_msg = data.error
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnObjectCreationFailed);
			return;
		}

		// Store the object ID for the condition
		this._lastAddedObjectId = data.objectId;
		console.log("Stored lastAddedObjectId:", this._lastAddedObjectId);
		
		// Add object to cache
		this._objectCache[data.objectId] = {
			position: data.position || { x: 0, y: 0, z: 0 },
			rotation: data.rotation || { x: 0, y: 0, z: 0 },
			scale: data.scale || { x: 1, y: 1, z: 1 },
			color: 0x00ff00,
			visible: true,
			type: "",
			tag: data.tag || "",
			animations: data.animations || []
		};
		console.log("Added object to cache:", data.objectId);
		console.log("Current cache state:", data.animations);
		
		// Trigger the condition with the object ID
		this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnObjectAdded, data.objectId);
	}
	async _LoadCustomModel(objectId,path,position,rotation,scale,visible)
	{
		await this._postToDOMAsync("load-model-from-path", {
			objectId: objectId,
			path: path,
			position: position || { x: 0, y: 0, z: 0 },
			rotation: rotation || { x: 0, y: 0, z: 0 },
			scale: scale || { x: 0.5, y: 0.5, z: 0.5 },
			visible:visible
		})
		.then(response => {
			console.log("Model loaded successfully:", response);
			this._onObjectAdded(response);
		})
		.catch(error => {
		
		});
	}
	_getPropertyX(property) {
		this._object_three_property.x = property.value.x;
		this._object_three_property.y = property.value.y;
		this._object_three_property.z = property.value.z;
		this._x = this._object_three_property.x;
		console.log("heyyyy")
		console.log(this._object_three_property)
	}
	_LoadThreeJsLibraries()
	{
		this._postToDOM("load-threejs-libraries")
	}
	// Method to manually initialize Three.js
	async _OnCreateScene(e)
	{
		//this.runtime.isInWorker = false;
		console.log(this.runtime)
		var isWorkerMode = this.runtime.isInWorker;

		// Validate layer index first
		const totalLayers = this.runtime.layout.getAllLayers();
		if (e.layerIndex < 0 || e.layerIndex >= totalLayers) {
			console.error(`Invalid layer index: ${e.layerIndex}. Available layers: 0-${totalLayers - 1}`);
			return;
		}

		// Set HTML layer flag BEFORE accessing
		for (let i = 0; i < this.runtime.layout.getAllLayers().length; i++) {
			this.runtime.layout.getLayer(i).isHTMLElementsLayer = false;
		}
		this.runtime.layout.getLayer(e.layerIndex).isHTMLElementsLayer = true;

		var containerId = "";
		if (!isWorkerMode) {
			try {
				const container = this.runtime.getHTMLLayer(0);
				containerId = container.className;
				//console.log("Container ID:", containerId);
			} catch (error) {
				console.error("Error getting HTML layer:", error);
				this._onThreeJsError(error);
				return;
			}
		}
		console.log(this.runtime)
		await this._postToDOMAsync("create-threejs-scene", {
			layerIndex: e.layerIndex,
			isWorkerMode: isWorkerMode,
			containerId: containerId,
			canvasWidth: this.runtime.platformInfo.canvasCssWidth,
			canvasHeight: this.runtime.platformInfo.canvasCssHeight,
			devicePixelRatio: this.runtime.platformInfo.devicePixelRatio,
			addbasiclighting:e.addbasiclighting,
			usePostprocessing:e.usePostprocessing,
			isAxesHelperEnabled:e.isAxesHelperEnabled,
			isGridHelperEnabled:e.isGridHelperEnabled,
			isLoadFromJson:e.isLoadFromJson,
			useSceneCamera:e.useSceneCamera,
			isOrbitControlsEnabled: e.isOrbitControlsEnabled,
			viewportWidth: this.runtime.viewportWidth,
			viewportHeight: this.runtime.viewportHeight,
			path:e.path
		})
		.then(() => {
			console.log("Three.js initialization message sent successfully");
		})
		.catch(error => {
			console.error("Error sending Three.js initialization message:", error);
			this._onThreeJsError(error);
		});
	}
	_launchSceneEditor()
	{
		this._postToDOMAsync("launch-scene-editor")
			.then(response => {
				console.log("scene editor launched", response);
			})
			.catch(error => {
				console.error("Error launching scene editor:", error);
			});
	}
	_GetAllAnimationNamesArray(objectId) {
		const anims = this._objectCache[objectId]?.animations;
		
		if (!anims || anims.length === 0)
			return [];
		
		return anims.map((anim, index) => `${index}: ${anim.name}`);
	}
	_GetAnimationCount(objectId) {
		const anims = this._objectCache[objectId]?.animations;
		return anims ? anims.length : 0;
	}
	_GetAnimationDuration(objectId, index_or_name) {
		const anims = this._objectCache[objectId]?.animations;

		if (!anims || anims.length === 0) {
			console.warn(`No animations found for object: ${objectId}`);
			return null;
		}

		let animation = null;

		if (typeof index_or_name === "string") {
			// Search by name
			animation = anims.find(anim => anim.name === index_or_name);
		} else if (typeof index_or_name === "number" && !isNaN(index_or_name)) {
			// Get by index
			if (index_or_name >= 0 && index_or_name < anims.length) {
				animation = anims[index_or_name];
			} else {
				console.warn(`Animation index out of range: ${index_or_name}`);
			}
		} else {
			console.warn("Invalid input for index_or_name:", index_or_name);
		}

		if (!animation) {
			console.warn(`Animation not found for object: ${objectId}, input: ${index_or_name}`);
			return null;
		}

		// console.log(`Duration of animation "${animation.name}":`, animation.duration);
		return animation.duration;
	}

	// Add play animation action
	_PlayAnimation(objectId, animationIndex_Name,fadeDuration, loop, timeScale = 1.0, clampWhenFinished) {

		if (!objectId) {
			console.error("PlayAnimation: objectId is required");
			return;
		}

		// Convert loop and clampWhenFinished from 0/1 to boolean
		const loopValue = loop;
		const clampValue = clampWhenFinished ;

		// Choose name or index
		const isIndex = !isNaN(Number(animationIndex_Name));
		const payload = {
			objectId: objectId,
			loop: loopValue,
			timeScale: typeof timeScale === "number" ? timeScale : 1.0,
			clampWhenFinished: clampValue,
			fadeDuration:fadeDuration
		};

		if (isIndex) {
			payload.animationIndex_Name = parseInt(animationIndex_Name);
		} else if (typeof animationIndex_Name === "string" && animationIndex_Name.length > 0) {
			payload.animationIndex_Name = animationIndex_Name;
		} else {
			console.warn("PlayAnimation: no valid animationIndex or animationName provided – using default (index 0)");
			payload.animationIndex = 0;
		}

		// Send play animation request to DOM side
		this._postToDOMAsync("play-animation", payload)
			.then(response => {
				//console.log("Animation play message sent successfully:", response);
			})
			.catch(error => {
				console.error("Error sending animation play message:", error);
			});
	}
	_blendAnimations(e)
	{
		this._postToDOM("blend-animations", e)
	}
	_transitionAnimation(e)
	{
		this._postToDOM("transition-animations", e)
	}
	_setObjectLookAt(e)
	{
		this._postToDOM("set-object-look-at", e)
	}
	_PauseAnimation(objectId) {

		this._postToDOMAsync("pause-animation", {
			objectId: objectId
		})
		.then(() => {
			console.log("Animation pause message sent successfully");
		})
		.catch(error => {
			console.error("Error sending animation pause message:", error);
		});
	}
	_ResumeAnimation(objectId) {


		this._postToDOMAsync("resume-animation", {
			objectId: objectId
		})
		.then(() => {
			console.log("Animation resume message sent successfully");
		})
		.catch(error => {
			console.error("Error sending animation resume message:", error);
		});
	}

	_StopAnimation(objectId) {


		this._postToDOMAsync("stop-animation", {
			objectId: objectId
		})
		.then(() => {
			console.log("Animation stop message sent successfully");
		})
		.catch(error => {
			console.error("Error sending animation stop message:", error);
		});
	}
	_OnAnimationFinished(data) {
		console.log("Animation finished for object:", data.objectId, "animation:", data.animationName);
		this._lastAnimationFinished.objectId = data.objectId;
		this._lastAnimationFinished.name = data.animationName;
		this._lastAnimationFinished.index = data.animationIndex;
		console.log("Hey",this._lastAnimationFinished);
		this._trigger(
			C3.Plugins.Jammanna_MakeIt3D.Cnds.OnAnimationClipFinished,
			data.objectId,
			typeof data.animationName === "string" ? data.animationName : data.animationIndex
		);	
	}
	_OnAnimationLoopFinished(data) {
		console.log("Animation finished for object:", data);
		this._lastAnimationFinished.objectId = data.objectId;
		this._lastAnimationFinished.name = data.animationName;
		this._lastAnimationFinished.index = data.animationIndex;
		
		// Trigger the condition with the object ID and animation name
		this._trigger(
			C3.Plugins.Jammanna_MakeIt3D.Cnds.OnAnimationLoopFinished,
			data.objectId,
			typeof data.animationName === "string" ? data.animationName : data.animationIndex
		);
	}
	// Method to add test cube
	addTestCube() {


		this._postToDOMAsync("add-test-cube");
	}


	_setTestProperty(n) {
		this._testProperty = n;
	}

	_getTestProperty() {
		return this._testProperty;
	}

	// Getter to check if Three.js is loaded
	isThreeJsLoaded() {
		return this._isThreeJsLoaded;
	}

	_saveToJson() {
		return {
			// data to be saved for savegames
			testProperty: this._testProperty,
			isThreeJsLoaded: this._isThreeJsLoaded,
			objectCache: this._objectCache,
			autoLoadLibraries: this._autoLoadLibraries
		};
	}

	_loadFromJson(o) {
		// load state for savegames
		if (o.testProperty !== undefined) {
			this._testProperty = o.testProperty;
		}
		if (o.isThreeJsLoaded !== undefined) {
			this._isThreeJsLoaded = o.isThreeJsLoaded;
		}
		if (o.objectCache !== undefined) {
			this._objectCache = o.objectCache;
		}
		if (o.autoLoadLibraries !== undefined) {
			this._autoLoadLibraries = o.autoLoadLibraries;
		}
	}

	// Add getter and setter for auto load libraries property
	_getAutoLoadLibraries() {
		return this._autoLoadLibraries;
	}

	_setAutoLoadLibraries(value) {
		this._autoLoadLibraries = value;
	}
	_setObjectProperty(e) {
	
		if (!e.objectId) {
			console.error("SetObjectProperty: objectId is required");
			return;
		}
		if (!e.property) {
			console.error("SetObjectProperty: propertyName is required");
			return;
		}
		if (e.value === undefined || e.value === null) {
			console.error("SetObjectProperty: value is required and cannot be null or undefined");
			return;
		}
		//console.log("Setting object property:", e.property, "to value:", e.value, "for object:", e.objectId);
		this._postToDOM("set-object-property", {
			objectId: e.objectId,
			property: e.property,
			value: e.value,
			lerpFactor:e.lerp
			
		})
		this.updateObjectCashedProperty(e.objectId, e.property, e.value)
	}
	updateObjectCashedProperty(objectId, property, value)
	{
		switch (property.toLowerCase()) {
			case 'position':
				this._objectCache[objectId].position = {
					x: value.x !== undefined ? value.x : this._objectCache[objectId].position.x,
					y: value.y !== undefined ? value.y : this._objectCache[objectId].position.y,
					z: value.z !== undefined ? value.z : this._objectCache[objectId].position.z
				};
				break;

			case 'translation':
				if (typeof value === 'object' && value !== null) {
					const cachedPos = this._objectCache[objectId].position;
					cachedPos.x += value.x || 0;
					cachedPos.y += value.y || 0;
					cachedPos.z += value.z || 0;
				}
				break;

			case 'positionx':
			case 'position_x':
				if (typeof value === 'number') {
					this._objectCache[objectId].position.x = value;
				}
				break;

			case 'positiony':
			case 'position_y':
				if (typeof value === 'number') {
					this._objectCache[objectId].position.y = value;
				}
				break;

			case 'positionz':
			case 'position_z':
				if (typeof value === 'number') {
					this._objectCache[objectId].position.z = value;
				}
				break;

			case 'rotation':
				if (typeof value === 'object' && value !== null) {
					this._objectCache[objectId].rotation = {
						x: value.x !== undefined ? value.x : this._objectCache[objectId].rotation.x,
						y: value.y !== undefined ? value.y : this._objectCache[objectId].rotation.y,
						z: value.z !== undefined ? value.z : this._objectCache[objectId].rotation.z
					};
				}
				break;

			case 'rotationx':
			case 'rotation_x':
				if (typeof value === 'number') {
					this._objectCache[objectId].rotation.x = value? value : this._objectCache[objectId].rotation.x;
				}
				break;

			case 'rotationy':
			case 'rotation_y':
				if (typeof value === 'number') {
					this._objectCache[objectId].rotation.y = value ? value : this._objectCache[objectId].rotation.y;
					console.log("rotation y set to", value, "for object", objectId);
				}
				break;

			case 'rotationz':
			case 'rotation_z':
				if (typeof value === 'number') {
					this._objectCache[objectId].rotation.z = value ? value : this._objectCache[objectId].rotation.z;
				}
				break;

			case 'scale':
				if (typeof value === 'object' && value !== null) {
					this._objectCache[objectId].scale = {
						x: Math.max(0.001, value.x !== undefined ? value.x : this._objectCache[objectId].scale.x),
						y: Math.max(0.001, value.y !== undefined ? value.y : this._objectCache[objectId].scale.y),
						z: Math.max(0.001, value.z !== undefined ? value.z : this._objectCache[objectId].scale.z)
					};
				}
				break;

			case 'scalex':
			case 'scale_x':
				if (typeof value === 'number') {
					this._objectCache[objectId].scale.x = Math.max(0.001, value);
				}
				break;

			case 'scaley':
			case 'scale_y':
				if (typeof value === 'number') {
					this._objectCache[objectId].scale.y = Math.max(0.001, value);
				}
				break;

			case 'scalez':
			case 'scale_z':
				if (typeof value === 'number') {
					this._objectCache[objectId].scale.z = Math.max(0.001, value);
				}
				break;

			case 'color':
				this._objectCache[objectId].color = value;
				break;

			case 'visible':
				this._objectCache[objectId].visible = Boolean(value);
				break;

			case 'tag':
				this._objectCache[objectId].tag = value;
				break;

			// Add other properties as needed
		}

	}
	_onSetObjectMaterial(data) {
		if (data.success) {
			console.log("Material applied successfully to object:", data.objectId);
		} else {
			console.error("Failed to apply material:", data.error);
		}
	}

	// Method to set material on an object
	_SetObjectMaterial(objectId, config) {
		console.log("Setting object material:", config, "for object:", objectId);
		this._postToDOMAsync("set-object-material", {
			objectId,
			...config
		}).then(response => {
			console.log("SetObjectMaterial response:", response);
		}).catch(error => {
			console.error("Error setting object material:", error);
		});
	}

	// Method to set object visibility
	_SetObjectVisible(objectId, visible) {
		this._postToDOMAsync("set-object-visible", {
			objectId,
			visible
		}).then(response => {
			console.log("SetObjectVisible response:", response);
		}).catch(error => {
			console.error("Error setting object visibility:", error);
		});
	}

	_SetCustomShaderMaterial(objectId, config) {
		console.log("Setting custom shader material for object:", objectId, "with config:", config);
		this._postToDOMAsync("set-custom-shader-material", {
			objectId,
			...config
		}).then(response => {
			console.log("SetCustomShaderMaterial response:", response);
		}).catch(error => {
			console.error("Error setting custom shader material:", error);
		});
	}

	_SetShaderUniform(objectId, name, value) {
		this._postToDOMAsync("set-shader-uniform", {
			objectId,
			name,
			value
		}).then(response => {
			console.log("SetShaderUniform response:", response);
		}).catch(error => {
			console.error("Error setting shader uniform:", error);
		});
	}
	async _setTexture(config) {
		try {
			const response = await this._postToDOMAsync("set-texture", {
				objectId: config.objectId,
				path: config.path
			});
			console.log("SetTexture response:", response);
		} catch (error) {
			console.error("Error setting texture:", error);
		}
	}

	_setTextureWrap(objectId, wrapS = "repeat", wrapT = "repeat") {
		this._postToDOMAsync("set-texture-wrap", {
			objectId,
			wrapS,
			wrapT
		}).then(response => {
			console.log("SetTextureWrap response:", response);
		}).catch(error => {
			console.error("Error setting texture wrap:", error);
		});
	}
	_setTextureRepeat(objectId, x = 1, y = 1) {
		this._postToDOMAsync("set-texture-repeat", {
			objectId,
			x,
			y
		}).then(response => {
			console.log("SetTextureRepeat response:", response);
		}).catch(error => {
			console.error("Error setting texture repeat:", error);
		});
	}
	_setTextureOpacity(objectId, value = 1.0) {
		this._postToDOMAsync("set-texture-opacity", {
			objectId,
			value
		}).then(response => {
			console.log("SetTextureOpacity response:", response);
		}).catch(error => {
			console.error("Error setting texture opacity:", error);
		});
	}
	_setEmissiveMap(objectId, path, emissiveIntensity) {
		this._postToDOMAsync("set-emissive-map", {
			objectId,
			path,
			emissiveIntensity
		}).then(response => {
			console.log("SetEmissiveMap response:", response);
		}).catch(error => {
			console.error("Error setting emissive map:", error);
		});
	}
	_setNormalMap(objectId, path,strength) {
		this._postToDOMAsync("set-normal-map", {
			objectId,
			path,
			strength
		}).then(response => {
			console.log("SetNormalMap response:", response);
		}).catch(error => {
			console.error("Error setting normal map:", error);
		});
	}
	_setRoughnessMap(objectId, path) {
		this._postToDOMAsync("set-roughness-map", {
			objectId,
			path
		}).then(response => {
			console.log("SetRoughnessMap response:", response);
		}).catch(error => {
			console.error("Error setting roughness map:", error);
		});
	}
	_setMetalnessMap(objectId, url) {
		this._postToDOMAsync("set-metalness-map", {
			objectId,
			url
		}).then(response => {
			console.log("SetMetalnessMap response:", response);
		}).catch(error => {
			console.error("Error setting metalness map:", error);
		});
	}
	_setColor(objectId, color)
	{
		this._postToDOMAsync("set-color", {
			objectId,color
		}).then(response => {
			console.log("Set color  response:", response);
		}).catch(error => {
			console.error("Error setting color:", error);
		});
	}
	_disposeTexture(objectId) {
		this._postToDOMAsync("texture-unload", {
			objectId
		}).then(response => {
			console.log("Texture unload response:", response);
		}).catch(error => {
			console.error("Error unloading texture:", error);
		});
	}
	_setVideoTexture(objectId, path,loop = false,  autoplay = true, muted = true) {
		this._postToDOMAsync("set-video-texture", {
			objectId,
			path,
			loop,
			autoplay,
			muted
		}).then(response => {
			console.log("Texture unload response:", response);
		}).catch(error => {
			console.error("Error unloading texture:", error);
		});
	}
	_enablePixelatedEdgeEffect(pixelvalue, normalEdgeStrength, depthEdgeStrength,controls)
	{
		this._postToDOMAsync("enable-pixelated-edge-pass", {
			pixelvalue:pixelvalue,
			normalEdgeStrength,
			depthEdgeStrength,
			controls:controls
		}).then(response => {
			console.log("Pixel post process enabled:", response);
		}).catch(error => {
			console.error("Error on enable pixel postprocess:", error);
		});
	}

	_disablePixelPass()
	{
		this._postToDOMAsync("desable-pixelated-edge-pass", {
			
		}).then(response => {
			
		}).catch(error => {
		});
	}
	_enableBloomPass(strength,radius,threshold,controls)
	{
		this._postToDOMAsync("enable-bloom-pass", {
			strength:strength,
			radius:radius,
			threshold:threshold,
			controls:controls
		}).then(response => {
			console.log("bloom post process enabled:", response);
		}).catch(error => {
			console.error("Error on enable bloom postprocess:", error);
		});
	}
	_disableBloomPass()
	{
		this._postToDOMAsync("disable-bloom-pass", {
		}).then(response => {
			
		}).catch(error => {

		});
	}
	_enableFXAA()
	{
		this._postToDOMAsync("enable-fxaa-pass", {
		}).then(response => {
			console.log("fxaa post process enabled:", response);
		}).catch(error => {
			console.log(" error on fxaa post process:", response);
		});
	}
	_disableFXAA()
	{
		this._postToDOMAsync("disable-fxaa-pass", {
		}).then(response => {
			
		}).catch(error => {

		});
	}
	_enableOutlinePass(selectedObjects,edgeStrength,color,texture,controls)
	{
		this._postToDOMAsync("enable-outline-pass", {
			selectedObjects:selectedObjects,
			edgeStrength:edgeStrength,
			color:color,
			texture:texture,
			controls:controls
		}).then(response => {
			console.log("outline post process enabled:", response);
		}).catch(error => {
			console.log(" error on outline post process:", response);
		});
	}
	_disableOutlinePass()
	{
		this._postToDOMAsync("disable-outline-pass", {
		}).then(response => {
			
		}).catch(error => {

		});
	}
	
	
	_enableRGBShift(angle,amount,controls)
	{
		this._postToDOMAsync("enable-rgbshift-pass", {
			angle:angle,
			amount:amount,
			controls:controls
		}).then(response => {
			console.log(response)
		}).catch(error => {
			console.log(error)
		});
	}
	_disableRGBShiftPass() {
		this._postToDOMAsync("disable-rgbshift-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableSSAO(kernalRadius,minDistance,maxDistance,controls)
	{
		console.log("enabling ssao 1111111111")
		this._postToDOMAsync("enable-ssao-pass", {
			kernelRadius:kernalRadius,
			minDistance:minDistance,
			maxDistance:maxDistance,
			controls:controls
		}).then(response => {
			console.log(response)
		}).catch(error => {
			console.log(error)
		});
	}
	_disableSSAOPass() {
		this._postToDOMAsync("disable-ssao-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableFilmPass(noise,scanlines,count,grayscale,controls)
	{
		this._postToDOMAsync("enable-film-pass", {
			noise:noise,
			scanlines:scanlines,
			count:count,
			grayscale:grayscale,
			controls:controls
		}).then(response => {
			console.log(response)
		}).catch(error => {
			console.log(error)
		});
	}
	_disableFilmPass() {
		this._postToDOMAsync("disable-film-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableAfterImagePass(damp,controls)
	{
		this._postToDOMAsync("enable-after-image-pass", {
			damp:damp,
			controls:controls
		}).then(response => {
			console.log(response)
		}).catch(error => {
			console.log(error)
		});
	}
	_disableAfterImagePass() {
		this._postToDOMAsync("disable-afterimage-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableGlitchPass(gowild,controls)
	{
		this._postToDOMAsync("enable-glitch-pass", {
			gowild:gowild,
			controls:controls
		}).then(response => {
			console.log(response)
		}).catch(error => {
			console.log(error)
		});
	}
	_disableGlitchPass() {
		this._postToDOMAsync("disable-glitch-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableBokehPass(focus,aperture,maxblur,controls)
	{
		this._postToDOMAsync("enable-bokeh-pass", {
			focus:focus,
			aperture:aperture,
			maxblur:maxblur,
			controls:controls
		}).then(response => {
			console.log(response)
		}).catch(error => {
			console.log(error)
		});
	}
	_disableBokehPass() {
		this._postToDOMAsync("disable-bokeh-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableSceneTransitionEffect(scenejson,
		textureType,
		threshold,
		useCustomTexture,
		customTexturePath,
		duration,
		easing,
		controls) {
		this._postToDOMAsync("enable-scene-transition-pass", {
			json: scenejson,
			textureType:textureType,
			 threshold:threshold,
			 useCustomTexture:useCustomTexture,
			 customTexturePath:customTexturePath,
			 duration:duration,
			 easingIndex:easing,
			 controls:controls
		}).then(response => {
			console.log("Pixel post process enabled:", response);
		}).catch(error => {
			console.error("Error on enable pixel postprocess:", error);
		});
	}
	_disableSceneTransitionPass() {
		this._postToDOMAsync("disable-scenetransition-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_cameraToObjectRay(e)
	{
		this._postToDOMAsync("camera-to-object-ray", {"objectId":e}).then(response => {
			this._raycastHits = response.hits;

			if (this._raycastHits.length > 0)
				this._onRaycastHit(this._raycastHits)
		}).catch(error => {

		});
	}
	_cameraToScreenRay(e) {

		 this._postToDOMAsync("camera-to-screen-ray", {
			"x":e.x,
			"y":e.y,
			"raylength":e.raylength
		 }).then(response => {
			 this._raycastHits = response.hits;
			
			 if(this._raycastHits.length>0)
				 this._onRaycastHit(this._raycastHits)
		 }).catch(error => {

		 });
	}
	_cameraToPointRay(e) {

		this._postToDOMAsync("camera-to-point-ray", e

		).then(response => {
			this._raycastHits = response.hits;

			if (this._raycastHits.length > 0)
				this._onRaycastHit(this._raycastHits)
		}).catch(error => {

		});
	}
	_ObjectToDirectionalRay(e) {
		this._postToDOMAsync("object-to-directional-ray", e

		).then(response => {
			this._raycastHits = response.hits;

			if (this._raycastHits.length > 0)
				this._onRaycastHit(this._raycastHits)
		}).catch(error => {

		});
	}
	_originToDirectionalRay(e)
	{
		this._postToDOMAsync("origin-to-directional-ray", e

		).then(response => {
			this._raycastHits = response.hits;

			if (this._raycastHits.length > 0)
				this._onRaycastHit(this._raycastHits)
		}).catch(error => {

		});
	}
	_onRaycastHit(raycastHits)
	{
		const firstHit = raycastHits[0];
		if (firstHit) {
			this.latestRaycastHit = {
				objectId: firstHit.objectId || null,
				point: firstHit.point,
				distance: firstHit.distance,
				uv: firstHit.uv || null,
				faceIndex: firstHit.faceIndex||0,
				updated: true,
				normal: { x: firstHit.normal.x, y: firstHit.normal.y, z: firstHit.normal.z }
			};
			
			this._trigger(
				C3.Plugins.Jammanna_MakeIt3D.Cnds.OnRaycastHit
			);
		}
	}
	_ignoreRaycast(e)
	{
		this._postToDOM("ignore-raycast", e)
	}
	_setRotationFromNormal(e)
	{
		this._postToDOM("set-rotation-from-normal", e)
	}
};