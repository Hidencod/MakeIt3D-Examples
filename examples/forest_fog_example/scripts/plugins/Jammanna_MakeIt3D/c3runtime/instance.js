const C3 = globalThis.C3;
import { Vector3 } from "./vector3.js";
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
		this._onSpineAnimation = {
			objectId: "",
			status:0,// 0 = started, 1 = completed, 2 = ended
			name: "",
			index: -1,
			eventname : ""
		};
		this._object_three_property = {
			"x": 0,
			"y": 0,
			"y": 0
		};
		this.Mouse = {
			"x": 0,
			"y": 0
		}
		this.Touch = {
			"x": 0,
			"y": 0
		}
		this._raycastHits = [];
		this.latestRaycastHit = {
			objectId: "objectId",
			point: null,
			distance: 0,
			uv: null,
			faceIndex: 0,
			updated: false,
			normal: null
		};
		this._x = 0;
		// Initialize object cache
		this._objectCache = {};
		this._currentForeachIndex = 0;
		//we need to store c3 instances so we can sync them to threejs objects
		this._c3Instances = [];
		this._currentObject =
		{
			objectId: "",
			position: { x: 0, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			scale: { x: 1, y: 1, z: 1 },
			color: 0x00ff00,
			visible: true,
			type: "",
			tag: "",
			animations: []
		};

		// Initialise object properties
		this._allProperties = 0;
		this._enableLogs = true; // Default to true for backward compatibility
		this._showStats = true;
		this._last_error_msg = "";
		const properties = this._getInitProperties();

		if (properties) { // note properties may be null in some cases
			this._enableLogs = properties[0] !== undefined ? properties[0] : false;
			this._showStats = properties[1] !== undefined ? properties[1] : false;
			// console.log("Enable logs from properties:", properties[1], properties[0]);
		}
		this.logger = new Logger(this._enableLogs, "MakeIt3D");
		this.lastTime = performance.now(); // high-resolution timer
		this.loadProjectData();
		//console.log(this.runtime)
		this.runtime.addEventListener("beforeanylayoutstart", ev => {
			//console.log("Before starting layout:", ev.layout.name);
			
		});
		this.runtime.addEventListener("instancedestroy", event => {
			if (event.isEndingLayout) return;
			const element = event.instance;
			this._destroyObject(
				{"objectId":element.objectType.name + "_" + element.uid}
			);
		}
		)
	
		this.runtime.addEventListener("instancecreate", async obj => {
			const element = obj.instance;
			console.log(element)
			if (element.plugin.id === "MakeIt3D_Object") {
				
					this._c3Instances.push(element);
				
					const properties = element._getAllProperties();
					if(properties==null) return;
					
					try {
						await this._sceneReady;
					} catch (err) {
						console.warn("Scene not ready, skipping instance creation:", err);
						return;
					}
					let finalObjectId = ""
					//console.log("Creating 3D object for instance:", element.objectType.name + "_" + element.uid);
					if (properties[3] && properties[3] != "") {
						//check if this path ends with .glb or .gltf or .fbx
						const path = properties[3];
						if (path.endsWith(".glb") || path.endsWith(".gltf") || path.endsWith(".fbx")) {

							finalObjectId = await this._LoadCustomModel(element.objectType.name + "_" + element.uid, path, { x: element.x, y: element.zElevation, z: -element.y }, { x: 0, y: 0, z: 0 }, { x: properties[6], y: properties[8], z: properties[7] },element.isVisible);
						}
					} else {
						const shapeTypes = ["cube", "sphere", "cylinder", "cone","plane", "circle"];
						const colorRgb = element.colorRgb;
						finalObjectId = await this._addPrimitiveAtPosition({
							objectId: element.objectType.name + "_" + element.uid,
							type: shapeTypes[properties[2]],
							width: element.width,
							height: shapeTypes[properties[2]] == "plane" ? element.height : properties[1],
							depth: element.height,
							radius: element.width,
							radiusTop: element.width,
							radiusBottom: element.width,
							color: ((r, g, b) => ((r * 255 << 16) | (g * 255 << 8) | (b * 255)))(...colorRgb),
							position: { x: element.x, y: element.zElevation, z: -element.y },
							rotation: { x: 0, y: 0, z: 0 },
							scale: { x: properties[6], y: properties[7], z: properties[8] },
						})
						
					}
				if(properties[0])
				this.setObjectFrame(finalObjectId, element.objectType.name, "default", 0, 0, 0)
					
				

				
			}
		}
	
		)
		this.runtime.addEventListener("afteranylayoutstart", ev => {
			
			
		});

		this.runtime.addEventListener("beforeanylayoutend", ev => {
			if (properties[1] == 0) {
				this._postToDOMAsync("on-layout-end",
					{

					}
				)
					.then(data => {

					})
			}
		});

		this.runtime.addEventListener("afteranylayoutend", ev => {
			//console.log("After ending layout:", ev.layout.name);
		});


		// Post to the DOM to retrieve the initial state
		this.runtime.sdk.addLoadPromise(
			this._postToDOMAsync("set-initial-state",
				{
					"logsEnabled": this._enableLogs,
					"showStats": this._showStats
				}
			)
				.then(data => {

				})
		);
		this._sceneReadyResolve = null;
		this._sceneReadyReject = null;

		this._sceneReady = new Promise((resolve, reject) => {
			this._sceneReadyResolve = resolve;
			this._sceneReadyReject = reject;
		});
		//this comes from DOM domSide.js

		// this._addDOMMessageHandler("on-threejs-load-status", async (data) => {
		// 	this._onThreeJsLoaded(data);
		// });
		//this.renderObjectFrame("Sprite",1);
		//this.playConstruct3Animation("Sprite", 0, 0.01)
		
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
		this._addDOMMessageHandler("on-spine-animation-started", async (data) => {
			const{objectId,animationName} = data;
			this._onSpineAnimation.objectId = objectId
			this._onSpineAnimation.status = 0;
			this._onSpineAnimation.name = animationName
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnSpineAnimationStarted, objectId, animationName);
		});
		this._addDOMMessageHandler("on-spine-animation-completed", async (data) => {
			const { objectId, animationName } = data;
			this._onSpineAnimation.objectId = objectId
			this._onSpineAnimation.status = 1;
			this._onSpineAnimation.name = animationName
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnSpineAnimationCompleted, objectId, animationName);
		});
		this._addDOMMessageHandler("on-spine-animation-ended", async (data) => {
			const { objectId, animationName } = data;
			this._onSpineAnimation.objectId = objectId
			this._onSpineAnimation.status = 2;
			this._onSpineAnimation.name = animationName
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnSpineAnimationEnded, objectId, animationName);
		});
		this._addDOMMessageHandler("on-spine-event-fired", async (data) => {
			const { objectId, eventname, animationName } = data;
			this._onSpineAnimation.objectId = objectId
			this._onSpineAnimation.status = 2;
			this._onSpineAnimation.name = animationName;
			this._onSpineAnimation.eventname = eventname;
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnSpineEventFired, objectId, eventname,animationName);
		});


		// console.log("SDK registered globally:", globalThis[secretKey]);
		// console.log("GlobalThis test threejs:", globalThis)
		// const secretKey2 = Symbol.for("MakeIt3DISDK");
		// const sdkInstance = globalThis[secretKey2];
		// console.log(sdkInstance)
		
	}
	async playConstruct3Animation(objectName, animationIndex = 0, speed = 100) {
		const projectData = await this.runtime.assets.fetchJson('data.json');
		const objects = projectData.project[3];

		const object = objects.find(obj => obj[0] === objectName);

		if (!object) {
			console.error(`Object '${objectName}' not found.`);
			return;
		}

		const animations = object[7];
		const frames = animations?.[animationIndex]?.[7];

		if (!Array.isArray(frames) || frames.length === 0) {
			console.error(`No frames found for '${objectName}' animation index ${animationIndex}`);
			return;
		}

		// Load the image (assumes all frames use same sheet)
		const spriteSheetUrl = frames[0][0];
		const img = new Image();
		img.src = spriteSheetUrl;

		await new Promise(resolve => {
			img.onload = resolve;
		});

		// Create canvas
		const width = frames[0][4];
		const height = frames[0][5];
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		document.body.appendChild(canvas);

		let currentFrame = 0;

		// Main animation loop
		const draw = () => {
			const frame = frames[currentFrame];
			const x = frame[2]; // X offset in sheet
			const y = frame[3]; // Y offset in sheet
			const w = frame[4];
			const h = frame[5];
			const rotated = frame[6];

			if (rotated) {
				console.warn(`Frame ${currentFrame} is rotated — skipping for now`);
				return;
			}

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

			currentFrame = (currentFrame + 1) % frames.length;
		};

		// Loop with setInterval
		setInterval(draw, speed);
	}

	_tick() {
		const currentTime = performance.now();
		const deltaTime = (currentTime - this.lastTime) / 1000; // deltaTime in seconds
		this.lastTime = currentTime;

		if (typeof window !== "undefined" && window.MakeIt3DContext && window.MakeIt3DContext.threeJsContext) {
			let { renderer, scene, camera, usePostprocessing, composer, renderTransitionState } = window.MakeIt3DContext.threeJsContext;

			if ((usePostprocessing && composer)
				|| (renderTransitionState > 0 && renderTransitionState < 1)) {
				composer.render();
			} else {
				renderer.render(scene, camera);
			}
		}

		this._postToDOM("update-render-loop", {
			deltaTime: deltaTime
		})


		if (this._showStats)
			this._postToDOM("update-performance-stats", {
				cpuUsageRaw: this.runtime.cpuUtilisation,
				gpuUsageRaw: this.runtime.gpuUtilisation
			})
		//iterate through all c3 instances and sync them to threejs objects
		this._c3Instances.forEach(c3instance => {
			const position = this._convertC3ToThreePosition(c3instance)
			const properties = c3instance._getAllProperties();
			const rotationx = properties[4];
			const rotationz = properties[5];
			const rotation = { x: rotationx, y: c3instance.angleDegrees*-1, z: rotationz };
			const scaleX = properties[6]
			const scaleY = properties[8]
			const scaleZ = properties[7]
			
			this._setObjectProperty({
				objectId: c3instance.objectType.name + "_" + c3instance.uid,
				property: "position",
				value: position
			});
			this._setObjectProperty({
				objectId: c3instance.objectType.name + "_" + c3instance.uid,
				property: "rotation",
				value: rotation
			});
			this._setObjectProperty({
				objectId: c3instance.objectType.name + "_" + c3instance.uid,
				property: "scale",
				value: { x: scaleX, y: scaleZ, z: scaleY }
			});
			this._setObjectProperty({
				objectId: c3instance.objectType.name + "_" + c3instance.uid,
				property: "visible",
				value: c3instance.isVisible
			});


		});

	}
	_convertC3ToThreePosition(c3instance) {
		const layoutWidth = this.runtime.viewportWidth || 0;
		const layoutHeight = this.runtime.viewportHeight || 0;
		const shapeTypes = ["cube", "sphere", "cylinder", "cone", "plane", "circle"];
		const properties = c3instance._getAllProperties();
		let zHeight = 0;
		switch (shapeTypes[properties[2]]) {
			case "cube":
			case "cylinder":
			case "cone":
				// For these shapes, adjust y by half the height
				zHeight = (properties[1]) / 2;
				break;
			case "sphere":
				zHeight = (c3instance.width * 2) / 2;
				break;
			case "plane":
			case "circle":
				zHeight = 0;
				break;
			default:
				zHeight = 0;
		}
		// Center the Construct world in Three.js space
		const offset = {
			x: layoutWidth / 2,
			y: zHeight,
			z: layoutHeight / 2
		};

		return {
			x: c3instance.x - offset.x,
			y: c3instance.zElevation+ offset.y,
			z: c3instance.y - offset.z
		};
	}

	_syncC3ToThreeObject(e) {
		if (!e.c3object) {
			this.logger.error("SyncC3ToThreeObject: c3object is required");
			return;
		}
		if (!e.objectId) {
			this.logger.error("SyncC3ToThreeObject: objectId is required");
			return;
		}

		// // Scale factor for pixel to world unit conversion
		// const PIXEL_TO_WORLD_SCALE = 0.02;

		// function c3CoordsToThree(x, y, z) {
		// 	return new THREE.Vector3(
		// 		-x * PIXEL_TO_WORLD_SCALE,
		// 		z * PIXEL_TO_WORLD_SCALE,
		// 		y * PIXEL_TO_WORLD_SCALE
		// 	);
		// }

		// Sync Three.js camera from C3 3D Camera (position AND rotation)
		// if (typeof window !== "undefined" && window.MakeIt3DContext?.threeJsContext) {
		// 	const { camera,scene } = window.MakeIt3DContext.threeJsContext;
		// 	const c33DCamera = this.runtime.objects["3DCamera"];

		// 	if (!c33DCamera) {
		// 		console.warn("No C3 3D Camera found.");
		// 		return;
		// 	}

		// 	// Get C3 3D camera position and look data
		// 	const c3CamPos = c33DCamera.getCameraPosition();     // [x, y, z]
		// 	const c3LookPos = c33DCamera.getLookPosition();      // [x, y, z]
		// 	const c3UpVector = c33DCamera.getUpVector();         // [x, y, z]

		// 	// Convert C3 coordinates to Three.js coordinates
		// 	const threeCamPos = c3CoordsToThree(c3CamPos[0], c3CamPos[1], c3CamPos[2]);
		// 	const threeLookPos = c3CoordsToThree(-c3LookPos[0], c3LookPos[1], c3LookPos[2]);
		// 	const threeUpVector = c3CoordsToThree(c3UpVector[0], c3UpVector[1], c3UpVector[2]);

		// 	// Apply position and rotation to Three.js camera
		// 	camera.position.copy(threeCamPos);
		// 	camera.up.copy(threeUpVector.normalize());
		// 	camera.lookAt(threeLookPos);

		// 	// Optional: Sync field of view
		// 	const c3Fov = c33DCamera.fieldOfView; // in radians
		// 	if (camera.isPerspectiveCamera) {
		// 		camera.fov = c3Fov * (180 / Math.PI); // Convert to degrees
		// 		camera.updateProjectionMatrix();
		// 	}

		// 	console.log("Three.js camera synced with C3 3D camera");
		// }
		const pos = this.c3ToThreePos(e.c3object.x, e.c3object.y, e.c3object.zElevation, this.runtime.viewportWidth, this.runtime.viewportHeight, 0.02);


		if (e.syncposition) {
			if (typeof window !== "undefined" && window.MakeIt3DContext && window.MakeIt3DContext.threeJsContext) {
				const { objects } = window.MakeIt3DContext.threeJsContext;
				const obj = objects.get(e.objectId)
				obj.position.x = pos.x;
				obj.position.y = pos.z;
				obj.position.z = -pos.y;
			} else {
				this._postToDOM("set-object-property", {
					objectId: e.objectId,
					property: "position",
					value: { x: pos.x, y: pos.z, z: -pos.y },
					lerpFactor: 1
				})

				this.updateObjectCashedProperty(e.objectId, "position", { x: pos.x, y: pos.z, z: -pos.y })
			}
		}
		if (e.syncrotation) {
			this._setObjectProperty({
				objectId: e.objectId,
				property: "rotation_y",
				value: -(e.c3object.angleDegrees)
			});
		}
		if (e.syncscale) {
			this._setObjectProperty({
				objectId: e.objectId,
				property: "scale",
				value: { x: e.c3object.width * 0.02, y: e.c3object.zHeight * 0.02 || 1, z: e.c3object.height * 0.02 }
			});
		}
		//console.log(e.c3object.colorRgb)
		this._setColor(e.objectId, e.c3object.colorRgb)
		//console.log(e.c3object)
	}
	c3ToThreePos(c3X, c3Y, c3Z, layoutWidth, layoutHeight, scale = 0.01) {
		// shift origin from top-left to center
		let centeredX = c3X - layoutWidth / 2;
		let centeredY = c3Y - layoutHeight / 2;

		// flip Y axis
		centeredY = -centeredY;

		// apply scaling
		return {
			x: centeredX * scale,
			y: centeredY * scale,
			z: c3Z * scale
		};
	}

	_afteranylayoutend() {
		//console.log("Layout changed to:", this.runtime.layout.name);
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
			this.logger.error("Error updating property cache:", error);
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
		if (response.success) {
			this._isThreeJsLoaded = true;

			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnThreeJsLoad);
		} else {
			this._isThreeJsLoaded = false;
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnThreeJsLoadFail);
		}
	}
	async _onCheckThreeJsLoaded() {
		// Always check with DOM side to ensure accurate loading state
		this._postToDOMAsync("load-threejs-libraries")
			.then(response => {
				this._onThreeJsLoaded(response);
				return true;
			})
			.catch(error => {
				this.logger.error("Error checking Three.js loading status:", error);

				this._isThreeJsLoaded = false;
				this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnThreeJsLoadFail);
				return false;
			});
	}
	
	_onSceneCreateStatus(success) {
		if (success) {
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnSceneCreated);
			let eventdata = {};
			if (typeof window !== "undefined")
				eventdata = window.MakeIt3DContext.threeJsContext;

			this.dispatchCustomEvent("onscenecreate", eventdata);

			// ✅ Resolve the sceneReady promise
			if (this._sceneReadyResolve) this._sceneReadyResolve();

		} else {
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnSceneCreateFail);

			// ❌ Reject the sceneReady promise
			if (this._sceneReadyReject) this._sceneReadyReject("Scene creation failed");
		}
	}

	_setCameraPosition(e) {
		this._postToDOMAsync("set-camera-position", {
			x: e.x,
			y: e.y,
			z: e.z
		})
			.then(response => {
				if (response && response.success) {
				} else {
					this.logger.error("Failed to set camera position:", response?.error);
				}
			})
			.catch(error => {
				this.logger.error("Error setting camera position:", error);
			});
	}
	_setCameraType(e) {
		this._postToDOMAsync("set-camera-type", {
			type: e.type
		})
			.then(response => {
				if (response && response.success) {
					this.logger.info("Camera type set to:", e.type);
				} else {
					this.logger.error("Failed to set camera type:", response?.error);
				}
			})
			.catch(error => {
				this.logger.error("Error setting camera type:", error);
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
				} else {
					this.logger.error("Failed to set camera position:", response?.error);
				}
			})
			.catch(error => {
				this.logger.error("Error setting camera position:", error);
			});
	}
	_setCameraLookAt(e) {
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
	_setCameraTranslation(e) {
		this._postToDOM("set-camera-translation", e)
	}
	_updateRenderLoop(e) {
		this._postToDOM("update-render-loop", {
			deltaTime: e.dt
		})
		if (this._showStats)
			this._postToDOM("update-performance-stats", {
				cpuUsageRaw: this.runtime.cpuUtilisation,
				gpuUsageRaw: this.runtime.gpuUtilisation
			})
		this._setTicking(false)
	}
	async _addPrimitiveAtPosition(e) {
		try {
			const response = await this._postToDOMAsync("add-primitive-at-position", e);
			this._onObjectAdded(response);
			return response.objectId; // ✅ Return value to caller
		} catch (error) {
			this.logger.error("Error checking Three.js loading status:", error);
			return null; // Optional fallback
		}
	}

	_addLightAtPosition(e) {
		
		this._postToDOMAsync("add-light-at-position", {
			e
		}).then(response => {
			this._onObjectAdded(response);
			return true;
		})
			.catch(error => {
				this.logger.error("Error checking Three.js loading status:", error);
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
		
		// Add object to cache
		this._objectCache[data.objectId] = {
			objectId: data.objectId,
			position: data.position || { x: 0, y: 0, z: 0 },
			rotation: data.rotation || { x: 0, y: 0, z: 0 },
			scale: data.scale || { x: 1, y: 1, z: 1 },
			color: 0x00ff00,
			visible: data.visible !== undefined ? data.visible : true,
			type: "",
			tag: data.tag || "",
			animations: data.animations || []
		};
		// Trigger the condition with the object ID
		this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnObjectAdded, data.objectId);
		let eventdata = data;
		if (typeof window !== "undefined")
			eventdata = window.MakeIt3DContext.threeJsContext.objects.get(data.objectId);
		this.dispatchCustomEvent("onobjectcreate", eventdata)
	}
	async _LoadCustomModel(objectId, path, position, rotation, scale, visible) {
		await this._postToDOMAsync("load-model-from-path", {
			objectId: objectId,
			path: path,
			position: position || { x: 0, y: 0, z: 0 },
			rotation: rotation || { x: 0, y: 0, z: 0 },
			scale: scale || { x: 0.5, y: 0.5, z: 0.5 },
			visible: visible
		})
			.then(response => {
				this.logger.info("Model loaded successfully:", response);
				this._onObjectAdded(response);
				return response.objectId;
			})
			.catch(error => {

			});
	}
	_getPropertyX(property) {
		this._object_three_property.x = property.value.x;
		this._object_three_property.y = property.value.y;
		this._object_three_property.z = property.value.z;
		this._x = this._object_three_property.x;
	}
	_GetObjectIdsByTag(tag) {
		const result = [];

		for (const objectId in this._objectCache) {
			const obj = this._objectCache[objectId];

			if (obj && obj.tag === tag) {
				result.push(objectId);
			}
		}

		return result;
	}

	_LoadThreeJsLibraries() {
		this._postToDOM("load-threejs-libraries")
	}
	//#region Creating scene
	// Method to manually initialize Three.js
	async _OnCreateScene(e) {
		//this.runtime.isInWorker = false;
		var isWorkerMode = this.runtime.isInWorker;

		// Validate layer index first
		const totalLayers = this.runtime.layout.getAllLayers();
		if (e.layerIndex < 0 || e.layerIndex >= totalLayers) {
			this.logger.error(`Invalid layer index: ${e.layerIndex}. Available layers: 0-${totalLayers - 1}`);
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
			} catch (error) {
				this.logger.error("Error getting HTML layer:", error);
				this._onThreeJsError(error);
				return;
			}
		}
		await this._postToDOMAsync("create-threejs-scene", {
			layerIndex: e.layerIndex,
			isWorkerMode: isWorkerMode,
			containerId: containerId,
			canvasWidth: this.runtime.platformInfo.canvasCssWidth,
			canvasHeight: this.runtime.platformInfo.canvasCssHeight,
			devicePixelRatio: this.runtime.platformInfo.devicePixelRatio,
			addbasiclighting: e.addbasiclighting,
			usePostprocessing: e.usePostprocessing,
			isAxesHelperEnabled: e.isAxesHelperEnabled,
			isGridHelperEnabled: e.isGridHelperEnabled,
			isLoadFromJson: e.isLoadFromJson,
			useSceneCamera: e.useSceneCamera,
			isOrbitControlsEnabled: e.isOrbitControlsEnabled,
			viewportWidth: this.runtime.viewportWidth,
			viewportHeight: this.runtime.viewportHeight,
			path: e.path
		})
			.then(() => {
				this.logger.info("Three.js scene created successfully");
				this._setTicking(true)
				


			})
			.catch(error => {
				this.logger.error("Error sending Three.js initialization message:", error);
				this._onThreeJsError(error);
			});
	}
	dispatchCustomEvent(id, data) {
		const e = new C3.Event(id, true);
		e.data = data || {};
		this.dispatchEvent(e);
	}
	//#endregion
	_launchSceneEditor() {
		this._postToDOMAsync("launch-scene-editor")
			.then(response => {
				this.logger.info("scene editor launched", response);
			})
			.catch(error => {
				this.logger.error("Error launching scene editor:", error);
			});
	}
	_GetAllAnimationNamesArray(objectId) {
		if (!this._objectCache[objectId])
			return [];
		const anims = this._objectCache[objectId]?.animations;

		if (!anims || anims.length === 0)
			return [];

		return anims.map((anim, index) => `${index}: ${anim.name}`);
	}
	_GetAnimationCount(objectId) {
		if (!this._objectCache[objectId])
			return 0;
		const anims = this._objectCache[objectId]?.animations;
		return anims ? anims.length : 0;
	}
	_GetAnimationDuration(objectId, index_or_name) {
		if (!this._objectCache[objectId])
			return 0;

		const anims = this._objectCache[objectId]?.animations;

		if (!anims || anims.length === 0) {
			this.logger.warn(`No animations found for object: ${objectId}`);
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
				this.logger.warn(`Animation index out of range: ${index_or_name}`);
			}
		} else {
			this.logger.warn("Invalid input for index_or_name:", index_or_name);
		}

		if (!animation) {
			this.logger.warn(`Animation not found for object: ${objectId}, input: ${index_or_name}`);
			return null;
		}

		return animation.duration;
	}

	// Add play animation action
	_PlayAnimation(objectId, animationIndex_Name, fadeDuration, loop, timeScale = 1.0, clampWhenFinished) {

		if (!objectId) {
			this.logger.error("PlayAnimation: objectId is required");
			return;
		}

		// Convert loop and clampWhenFinished from 0/1 to boolean
		const loopValue = loop;
		const clampValue = clampWhenFinished;

		// Choose name or index
		const isIndex = !isNaN(Number(animationIndex_Name));
		const payload = {
			objectId: objectId,
			loop: loopValue,
			timeScale: typeof timeScale === "number" ? timeScale : 1.0,
			clampWhenFinished: clampValue,
			fadeDuration: fadeDuration
		};

		if (isIndex) {
			payload.animationIndex_Name = parseInt(animationIndex_Name);
		} else if (typeof animationIndex_Name === "string" && animationIndex_Name.length > 0) {
			payload.animationIndex_Name = animationIndex_Name;
		} else {
			this.logger.warn("PlayAnimation: no valid animationIndex or animationName provided – using default (index 0)");
			payload.animationIndex = 0;
		}

		// Send play animation request to DOM side
		this._postToDOMAsync("play-animation", payload)
			.then(response => {
			})
			.catch(error => {
				this.logger.error("Error sending animation play message:", error);
			});
	}
	_blendAnimations(e) {
		this._postToDOM("blend-animations", e)
	}
	_transitionAnimation(e) {
		this._postToDOM("transition-animations", e)
	}
	_setObjectLookAt(e) {
		this._postToDOM("set-object-look-at", e)
	}
	_PauseAnimation(objectId) {

		this._postToDOMAsync("pause-animation", {
			objectId: objectId
		})
			.then(() => {
				this.logger.info("Animation paused successfully for object:", objectId);
			})
			.catch(error => {
				this.logger.error("Error sending animation pause message:", error);
			});
	}
	_ResumeAnimation(objectId) {


		this._postToDOMAsync("resume-animation", {
			objectId: objectId
		})
			.then(() => {
				this.logger.info("Animation resumed for object:", objectId);
			})
			.catch(error => {
				this.logger.error("Error sending animation resume message:", error);
			});
	}

	_StopAnimation(objectId) {


		this._postToDOMAsync("stop-animation", {
			objectId: objectId
		})
			.then(() => {
				this.logger.info("Animation stoped for object:", objectId);
			})
			.catch(error => {
				this.logger.error("Error sending animation stop message:", error);
			});
	}
	_OnAnimationFinished(data) {
		//this.logger.info("Animation finished for object:", data.objectId, "animation:", data.animationName);
		this._lastAnimationFinished.objectId = data.objectId;
		this._lastAnimationFinished.name = data.animationName;
		this._lastAnimationFinished.index = data.animationIndex;
		this._trigger(
			C3.Plugins.Jammanna_MakeIt3D.Cnds.OnAnimationClipFinished,
			data.objectId,
			typeof data.animationName === "string" ? data.animationName : data.animationIndex
		);
		let eventdata = data;
		if (typeof window !== "undefined")
			eventdata = window.MakeIt3DContext.threeJsContext.objects.get(data.objectId).animations;
		this.dispatchCustomEvent("onanimationfinish", eventdata)
	}
	_OnAnimationLoopFinished(data) {
		//this.logger.info("Animation Loop finished for object:", data);
		this._lastAnimationFinished.objectId = data.objectId;
		this._lastAnimationFinished.name = data.animationName;
		this._lastAnimationFinished.index = data.animationIndex;

		// Trigger the condition with the object ID and animation name
		this._trigger(
			C3.Plugins.Jammanna_MakeIt3D.Cnds.OnAnimationLoopFinished,
			data.objectId,
			typeof data.animationName === "string" ? data.animationName : data.animationIndex
		);
		let eventdata = data;
		if (typeof window !== "undefined")
			eventdata = window.MakeIt3DContext.threeJsContext.objects.get(data.objectId).animations;
		this.dispatchCustomEvent("onanimationloopfinish", eventdata)
	}
	// Method to add test cube
	addTestCube() {


		this._postToDOMAsync("add-test-cube");
	}


	_setTestProperty(n) {
		this._allProperties = n;
	}

	_getTestProperty() {
		return this._allProperties;
	}

	// Getter to check if Three.js is loaded
	isThreeJsLoaded() {
		return this._isThreeJsLoaded;
	}

	_saveToJson() {
		return {
			// data to be saved for savegames
			testProperty: this._allProperties,
			isThreeJsLoaded: this._isThreeJsLoaded,
			objectCache: this._objectCache,
			autoLoadLibraries: this._autoLoadLibraries
		};
	}

	_loadFromJson(o) {
		// load state for savegames
		if (o.testProperty !== undefined) {
			this._allProperties = o.testProperty;
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
			this.logger.error("SetObjectProperty: objectId is required");
			return;
		}
		if (!e.property) {
			this.logger.error("SetObjectProperty: propertyName is required");
			return;
		}
		if (e.value === undefined || e.value === null) {
			this.logger.error("SetObjectProperty: value is required and cannot be null or undefined");
			return;
		}
		this._postToDOM("set-object-property", {
			objectId: e.objectId,
			property: e.property,
			value: e.value,
			lerpFactor: e.lerp

		})
		this.updateObjectCashedProperty(e.objectId, e.property, e.value)
	}
	updateObjectCashedProperty(objectId, property, value) {
		const cached = this._objectCache[objectId];

		if (!cached) {
			//this.logger.error(`updateObjectCashedProperty: Object with ID ${objectId} not found in cache`);
			return;
		}
		switch (property.toLowerCase()) {
			case 'position':
				cached.position = {
					x: value.x !== undefined ? value.x : this._objectCache[objectId].position.x,
					y: value.y !== undefined ? value.y : this._objectCache[objectId].position.y,
					z: value.z !== undefined ? value.z : this._objectCache[objectId].position.z
				};
				break;

			case 'translation':
				if (typeof value === 'object' && value !== null) {
					const cachedPos = cached.position;
					cachedPos.x += value.x || 0;
					cachedPos.y += value.y || 0;
					cachedPos.z += value.z || 0;
				}
				break;

			case 'positionx':
			case 'position_x':
				if (typeof value === 'number') {
					cached.position.x = value;
				}
				break;

			case 'positiony':
			case 'position_y':
				if (typeof value === 'number') {
					cached.position.y = value;
				}
				break;

			case 'positionz':
			case 'position_z':
				if (typeof value === 'number') {
					cached.position.z = value;
				}
				break;

			case 'rotation':
				if (typeof value === 'object' && value !== null) {
					cached.rotation = {
						x: value.x !== undefined ? value.x : this._objectCache[objectId].rotation.x,
						y: value.y !== undefined ? value.y : this._objectCache[objectId].rotation.y,
						z: value.z !== undefined ? value.z : this._objectCache[objectId].rotation.z
					};
				}
				break;

			case 'rotationx':
			case 'rotation_x':
				if (typeof value === 'number') {
					cached.rotation.x = value ? value : this._objectCache[objectId].rotation.x;
				}
				break;

			case 'rotationy':
			case 'rotation_y':
				if (typeof value === 'number') {
					cached.rotation.y = value ? value : this._objectCache[objectId].rotation.y;
				}
				break;

			case 'rotationz':
			case 'rotation_z':
				if (typeof value === 'number') {
					cached.rotation.z = value ? value : this._objectCache[objectId].rotation.z;
				}
				break;

			case 'scale':
				if (typeof value === 'object' && value !== null) {
					cached.scale = {
						x: Math.max(0.001, value.x !== undefined ? value.x : this._objectCache[objectId].scale.x),
						y: Math.max(0.001, value.y !== undefined ? value.y : this._objectCache[objectId].scale.y),
						z: Math.max(0.001, value.z !== undefined ? value.z : this._objectCache[objectId].scale.z)
					};
				}
				break;

			case 'scalex':
			case 'scale_x':
				if (typeof value === 'number') {
					cached.scale.x = Math.max(0.001, value);
				}
				break;

			case 'scaley':
			case 'scale_y':
				if (typeof value === 'number') {
					cached.scale.y = Math.max(0.001, value);
				}
				break;

			case 'scalez':
			case 'scale_z':
				if (typeof value === 'number') {
					cached.scale.z = Math.max(0.001, value);
				}
				break;

			case 'color':
				cached.color = value;
				break;

			case 'visible':
				cached.visible = Boolean(value);
				break;

			case 'tag':
				cached.tag = value;
				break;

			// Add other properties as needed
		}


	}
	_onSetObjectMaterial(data) {
		if (data.success) {
			this.logger.info("Material applied successfully to object:", data.objectId);
		} else {
			this.logger.error("Failed to apply material:", data.error);
		}
	}

	// Method to set material on an object
	_SetObjectMaterial(objectId, config) {

		this._postToDOMAsync("set-object-material", {
			objectId,
			...config
		}).then(response => {
			if (response.success)
				this.logger.info(config.materialType + " material applied for " + objectId)
		}).catch(error => {
			this.logger.error("Error setting object material:", error);
		});
	}

	// Method to set object visibility
	_SetObjectVisible(objectId, visible) {
		if (this._objectCache[objectId]) {
			this._objectCache[objectId].visible = visible;
		}
		this._postToDOMAsync("set-object-visible", {
			objectId,
			visible
		}).then(response => {
			this.logger.info("SetObjectVisible response -", response);
			// Update cache

		}).catch(error => {
			this.logger.error("Error setting object visibility:", error);
		});
	}
	_SetMeshVisible(objectId, visible) {
		// if (this._objectCache[objectId]) {
		// 	this._objectCache[objectId].visible = visible;
		// }
		this._postToDOMAsync("set-mesh-visible", {
			objectId,
			visible
		}).then(response => {
			this.logger.info("Set Object Mesh Visible response -", response);
			// Update cache

		}).catch(error => {
			this.logger.error("Error setting object mesh visibility:", error);
		});
	}
	_setObjectTag(e) {

		if (e.objectId == "") return;
		const cached = this._objectCache[e.objectId];
		if (cached)
			cached.tag = e.tag;

		this._postToDOMAsync("set-object-tag", e)
	}
	_isObjectVisible(objectId) {
		const key = objectId.toString();
		const cached = this._objectCache[key];
		if (cached) return cached.visible;
		return false;
	}


	_SetCustomShaderMaterial(objectId, config) {

		this._postToDOMAsync("set-custom-shader-material", {
			objectId,
			...config
		}).then(response => {
			this.logger.info("SetCustomShaderMaterial - ", response);
		}).catch(error => {
			this.logger.error("Error setting custom shader material:", error);
		});
	}

	_SetShaderUniform(objectId, name, value) {
		this._postToDOMAsync("set-shader-uniform", {
			objectId,
			name,
			value
		}).then(response => {
			this.logger.info("SetShaderUniform - ", response);
		}).catch(error => {
			this.logger.error("Error setting shader uniform:", error);
		});
	}
	async _setTexture(config) {
		try {
			const response = await this._postToDOMAsync("set-texture", {
				objectId: config.objectId,
				path: config.path
			});
			this.logger.info("SetTexture - ", response);
		} catch (error) {
			this.logger.error("Error setting texture:", error);
		}
	}

	_setTextureWrap(objectId, wrapS = "repeat", wrapT = "repeat") {
		this._postToDOMAsync("set-texture-wrap", {
			objectId,
			wrapS,
			wrapT
		}).then(response => {
			this.logger.info("SetTextureWrap - ", response);
		}).catch(error => {
			this.logger.error("Error setting texture wrap:", error);
		});
	}
	_setTextureRepeat(objectId, x = 1, y = 1) {
		this._postToDOMAsync("set-texture-repeat", {
			objectId,
			x,
			y
		}).then(response => {
			this.logger.info("SetTextureRepeat - ", response);
		}).catch(error => {
			this.logger.error("Error setting texture repeat:", error);
		});
	}
	_setTextureOpacity(objectId, value = 1.0) {
		this._postToDOMAsync("set-texture-opacity", {
			objectId,
			value
		}).then(response => {
			this.logger.info("SetTextureOpacity - ", response);
		}).catch(error => {
			this.logger.error("Error setting texture opacity:", error);
		});
	}
	_setEmissiveMap(objectId, path, emissiveIntensity) {
		this._postToDOMAsync("set-emissive-map", {
			objectId,
			path,
			emissiveIntensity
		}).then(response => {
			this.logger.info("SetEmissiveMap - ", response);
		}).catch(error => {
			this.logger.error("Error setting emissive map:", error);
		});
	}
	_setNormalMap(objectId, path, strength) {
		this._postToDOMAsync("set-normal-map", {
			objectId,
			path,
			strength
		}).then(response => {
			this.logger.info("SetNormalMap - ", response);
		}).catch(error => {
			this.logger.error("Error setting normal map:", error);
		});
	}
	_setRoughnessMap(objectId, path) {
		this._postToDOMAsync("set-roughness-map", {
			objectId,
			path
		}).then(response => {
			this.logger.info("SetRoughnessMap - ", response);
		}).catch(error => {
			this.logger.error("Error setting roughness map:", error);
		});
	}
	_setMetalnessMap(objectId, url) {
		this._postToDOMAsync("set-metalness-map", {
			objectId,
			url
		}).then(response => {
			this.logger.info("SetMetalnessMap - ", response);
		}).catch(error => {
			this.logger.error("Error setting metalness map:", error);
		});
	}
	_setColor(objectId, color) {
		this._postToDOMAsync("set-color", {
			objectId, color
		}).then(response => {
			//this.logger.info("Set color - ", response);
		}).catch(error => {
			this.logger.error("Error setting color:", error);
		});
	}
	_disposeTexture(objectId) {
		this._postToDOMAsync("texture-unload", {
			objectId
		}).then(response => {
			this.logger.info("Texture unload - ", response);
		}).catch(error => {
			this.logger.error("Error unloading texture:", error);
		});
	}
	_setVideoTexture(objectId, path, loop = false, autoplay = true, muted = true) {
		this._postToDOMAsync("set-video-texture", {
			objectId,
			path,
			loop,
			autoplay,
			muted
		}).then(response => {
			this.logger.info("Texture unload - ", response);
		}).catch(error => {
			this.logger.error("Error unloading texture:", error);
		});
	}
	_enablePixelatedEdgeEffect(pixelvalue, normalEdgeStrength, depthEdgeStrength, controls) {
		this._postToDOMAsync("enable-pixelated-edge-pass", {
			pixelvalue: pixelvalue,
			normalEdgeStrength,
			depthEdgeStrength,
			controls: controls
		}).then(response => {
			this.logger.info("Pixel post process enabled:", response);
		}).catch(error => {
			this.logger.error("Error on enable pixel postprocess:", error);
		});
	}

	_disablePixelPass() {
		this._postToDOMAsync("desable-pixelated-edge-pass", {

		}).then(response => {

		}).catch(error => {
		});
	}
	_enableBloomPass(strength, radius, threshold, controls) {
		this._postToDOMAsync("enable-bloom-pass", {
			strength: strength,
			radius: radius,
			threshold: threshold,
			controls: controls
		}).then(response => {
			this.logger.info("bloom post process enabled:", response);
		}).catch(error => {
			this.logger.error("Error on enable bloom postprocess:", error);
		});
	}
	_disableBloomPass() {
		this._postToDOMAsync("disable-bloom-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableFXAA() {
		this._postToDOMAsync("enable-fxaa-pass", {
		}).then(response => {
			this.logger.info("fxaa post process enabled:", response);
		}).catch(error => {
			this.logger.error(" error on fxaa post process:", error);
		});
	}
	_disableFXAA() {
		this._postToDOMAsync("disable-fxaa-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableOutlinePass(selectedObjects, edgeStrength, color, texture, controls) {
		this._postToDOMAsync("enable-outline-pass", {
			selectedObjects: selectedObjects,
			edgeStrength: edgeStrength,
			color: color,
			texture: texture,
			controls: controls
		}).then(response => {
			this.logger.info("outline post process enabled:", response);
		}).catch(error => {
			this.logger.error(" error on outline post process:", error);
		});
	}
	_disableOutlinePass() {
		this._postToDOMAsync("disable-outline-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}


	_enableRGBShift(angle, amount, controls) {
		this._postToDOMAsync("enable-rgbshift-pass", {
			angle: angle,
			amount: amount,
			controls: controls
		}).then(response => {
			this.logger.info("RGBShift post process enabled:", response);
		}).catch(error => {
			this.logger.error("Error on enable RGBShift postprocess:", error);
		});
	}
	_disableRGBShiftPass() {
		this._postToDOMAsync("disable-rgbshift-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableSSAO(kernalRadius, minDistance, maxDistance, controls) {
		this._postToDOMAsync("enable-ssao-pass", {
			kernelRadius: kernalRadius,
			minDistance: minDistance,
			maxDistance: maxDistance,
			controls: controls
		}).then(response => {
			this.logger.info("SSAO post process enabled:", response);
		}).catch(error => {
			this.logger.error("Error on enable SSAO postprocess:", error);
		});
	}
	_disableSSAOPass() {
		this._postToDOMAsync("disable-ssao-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableFilmPass(noise, scanlines, count, grayscale, controls) {
		this._postToDOMAsync("enable-film-pass", {
			noise: noise,
			scanlines: scanlines,
			count: count,
			grayscale: grayscale,
			controls: controls
		}).then(response => {
			this.logger.info("Film post process enabled:", response);
		}).catch(error => {
			this.logger.error("Error on enable film postprocess:", error);
		});
	}
	_disableFilmPass() {
		this._postToDOMAsync("disable-film-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableAfterImagePass(damp, controls) {
		this._postToDOMAsync("enable-after-image-pass", {
			damp: damp,
			controls: controls
		}).then(response => {
			this.logger.info("AfterImage post process enabled:", response);
		}).catch(error => {
			this.logger.error("Error on enable AfterImage postprocess:", error);
		});
	}
	_disableAfterImagePass() {
		this._postToDOMAsync("disable-afterimage-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableGlitchPass(gowild, controls) {
		this._postToDOMAsync("enable-glitch-pass", {
			gowild: gowild,
			controls: controls
		}).then(response => {
			this.logger.info("Glitch post process enabled:", response);
		}).catch(error => {
			this.logger.error("Error on enable glitch postprocess:", error);
		});
	}
	_disableGlitchPass() {
		this._postToDOMAsync("disable-glitch-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_enableBokehPass(focus, aperture, maxblur, controls) {
		this._postToDOMAsync("enable-bokeh-pass", {
			focus: focus,
			aperture: aperture,
			maxblur: maxblur,
			controls: controls
		}).then(response => {
			this.logger.info("Bokeh post process enabled:", response);
		}).catch(error => {
			this.logger.error("Error on enable bokeh postprocess:", error);
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
			textureType: textureType,
			threshold: threshold,
			useCustomTexture: useCustomTexture,
			customTexturePath: customTexturePath,
			duration: duration,
			easingIndex: easing,
			controls: controls
		}).then(response => {
			this.logger.info("Scene transition post process enabled:", response);
		}).catch(error => {
			this.logger.error("Error on enable pixel postprocess:", error);
		});
	}
	_disableSceneTransitionPass() {
		this._postToDOMAsync("disable-scenetransition-pass", {
		}).then(response => {

		}).catch(error => {

		});
	}
	_cameraToObjectRay(e) {
		this._postToDOMAsync("camera-to-object-ray", { "objectId": e }).then(response => {
			this._raycastHits = response.hits;

			if (this._raycastHits.length > 0)
				this._onRaycastHit(this._raycastHits)
		}).catch(error => {

		});
	}
	_cameraToScreenRay(e) {

		this._postToDOMAsync("camera-to-screen-ray", {
			"x": e.x,
			"y": e.y,
			"raylength": e.raylength
		}).then(response => {
			this._raycastHits = response.hits;

			if (this._raycastHits.length > 0)
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
	_originToDirectionalRay(e) {
		this._postToDOMAsync("origin-to-directional-ray", e

		).then(response => {
			this._raycastHits = response.hits;

			if (this._raycastHits.length > 0)
				this._onRaycastHit(this._raycastHits)
		}).catch(error => {

		});
	}
	_onRaycastHit(raycastHits) {
		const firstHit = raycastHits[0];
		if (firstHit) {
			this.latestRaycastHit = {
				objectId: firstHit.objectId || null,
				point: firstHit.point,
				distance: firstHit.distance,
				uv: firstHit.uv || null,
				faceIndex: firstHit.faceIndex || 0,
				updated: true,
				normal: { x: firstHit.normal.x, y: firstHit.normal.y, z: firstHit.normal.z }
			};

			this._trigger(
				C3.Plugins.Jammanna_MakeIt3D.Cnds.OnRaycastHit
			);

		}
		let eventdata = {
			firstHit: firstHit,
			allHits: raycastHits
		};
		this.dispatchCustomEvent("onraycasthit", eventdata)
	}
	_ignoreRaycast(e) {
		this._postToDOM("ignore-raycast", e)
	}
	_setRotationFromNormal(e) {
		this._postToDOM("set-rotation-from-normal", e)
	}
	_destroyObject(e) {
		if (!e.objectId) {
			this.logger.error("DestroyObject: objectId is required");
			return;
		}
		this._postToDOMAsync("destroy-object", {
			objectId: e.objectId
		}).then(response => {
			if (response.success) {
				this.logger.info("Object destroyed successfully:", e.objectId);
				// Remove from cache
				delete this._objectCache[e.objectId];
				this._lastDestroyedObjectId = e.objectId;
				// Trigger the condition with the object ID
				this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnObjectDestroyed, e.objectId);
				this.dispatchCustomEvent("onobjectdestroy", { objectId: this._lastDestroyedObjectId })
			}
		}).catch(error => {
			this.logger.error("Error destroying object:", error);
			this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnObjectDestructionFailed, e.objectId, error.message);
		}
		);
	}
	_getInstance(object) {
		const objectName = object.name
		let test = this._objectCache[objectName]

	}
	GetObjectInstanceIds(objectType) {
		if (!objectType || !objectType.name)
			return [];

		const baseName = objectType.name;
		const prefix = `${baseName}_${this._getUID(objectType)}`;
		const allKeys = Object.keys(this._objectCache);
		console.warn(this._currentObject.objectId)
		// Step 1: Exact match with currentObjectId
		if (this._currentObject.objectId && this._currentObject.objectId.includes(prefix) && this._objectCache[this._currentObject.objectId]) {
			return this._currentObject.objectId;
		}

		// // Step 2: Fallback — find all instances matching baseName_
		// const matching = allKeys.filter(key => key.startsWith(prefix));
		// console.log("picking not worked", this._currentObject.objectId)
		// if (matching.length > 0) {
		// 	return matching[0]; // return first instance as fallback
		// }

		// Step 3: Nothing found
		return "";
	}
	// GetObjectInstanceIds(objectType) {
	// 	if (!objectType || !objectType.name) {
	// 		return "";
	// 	}

	// 	const objectName = objectType.name;
	// 	console.log("1111jjjhjh")
	// 	// Return currently picked object ID for this type
	// 	if (this._currentObjects.has(objectName)) {
	// 		console.log(this._currentObjects.get(objectName))
	// 		return this._currentObjects.get(objectName);
	// 	}
	// 	console.log("2222jjjhjh")
	// 	// Fallback: find first instance of this object type in cache
	// 	const uid = this._getUID(objectType);
	// 	if (!uid) return "";

	// 	const prefix = `${objectName}_${uid}_`;
	// 	const allKeys = Object.keys(this._objectCache);
	// 	const matching = allKeys.filter(key => key.startsWith(prefix));

	// 	if (matching.length > 0) {
	// 		// Set first found as current and return it
	// 		this._currentObjects.set(objectName, matching[0]);
	// 		console.log(this._currentObjects.get(objectName))
	// 		return matching[0];
	// 	}
	// 	console.log("jjjhjh")
	// 	return "";
	// }
	_getUID(Object) {
		const objType = this.runtime.objects[Object.name];
		if (!objType)
			return "";

		const inst = objType.getFirstPickedInstance();
		return inst ? inst.uid : "";
	}

	_getFinalObjectId(Object, instanceId) {
		return Object.name + "_" + this._getUID(Object) + "_" + instanceId;
	}
	_addChildToParent(e) {
		this._postToDOMAsync("add-child-to-parent", e).then(response => {
			if (response.success) {
				this.logger.info(response.message);

			}
		}).catch(error => {
			this.logger.error("Error adding child:", error);
		}
		);
	}
	_removeChildFromParent(e) {
		this._postToDOMAsync("remove-child-from-parent", e).then(response => {
			if (response.success) {
				this.logger.info(response.message);
			}
		}
		).catch(error => {
			this.logger.error("Error removing child:", error);
		}
		);
	}
	_setBackgroundColor(e) {
		this._postToDOMAsync("set-background-color", e)
	}
	_setBackgroundTexture(e) {
		this._postToDOMAsync("set-background-texture", e)
	}
	_setBackgroundEquiRect(e) {
		this._postToDOMAsync("set-background-equirect", e)
	}
	_setSceneEnvironmentMap(e) {
		this._postToDOMAsync("set-scene-environment-map", e)
	}
	_setSceneFog(e) {
		this._postToDOMAsync("set-scene-fog", e)
	}
	_enableLightShadows(e) {
		this._postToDOM("enable-light-shadows", e)
	}
	_setLightShadowResolution(e) {
		this._postToDOM("set-shadow-resolution", e)
	}
	_setShadowBias(e) {
		this._postToDOM("set-shadow-bias", e)
	}
	_setLightShadowRadius(e) {
		this._postToDOM("set-shadow-radius", e)
	}
	_setDirectionalShadowBounds(e) {
		this._postToDOM("set-directional-light-bounds", e)
	}
	_setSpotLightShadowFov(e) {
		this._postToDOM("set-spot-light-fov", e)
	}
	_setObjectShadowProperties(e) {
		this._postToDOM("set-object-shadow", e)
	}
	_setMaterialAlpha(e) {
		this._postToDOM("set-material-alpha", e)
	}
	_createGroup(e) {
		this._postToDOMAsync("create-group", e).then(response => {
			if (response.success) {
				this._onObjectAdded(response)
			}
		})
	}
	_addToGroup(e) {
		this._postToDOM("add-to-group", e)
	}
	_removeFromGroup(e) {
		this._postToDOM("remove-from-group", e)
	}
	_deleteGroup(e) {
		this._postToDOM("delete-group", e).then(response => {
			if (response.success) {
				delete this._objectCache[e.objectId];
				this._lastDestroyedObjectId = e.objectId;
				// Trigger the condition with the object ID
				this._trigger(C3.Plugins.Jammanna_MakeIt3D.Cnds.OnObjectDestroyed, e.objectId);
				this.dispatchCustomEvent("onobjectdestroy", { objectId: this._lastDestroyedObjectId })
			}
		})
	}
	async _LoadCustomJsonModel(e) {
		await this._postToDOMAsync("load-json-model-from-path", {
			objectId: e.objectId,
			path: e.finalpath,
			position: e.position || { x: 0, y: 0, z: 0 },
			rotation: e.rotation || { x: 0, y: 0, z: 0 },
			scale: e.scale || { x: 0.5, y: 0.5, z: 0.5 },
			visible: e.visible
		})
			.then(response => {
				this.logger.info("Model loaded successfully:", response);
				this._onObjectAdded(response);
			})
			.catch(error => {

			});
	}
	_setLightShadowRange(e) {
		this._postToDOM("set-light-shadow-range", e)
	}
	async loadProjectData() {
		try {
			const projectData = await this.runtime.assets.fetchJson('data.json');
			const objects = projectData.project[3];

			const textureCatalog = {};

			for (const object of objects) {
				const objectName = object[0];
				textureCatalog[objectName] = {};
				const animations = object[7];
				const staticImage = object[6];

				if (!animations && !staticImage) continue;

				if (!animations && staticImage) {
					// Static image only
					const url = staticImage[0];
					const rotated = !!staticImage[6];
					const x = staticImage[2];
					const y = staticImage[3];
					const width = staticImage[4];
					const height = staticImage[5];
					const pivotX = width / 2;
					const pivotY = height / 2;
					

					textureCatalog[objectName]['default'] = [{
						url,
						x, y, width, height,
						rotated,
						pivotX,
						pivotY,
					}];
					continue;
				}
				//console.log(animations)
				// Multiple animations
				for (const animation of animations) {
					const animationName = animation[0];
					const frames = animation[7];
					textureCatalog[objectName][animationName] = [];
					textureCatalog[objectName][animationName].speed  = animation[1]
					for (const frame of frames) {
						//console.log(frame)
						const url = frame[0];
						const rotated = !!frame[6];
						const x = frame[2];
						const y = frame[3];
						const width = rotated ? frame[5] : frame[4];
						const height = rotated ? frame[4] : frame[5];
						const pivotX = frame[8];
						const pivotY = frame[9];
						const frameDuration = frame[7]
						textureCatalog[objectName][animationName].push({
							url,
							x, y, width, height,
							rotated,
							pivotX,
							pivotY,
							frameDuration
						});
					}
				}
			}

			this.textureCatalog = textureCatalog;

			// Send catalog to DOM side
			this._postToDOM("initTextureCatalog", {
				catalog: textureCatalog
			});

			return textureCatalog;

		} catch (error) {
			console.error("❌ Error loading project data:", error);
			return null;
		}
	}
	_setTextureFromSprite(e)
	{
		
		this.setObjectFrame(e.objectId, e.objectType, e.animationName, e.frameIndex, e.magfilter, e.minfilter);
	}
	// Set specific frame
	setObjectFrame(objectId, objectType, animationName, frameIndex, magfilter=0, minfilter=0) {
		//console.log(objectId, objectType, animationName, frameIndex = 0)
		this._postToDOM("setFrame", {
			objectId,
			objectType,
			animationName,
			frameIndex,
			magfilter,
			minfilter
		});
	}

	// Start animation
	startAnimation(objectId, objectType, animationName, options = {}) {
		this._postToDOM("startAnimation", {
			objectId,
			objectType,
			animationName,
			options: {
				loop: options.loop !== false,
				speed: options.speed || 1,
				duration: options.duration || 1000,
				startFrame: options.startFrame || 0,
				textureSize: options.textureSize || { width: 512, height: 1024 }
			}
		});
	}

	// Stop animation
	stopAnimation(objectId) {
		this._postToDOM("stopAnimation", { objectId });
	}

	async _addSpineObject(e) {
		await this._postToDOMAsync("load-spine-object", e)
			.then(response => {
				if (response && response.success) {
					this._onObjectAdded(response);
				} else {
					//this.logger.error("Failed to set camera position:", response?.error);
				}
			})
			.catch(error => {
				//this.logger.error("Error setting camera position:", error);
			});
	}
	_playSpineAnimation(e)
	{
		this._postToDOM("play-spine-animation", e);
	}
	_setSpineSkin(e)
	{
		this._postToDOM("set-spine-skin", e);
	}
	_setMixDuration(e)
	{
		this._postToDOM("set-mix-duration", e);
	}
	_setSpineSpeed(e)
	{
		this._postToDOM("set-spine-speed", e);
	}
	_stopSpineAnimation(e)
	{
		this._postToDOM("stop-spine-animation", e);
	}





};
class Logger {
	constructor(enabled = false, prefix = "MyPlugin") {
		this.enabled = enabled;
		this.prefix = prefix;
	}

	_print(label, style, ...args) {
		if (!this.enabled) return;
		console.log(
			`%c${label}%c`,
			style,
			"color: inherit;",
			...args
		);
	}

	info(...args) {
		this._print(
			`[${this.prefix} INFO]`,
			"color: #2196F3; border: 1px solid #2196F3; padding: 1px 4px; border-radius: 6px; font-weight: bold; font-size: 11px;",
			...args
		);
	}

	debug(...args) {
		this._print(
			`[${this.prefix} DEBUG]`,
			"color: #9E9E9E; border: 1px solid #9E9E9E; padding: 1px 4px; border-radius: 6px; font-style: italic; font-size: 11px;",
			...args
		);
	}

	warn(...args) {
		this._print(
			`[${this.prefix} WARN]`,
			"color: #FFC107; border: 1px solid #FFC107; padding: 1px 4px; border-radius: 6px; font-weight: bold; font-size: 11px;",
			...args
		);
	}

	error(...args) {
		this._print(
			`[${this.prefix} ERROR]`,
			"color: #F44336; border: 1px solid #F44336; padding: 1px 4px; border-radius: 6px; font-weight: bold; font-size: 11px; background: rgba(244,67,54,0.1);",
			...args
		);
	}
}