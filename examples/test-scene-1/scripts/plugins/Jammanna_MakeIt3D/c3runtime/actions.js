import * as Utils from "./utils.js";
const C3 = globalThis.C3;

C3.Plugins.Jammanna_MakeIt3D.Acts =
{
	SetDocumentTitle(title) {
		// Update the copy of the document title held on the instance.
		this._documentTitle = title;

		// Post a message to the domSide.js script to update the document title.
		this._postToDOM("set-document-title", {
			"title": title
		});
	},
	ConsoleMessage(text) {
		this._msg = text;
		this._postToDOM("console-msg", {
			"msg": text
		});
	},
	LoadThreeJsLibraries() {
		this._LoadThreeJsLibraries();
	},
	async CheckThreeJsLoaded() {
		await this._onCheckThreeJsLoaded();
		return true;
	},
	async CreateScene(layer, addbasiclighting, usePostprocessing, isAxesHelperEnabled, isGridHelperEnabled, isOrbitControlsEnabled) {
		await this._OnCreateScene(
			{
				layerIndex: layer.index,
				addbasiclighting: addbasiclighting,
				isAxesHelperEnabled: isAxesHelperEnabled,
				isGridHelperEnabled: isGridHelperEnabled,
				isOrbitControlsEnabled: isOrbitControlsEnabled,
				useSceneCamera: false,
				usePostprocessing: usePostprocessing,
				isLoadFromJson: false
			}
		);
	},
	async LoadSceneFromJson(layer, path,useSceneCamera, usePostprocessing, isAxesHelperEnabled, isGridHelperEnabled) {
		
		 await this._OnCreateScene(
			{
				layerIndex: layer.index,
				addbasiclighting: false,
				isAxesHelperEnabled: isAxesHelperEnabled,
				isGridHelperEnabled: isGridHelperEnabled,
				usePostprocessing: usePostprocessing,
				useSceneCamera:useSceneCamera,
				isLoadFromJson:true,
				path:path
			}
		);
	},
	LaunchSceneEditor()
	{
		this._launchSceneEditor();
	},
	ManualUpdateRenderLoop(dt)
	{
		this._updateRenderLoop({"dt":dt})
	},
	AddTestCube() {
		this._postToDOM("add-test-cube", {});
	},
	AddPrimitiveShape(id, primitivetype, position, rotation, color, scale) {
		// Convert primitive type to string
		let type = "cube"; // default to cube
		switch (primitivetype) {
			case 0:
				type = "cube";
				break;
			case 1:
				type = "box";
				break;
			case 2:
				type = "cylinder";
				break;
			case 3:
				type = "sphere";
				break;
			case 4:
				type = "plane";
				break;
		}
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);



		// Handle scale as a single value
		const scaleValue = Number(scale);
		const validScale = isNaN(scaleValue) || scaleValue <= 0 ? 1 : scaleValue;

		// Log the values for debugging

		this._addPrimitiveAtPosition({
			"type": type,
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"scale": validScale,
			"objectId": id
		}
		);
	},

	SetObjectTransform(id, property, x, y, z) {
		//console.log("Setting object properties:", { id, property, x, y, z });
		const properties = ["position", "rotation", "scale"];
		const selectedProperty = properties[property];
		this._postToDOM("set-object-property", {
			"objectId": id,
			"value": {
				"x": x,
				"y": y,
				"z": z,
			},
			"property": selectedProperty

		});
	},
	SetObjectPosition(objectId, x, y, z, lerp) {
		//console.log("Setting object position:", { objectId, x, y, z });
		this._setObjectProperty({
			objectId: objectId,
			property: "position",
			value: {
				x: parseFloat(x) || 0,
				y: parseFloat(y) || 0,
				z: parseFloat(z) || 0
			},
			lerp:lerp
		});
	},
	SetObjectTranslation(objectId, x, y, z, lerp)
	{
		this._setObjectProperty({
			objectId: objectId,
			property: "translation",
			value: {
				x: parseFloat(x) || 0,
				y: parseFloat(y) || 0,
				z: parseFloat(z) || 0
			},
			lerp: lerp
		});
	},
	SetObjectRotation(objectId, x, y, z,lerp) {
		//console.log("Setting object rotation:", { objectId, x, y, z });
		this._setObjectProperty( {
			objectId: objectId,
			property: "rotation",
			value: {
				x: parseFloat(x) || 0,
				y: parseFloat(y) || 0,
				z: parseFloat(z) || 0
			},
			lerp: lerp
		});
	},
	SetRotationFromNormal(objectId, nx, ny, nz,upvector, lerp) {
		// Sanitize inputs
		nx = isNaN(parseFloat(nx)) ? 0 : parseFloat(nx);
		ny = isNaN(parseFloat(ny)) ? 1 : parseFloat(ny);
		nz = isNaN(parseFloat(nz)) ? 0 : parseFloat(nz);

		// // Normalize the normal vector (important for accurate calculations)
		// const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
		// if (length > 0) {
		// 	nx /= length;
		// 	ny /= length;
		// 	nz /= length;
		// }

		// // Calculate rotation angles from normal
		// // For aligning an object's up vector with the normal:

		// // Yaw (Y rotation) - rotation around Y axis
		// let yaw = Math.atan2(nx, nz) * 180 / Math.PI;

		// // Pitch (X rotation) - rotation around X axis
		// // Using atan2 for proper quadrant handling
		// let pitch = Math.atan2(-ny, Math.sqrt(nx * nx + nz * nz)) * 180 / Math.PI;

		// // Roll (Z rotation) - typically 0 for normal alignment
		// let roll = 0;

		//upvector 1 = {x:1,y:0,z:0} etccc
		let up_vector ={
			x:0,
			y:1,
			z:0
		}
		switch (upvector) {
			case 0:
				up_vector = { x: 1, y: 0, z: 0 }; // example for Position
				break;
			case 1:
				up_vector = { x: 0, y: 1, z: 0 }; // example for Rotation
				break;
			case 2:
				up_vector = { x: 0, y: 0, z: 1 }; // example for Scale
				break;
			default:
				// fallback value or warning
				up_vector = { x: 0, y: 1, z: 0 };
				break;
		}

		this._setRotationFromNormal(
			{
				objectId: objectId,
				hitObjectId:this.latestRaycastHit.objectId,
				value: {
					x: nx,
					y: ny,
					z: nz
				},
				upvector : up_vector,
				lerp: lerp
			}
		)

		// this._setObjectProperty({
		// 	objectId: objectId,
		// 	property: "normal-rotation",
		// 	value: {
		// 		x: nx,
		// 		y: ny,
		// 		z: nz
		// 	},
		// 	lerp: lerp
		// });
	},


	SetObjectScale(objectId, x, y, z, lerp) {
		//console.log("Setting object scale:", { objectId, x, y, z });
		this._setObjectProperty({
			objectId: objectId,
			property: "scale",
			value: {
				x: parseFloat(x) || 1,
				y: parseFloat(y) || 1,
				z: parseFloat(z) || 1
			},
			lerp: lerp
		});
	},
	

	SetObjectProperty(objectId, property, value) {
		//console.log("Setting object property:", { objectId, property, value });

		// Convert position values to numbers if they're strings
		if (typeof value === "object") {
			value = {
				x: parseFloat(value.x) || 0,
				y: parseFloat(value.y) || 0,
				z: parseFloat(value.z) || 0
			};
		}

		this._runtime.SendMessageToDOM("set-object-property", {
			objectId: objectId,
			property: property,
			value: value
		});
	},
	TriggerTestCondition() {
		this.triggerTestCondition();
	},
	async LoadCustomModel(objectId, path, position, rotation, scale, isVisible) {
		if (path.endsWith(".glb") || path.endsWith(".fbx")) {
			// proceed with loading the model
			const pos = Utils.Utils.toVector3(position);      // {x: 1, y: 2, z: 3}
			const rot = Utils.Utils.toVector3(rotation);            // {x: 0.5, y: 0.5, z: 0.5}
			const scl = Utils.Utils.toVector3(scale, 0.5); // {x: 1, y: 2, z: 0}
			await this._LoadCustomModel(objectId, path, pos, rot, scl, isVisible);
		} else {
			console.warn("Unsupported file type:", path);
		}
		//console.log(path)
		
	},
	SetOrbitControlProps(
		toggle,
		target,
		minDistance,
		maxDistance,
		minPolarAngle,
		maxPolarAngle,
		minAzimuthAngle,
		maxAzimuthAngle,
		enableDamping,
		dampingFactor
	) {
		const targetPos = Utils.Utils.toVector3(target);

		this._postToDOM("toggle-orbit-control", {
			toggle: toggle,
			target: targetPos,
			minDistance: minDistance,
			maxDistance: maxDistance,
			minPolarAngle: (minPolarAngle),
			maxPolarAngle: (maxPolarAngle),
			minAzimuthAngle: (minAzimuthAngle),
			maxAzimuthAngle: (maxAzimuthAngle),
			enableDamping: enableDamping,
			dampingFactor: dampingFactor
		});
	},
	AdjustCameraProperties(fov_value, nearclip, farclip) {
		this._postToDOM("adjust-camera-properties", {
			fov: fov_value,
			nearclip: nearclip,
			farclip: farclip
		});
	},
	PlayAnimationClip(objectId, animationIndex_Name,fadeDuration, loop, timeScale, clampWhenFinished) {
		// console.log("Playing animation clip:", {
		// 	objectId,
		// 	animationIndex_Name,
		// 	loop,
		// 	timeScale,
		// 	clampWhenFinished
		// });
		this._PlayAnimation(
			objectId,
			animationIndex_Name,
			fadeDuration,
			loop,
			timeScale,
			clampWhenFinished
		);
	},
	BlendAnimations(objectId, animationA_Index_Name, weightA, animationB_Index_Name, weightB, fadeDuration, loopA,loopB, timeScale, clampWhenFinished) {
		this._blendAnimations({
			objectId,
			animationA_Index_Name,
			weightA,
			animationB_Index_Name,
			weightB,
			fadeDuration,
			loopA,
			loopB,
			timeScale,
			clampWhenFinished
		})
	},
	TransitionAnimation(objectId, fromAnimationIndex_Name, toAnimationIndex_Name, fadeDuration, loop, timeScale, clampWhenFinished) 
	{
		this._transitionAnimation(
			{
				objectId, fromAnimationIndex_Name, toAnimationIndex_Name, fadeDuration, loop, timeScale, clampWhenFinished
			}
		)
	},
	ObjectLookAt(objectId, x,y,z ,axis, slerpFactor) {
		// Convert targetPosition to a vector3 object
		axis = Utils.Utils.toVector3(axis, 0);
		this._setObjectLookAt({
			"objectId": objectId,
			"targetLookAt": {
				"x": parseFloat(x) || 0,
				"y": parseFloat(y) || 0,
				"z": parseFloat(z) || 0
			},
			"lookAtAxis": axis,
			"slerpFactor": slerpFactor || 0.1
		});
	},
	PauseAnimationClip(objectId) {
		this._PauseAnimation(objectId);
	},
	ResumeAnimationClip(objectId) {
		this._ResumeAnimation(objectId);
	},
	StopAnimationClip(objectId) {
		this._StopAnimation(objectId);
	},
	AddLightAtPosition(objectId, lightType, position, target, color, intensity, showHelper,controls) {
		// Convert position to a vector3 object
		const pos = Utils.Utils.toVector3(position, 0);
		let targetPos = { x: 0, y: 0, z: 0 };
		let targetId = "";

		if (Utils.Utils.isVector3Object(target)) {
			targetPos = { ...target }; // shallow copy
		} else if (typeof target === "string" && target.trim() !== "") {
			targetId = target.trim();
		}

		// Convert color to a valid hex value
		const colorValue = Number(color);
		let validColor;
		if (typeof colorValue === 'number') {
			validColor = colorValue;
		} else {
			validColor = 0xffffff; // default to white if invalid
			console.warn("Invalid color value:", colorValue);
		}

		switch (lightType) {
			case 0: // Point Light
				lightType = "ambient";
				break;
			case 1: // Directional Light
				lightType = "directional";
				break;
			case 2: // Ambient Light
				lightType = "point";
				break;
			case 3: // Spot Light
				lightType = "spot";
				break;
			case 4: // Hemisphere Light
				lightType = "hemisphere";
				break;
			default:
				lightType = "point"; // default to point light if invalid
				console.warn("Invalid light type:", lightType);
		}
		// Ensure intensity is a positive number
		const validIntensity = Math.max(Number(intensity), 0.1); // default to 0.1 if invalid

		this._addLightAtPosition({
			"objectId": objectId,
			"type": lightType,
			"position": pos,
			"targetPos": targetPos,
			"targetId": targetId,
			"color": validColor,
			"intensity": validIntensity,
			"showHelper": showHelper,
			"controls":controls
		});
	},
	SetCameraPosition(x, y, z) {
		this._setCameraPosition({
			"x": x,
			"y": y,
			"z": z

		});

	},
	SetCameraAngle(x, y, z) {
		this._setCameraAngle({
			"x": x,
			"y": y,
			"z": z

		});

	},
	SetCameraTranslation(x, y, z) {
		this._setCameraTranslation({
			"x": x,
			"y": y,
			"z": z

		});

	},
	CameraLookAt(x, y, z,lerp) {
		this._setCameraLookAt({
			"x": x,
			"y": y,
			"z": z,
			"lerpFatcor": lerp || 0.1

		});

	},
	CameraLookAtObject(objectId,offsetx,offsety,offsetz, lerp) {
		this._setCameraLookAtObject({
			"objectId": objectId,
			"offset": {
				"x": parseFloat(offsetx) || 0,
				"y": parseFloat(offsety) || 0,
				"z": parseFloat(offsetz) || 0
			},
			"lerpFactor": lerp || 0.1
		});
	},
	StopCameraLookAtObject()
	{
		this._setCameraLookAtObject({
			"objectId": "",//no object id so camera will stop lookig at object
		});
	},
	SetCameraFollowObject(objectId, offsetx, offsety, offsetz, lerp)
	{
		this._setCameraFollowObject({
			"objectId": objectId,
			"offset": {
				"x": parseFloat(offsetx) || 0,
				"y": parseFloat(offsety) || 0,
				"z": parseFloat(offsetz) || 0
			},
			"lerpFactor": lerp || 0.1
		});
	},
	StopCameraFollowObject() {
		this._setCameraFollowObject({
			"objectId": "",//no object id so camera will stop following object
		});
	},
	// Add a Point Light
	AddPointLight(objectId, position, color, intensity = 1, distance = 0, decay = 2, showHelper = false,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const colorValue = Number(color) || 0xffffff;
		this._addLightAtPosition({
			objectId,
			type: "point",
			position: pos,
			color: colorValue,
			intensity: Number(intensity),
			distance: Number(distance),
			decay: Number(decay),
			showHelper: !!showHelper,
			"controls":controls
		});
	},

	// Add a Directional Light
	AddDirectionalLight(objectId, position, targetId = "",targetPos, color, intensity = 1, castShadow = false, showHelper = false,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const colorValue = Number(color) || 0xffffff;
		this._addLightAtPosition({
			objectId,
			type: "directional",
			position: pos,
			targetId,
			targetPos:targetPos,
			color: colorValue,
			intensity: Number(intensity),
			castShadow: !!castShadow,
			showHelper: !!showHelper,
			"controls":controls
		});
	},

	// Add an Ambient Light
	AddAmbientLight(objectId, color, intensity = 1, showHelper = false,controls) {
		const colorValue = Number(color) || 0xffffff;
		this._addLightAtPosition({
			objectId,
			type: "ambient",
			color: colorValue,
			intensity: Number(intensity),
			showHelper: !!showHelper,
			"controls":controls
		});
	},

	// Add a Spot Light
	AddSpotLight(objectId, position, targetPos = { x: 0, y: 0, z: 0 }, color, intensity = 1, distance = 0, angle = Math.PI / 3, penumbra = 0, decay = 2, castShadow = false,lightmap_path, showHelper = false,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const colorValue = Number(color) || 0xffffff;
		this._addLightAtPosition({
			objectId,
			type: "spot",
			position: pos,
			targetPos,
			color: colorValue,
			intensity: Number(intensity),
			distance: Number(distance),
			angle: Number(angle),
			penumbra: Number(penumbra),
			decay: Number(decay),
			castShadow: !!castShadow,
			showHelper: !!showHelper,
			"controls":controls,
			"lightmap":lightmap_path
		});
	},

	// Add a Hemisphere Light
	AddHemisphereLight(objectId, position, color, groundColor = 0x444444, intensity = 1, showHelper = false,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const colorValue = Number(color) || 0xffffff;
		const groundColorValue = Number(groundColor) || 0x444444;
		this._addLightAtPosition({
			objectId,
			type: "hemisphere",
			position: pos,
			color: colorValue,
			groundColor: groundColorValue,
			intensity: Number(intensity),
			showHelper: !!showHelper,
			"controls":controls
		});
	},

	AddPlane(id, position, rotation, color, scale, height_segments, width_segments,control) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);



		this._addPrimitiveAtPosition({
			"type": "plane",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"height_segments": height_segments,
			"width_segments": width_segments,
			"controls":control
		});
	},
	AddCube(id, position, rotation, color, scale, height_segments, width_segments, depth_segments, control) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);



		this._addPrimitiveAtPosition({
			"type": "cube",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"height_segments": height_segments,
			"width_segments": width_segments,
			"depth_segments": depth_segments,
			"controls": control
		});
	},

	// Add Icosahedron (20-sided polyhedron)
	AddIcosahedron(id, position, rotation, color, scale, radius, detail,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);

		this._addPrimitiveAtPosition({
			"type": "icosahedron",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"radius": radius || 1,
			"detail": detail || 0,
			"controls":controls
		});
	},

	// Add Torus (donut shape)
	AddTorus(id, position, rotation, color, scale, radius, tube, radialSegments, tubularSegments,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);

		this._addPrimitiveAtPosition({
			"type": "torus",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"radius": radius || 1,
			"tube": tube || 0.4,
			"radialSegments": radialSegments || 8,
			"tubularSegments": tubularSegments || 6,
			controls:controls
		});
	},

	// Add Torus Knot (complex torus with p and q parameters)
	AddTorusKnot(id, position, rotation, color, scale, radius, tube, tubularSegments, radialSegments, p, q,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);

		this._addPrimitiveAtPosition({
			"type": "torusknot",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"radius": radius || 1,
			"tube": tube || 0.4,
			"tubularSegments": tubularSegments || 64,
			"radialSegments": radialSegments || 8,
			"p": p || 2,
			"q": q || 3,
			"controls":controls
		});
	},

	// Add Cone
	AddCone(id, position, rotation, color, scale, radius, height, radialSegments, heightSegments,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);
		const scaleValue = Number(scale);
		const validScale = isNaN(scaleValue) || scaleValue <= 0 ? 1 : scaleValue;

		this._addPrimitiveAtPosition({
			"type": "cone",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"radius": radius || 1,
			"height": height || 2,
			"radialSegments": radialSegments || 8,
			"heightSegments": heightSegments || 1,
			"controls":controls
		});
	},

	// Add Capsule (pill shape)
	AddCapsule(id, position, rotation, color, scale, radius, length, capSegments, radialSegments,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);
		const scaleValue = Number(scale);
		const validScale = isNaN(scaleValue) || scaleValue <= 0 ? 1 : scaleValue;

		this._addPrimitiveAtPosition({
			"type": "capsule",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"radius": radius || 1,
			"length": length || 2,
			"capSegments": capSegments || 4,
			"radialSegments": radialSegments || 8,
			"controls":controls
		});
	},

	// Add Ring (flat ring with inner and outer radius)
	AddRing(id, position, rotation, color, scale, innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);
		const scaleValue = Number(scale);
		const validScale = isNaN(scaleValue) || scaleValue <= 0 ? 1 : scaleValue;

		this._addPrimitiveAtPosition({
			"type": "ring",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"innerRadius": innerRadius || 0.5,
			"outerRadius": outerRadius || 1,
			"thetaSegments": thetaSegments || 8,
			"phiSegments": phiSegments || 1,
			"thetaStart": thetaStart || 0,
			"thetaLength": thetaLength || Math.PI * 2,
			"controls":controls
		});
	},

	// Add Circle (flat circle)
	AddCircle(id, position, rotation, color, scale, radius, segments, thetaStart, thetaLength,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);
		const scaleValue = Number(scale);
		const validScale = isNaN(scaleValue) || scaleValue <= 0 ? 1 : scaleValue;

		this._addPrimitiveAtPosition({
			"type": "circle",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"radius": radius || 1,
			"segments": segments || 32,
			"thetaStart": thetaStart || 0,
			"thetaLength": thetaLength || Math.PI * 2,
			"controls":controls
		});
	},

	// Add Dodecahedron (12-sided polyhedron)
	AddDodecahedron(id, position, rotation, color, scale, radius, detail,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);
		const scaleValue = Number(scale);
		const validScale = isNaN(scaleValue) || scaleValue <= 0 ? 1 : scaleValue;

		this._addPrimitiveAtPosition({
			"type": "dodecahedron",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"radius": radius || 1,
			"detail": detail || 0,
			"controls":controls
		});
	},

	// Add Octahedron (8-sided polyhedron)
	AddOctahedron(id, position, rotation, color, scale, radius, detail,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);
		const scaleValue = Number(scale);
		const validScale = isNaN(scaleValue) || scaleValue <= 0 ? 1 : scaleValue;

		this._addPrimitiveAtPosition({
			"type": "octahedron",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"radius": radius || 1,
			"detail": detail || 0,
			"controls":controls
		});
	},

	// Add Tetrahedron (4-sided polyhedron)
	AddTetrahedron(id, position, rotation, color, scale, radius, detail,controls) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);
		const scaleValue = Number(scale);
		const validScale = isNaN(scaleValue) || scaleValue <= 0 ? 1 : scaleValue;

		this._addPrimitiveAtPosition({
			"type": "tetrahedron",
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"objectId": id,
			"radius": radius || 1,
			"detail": detail || 0,
			"controls":controls
		});
	},
	AddCylinder(id, position, rotation, color, scale, radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength,control) {
		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 1);

		// Helpers to ensure valid numeric input
		const floatOrDefault = (val, def) => (typeof val === 'number' && !isNaN(val) ? val : def);
		const boolOrDefault = (val, def) => typeof val === 'boolean' ? val : def;

		this._addPrimitiveAtPosition({
			type: "cylinder",
			position: pos,
			rotation: rot,
			scale: scl,
			color: color,
			objectId: id,

			// Geometry parameters with default fallback
			radiusTop: floatOrDefault(radiusTop, 1),
			radiusBottom: floatOrDefault(radiusBottom, 1),
			height: floatOrDefault(height, 2),
			radialSegments: floatOrDefault(radialSegments, 8),
			heightSegments: floatOrDefault(heightSegments, 1),
			openEnded: boolOrDefault(openEnded, false),
			thetaStart: floatOrDefault(thetaStart, 0),
			thetaLength: floatOrDefault(thetaLength, Math.PI * 2),
			controls:control
		});
	},


	// Enhanced AddPrimitiveShape with support for all new shapes
	AddAdvancedPrimitiveShape(id, primitiveType, position, rotation, color, scale, radius, detail, tube, radialSegments, tubularSegments, p, q, height, capSegments, innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength, segments) {
		let type = "cube"; // default
		switch (primitiveType) {
			case 0: type = "cube"; break;
			case 1: type = "box"; break;
			case 2: type = "cylinder"; break;
			case 3: type = "sphere"; break;
			case 4: type = "plane"; break;
			case 5: type = "icosahedron"; break;
			case 6: type = "torus"; break;
			case 7: type = "torusknot"; break;
			case 8: type = "cone"; break;
			case 9: type = "capsule"; break;
			case 10: type = "ring"; break;
			case 11: type = "circle"; break;
			case 12: type = "dodecahedron"; break;
			case 13: type = "octahedron"; break;
			case 14: type = "tetrahedron"; break;
		}

		const pos = Utils.Utils.toVector3(position, 0);
		const rot = Utils.Utils.toVector3(rotation, 0);
		const scl = Utils.Utils.toVector3(scale, 0);
		const scaleValue = Number(scale);
		const validScale = isNaN(scaleValue) || scaleValue <= 0 ? 1 : scaleValue;

		const config = {
			"type": type,
			"position": pos,
			"rotation": rot,
			"scale": scl,
			"color": color,
			"scale": validScale,
			"objectId": id
		};

		// Add shape-specific parameters
		if (radius !== undefined) config.radius = radius;
		if (detail !== undefined) config.detail = detail;
		if (tube !== undefined) config.tube = tube;
		if (radialSegments !== undefined) config.radialSegments = radialSegments;
		if (tubularSegments !== undefined) config.tubularSegments = tubularSegments;
		if (p !== undefined) config.p = p;
		if (q !== undefined) config.q = q;
		if (height !== undefined) config.height = height;
		if (capSegments !== undefined) config.capSegments = capSegments;
		if (innerRadius !== undefined) config.innerRadius = innerRadius;
		if (outerRadius !== undefined) config.outerRadius = outerRadius;
		if (thetaSegments !== undefined) config.thetaSegments = thetaSegments;
		if (phiSegments !== undefined) config.phiSegments = phiSegments;
		if (thetaStart !== undefined) config.thetaStart = thetaStart;
		if (thetaLength !== undefined) config.thetaLength = thetaLength;
		if (segments !== undefined) config.segments = segments;

		this._addPrimitiveAtPosition(config);
	},

	// Apply Standard Material
	ApplyStandardMaterial(objectId, color, metalness = 0.5, roughness = 0.5, wireframe = false, emissive = 0x000000, emissiveIntensity,opacity = 1.0) {
		
		this._SetObjectMaterial(objectId, {
			materialType: "standard",
			color,
			metalness,
			roughness,
			wireframe,
			emissive,
			emissiveIntensity,
			opacity
			
		});
	},

	// Apply Phong Material
	ApplyPhongMaterial(objectId, color, shininess = 30, wireframe = false, opacity = 1.0, emissive = 0x000000, emissiveIntensity, specular = 0x111111) {
		
		this._SetObjectMaterial(objectId, {
			materialType: "phong",
			color,
			shininess,
			emissive,
			specular,
			wireframe,
			emissiveIntensity,
			opacity
		});
	},

	// Apply Lambert Material
	ApplyLambertMaterial(objectId, color, wireframe = false, opacity = 1.0, emissive = 0x000000, emissiveIntensity) {
		this._SetObjectMaterial(objectId, {
			materialType: "lambert",
			color,
			emissive,
			wireframe,
			opacity,
			emissiveIntensity
		});
	},

	// Apply Basic Material
	ApplyBasicMaterial(objectId, color, wireframe = false, opacity = 1.0) {
		this._SetObjectMaterial(objectId, {
			materialType: "basic",
			color,
			wireframe,
			opacity
		});
	},

	// Set object visibility
	SetObjectVisible(objectId, visible, visibleNumeric) {
		if(visibleNumeric!=-1)
		{
			visible = visibleNumeric>=1;
		}
		this._SetObjectVisible(objectId, visible);
	},

	SetCustomShaderMaterial(objectId, vertexShader, fragmentShader, uniforms, transparent = false, wireframe = false) {
		uniforms = Utils.Utils.parseUniformString(uniforms);

		// console.log("Setting custom shader material:", {
		// 	objectId,
		// 	vertexShader,
		// 	fragmentShader,
		// 	uniforms,
		// 	transparent,
		// 	wireframe
		// });
		this._SetCustomShaderMaterial(objectId, {
			vertexShader,
			fragmentShader,
			uniforms,
			transparent,
			wireframe
		});
	},

	SetShaderUniform(objectId, name, value) {
		this._SetShaderUniform(objectId, name, value);
	},
	async SetTexture(objectId, url_path) {
		await this._setTexture(
			{
				objectId: objectId,
				path: url_path
			}
		)
		return true;

	},
	SetTextureWrap(objectId, wrapS, wrapT) {
		this._setTextureWrap(objectId, wrapS, wrapT);
	},
	SetTextureRepeat(objectId, x, y) {
		this._setTextureRepeat(objectId, x, y)
	},
	SetTextureOpacity(objectId, opacity) {
		this._setTextureOpacity(objectId, opacity)
	},
	SetNormalMap(objectId, url,invert,strength) {
		const invertValue = invert ? -1 : 1;
		this._setNormalMap(objectId, url,invertValue*strength)
	},
	SetEmissiveMap(objectId, path, emissiveIntensity) {
		this._setEmissiveMap(objectId, path, emissiveIntensity);
	},
	SetRoughnessMap(objectId, url) {
	
		this._setRoughnessMap(objectId, url)
	},
	SetMetalnessMap(objectId, url) {
		this._setMetalnessMap(objectId, url)
	},
	SetColor(objectId,color)
	{
		this._setColor(objectId,color);
	},
	UnloadTexture(objectId) {
		this._disposeTexture(objectId);
	},
	SetVideoTexture(objectId, path, loop = false, autoplay = true, muted = true) {
		return this._setVideoTexture(
			objectId,
			path,
			loop,
			autoplay,
			muted
		)
	},
	EnablePixelatedEdgeEffect(pixelvalue, normalEdgeStrength,depthEdgeStrength,control) {
		this._enablePixelatedEdgeEffect(pixelvalue, normalEdgeStrength, depthEdgeStrength, control);
	},
	EnableBloomPass(strength,radius,threshold,control)
	{
		this._enableBloomPass(strength,radius,threshold,control)
	},
	EnableFXAA()
	{
		this._enableFXAA();
	},
	EnableOutlinePass(selectedObjects,edgeStrength,color,texture,control)
	{
		this._enableOutlinePass(selectedObjects,edgeStrength,color,texture,control)
	},
	ApplySceneTransition(scenejson,textureType,threshold,usecustomTexture,customTexturePath,duration,easing, controls)
	{
		// console.log("Applying scene transition effect with parameters:", {
		// 	scenejson,
		// 	textureType,
		// 	threshold,
		// 	usecustomTexture,
		// 	customTexturePath,
		// 	duration,
		// 	easing,
		// 	controls
		// });
		this._enableSceneTransitionEffect(scenejson,
			textureType,
			threshold,
			usecustomTexture,
			customTexturePath,
			duration,
			easing,
			controls
		);
	},
	DisablePostprocessEffect( effectid)
	{
		switch(effectid)
		{
			case 0:
				//pixelated post process
				this._disablePixelPass();
				break;
			case 1:
				//bloom post process
				this._disableBloomPass();
				break;
			case 2:
				//fxaa post process
				this._disableFXAA();
				break;
			case 3:
				//ouline post process
				this._disableOutlinePass();
				break;
			case 4:
				//rbgshift post process
				this._disableRGBShiftPass();
				
				break;
			case 5:
				//ssao post process
				this._disableSSAOPass();
				
				break;
			case 6:
				//after image post process
				this._disableAfterImagePass();
				
				break;
			case 7:
				//film post process
				this._enableFilmPass();
				break;
			case 8:
				//glitch post process
				this._disableGlitchPass();
				break;
			case 9:
				//bokeh post process
				this._disableBokehPass();
				break;
			case 10:
				//scene transition post process
				this._disableSceneTransitionPass();
				break;
		}
	},
	// Individual Position Components
	SetObjectPositionX(objectId, x, lerp) {
		//console.log("Setting object position X:", { objectId, x });
		this._setObjectProperty({
			objectId: objectId,
			property: "positionx",
			value: parseFloat(x) || 0,
			lerp: lerp
		});
	},

	SetObjectPositionY(objectId, y, lerp) {
		//console.log("Setting object position Y:", { objectId, y });
		this._setObjectProperty({
			objectId: objectId,
			property: "positiony",
			value: parseFloat(y) || 0,
			lerp: lerp
		});
	},

	SetObjectPositionZ(objectId, z, lerp) {
		//console.log("Setting object position Z:", { objectId, z });
		this._setObjectProperty({
			objectId: objectId,
			property: "positionz",
			value: parseFloat(z) || 0,
			lerp: lerp
		});
	},

	// Individual Rotation Components
	SetObjectRotationX(objectId, x, lerp) {
		//console.log("Setting object rotation X:", { objectId, x });
		this._setObjectProperty({
			objectId: objectId,
			property: "rotationx",
			value: parseFloat(x) || 0,
			lerp: lerp
		});
	},

	SetObjectRotationY(objectId, y, lerp) {
		//console.log("Setting object rotation Y:", { objectId, y });
		this._setObjectProperty({
			objectId: objectId,
			property: "rotationy",
			value: parseFloat(y) || 0,
			lerp: lerp
		});
	},

	SetObjectRotationZ(objectId, z,lerp) {
		//console.log("Setting object rotation Z:", { objectId, z });
		this._setObjectProperty({
			objectId: objectId,
			property: "rotationz",
			value: parseFloat(z) || 0,
			lerp: lerp
		});
	},

	// Individual Scale Components
	SetObjectScaleX(objectId, x) {
		//console.log("Setting object scale X:", { objectId, x });
		this._setObjectProperty({
			objectId: objectId,
			property: "scalex",
			value: parseFloat(x) || 1
		});
	},

	SetObjectScaleY(objectId, y) {
		//console.log("Setting object scale Y:", { objectId, y });
		this._setObjectProperty({
			objectId: objectId,
			property: "scaley",
			value: parseFloat(y) || 1
		});
	},

	SetObjectScaleZ(objectId, z) {
		//console.log("Setting object scale Z:", { objectId, z });
		this._setObjectProperty({
			objectId: objectId,
			property: "scalez",
			value: parseFloat(z) || 1
		});
	},
	EnableRGBShiftEffect(angle,amount,control)
	{
		this._enableRGBShift(angle,amount,control);
	},
	EnableSSAOPass(kernalradius,mindistance,maxDistance,control)
	{
		//console.log("enabling ssao")
		this._enableSSAO(kernalradius,mindistance,maxDistance,control)
	},
	EnableFilmPass(noise,scanlines,count,grayscale,controls)
	{
		this._enableFilmPass(noise,scanlines,count,grayscale,controls)
	},
	EnableAfterImagePass(damp,controls)
	{
		this._enableAfterImagePass(damp,controls);
	},
	EnableGlitchPass(gowild,control)
	{
		this._enableGlitchPass(gowild,control);
	},
	EnableBokehPass(focus,aperture,maxblur,control)
	{
		this._enableBokehPass(focus,aperture,maxblur,control)
	},
	CameraToScreenRay(x,y,raylength)
	{
		this._cameraToScreenRay({ x, y,raylength })
	},
	CameraToPointRay(x, y, z)
	{
		this._cameraToPointRay({x, y, z});
	},
	CameraToObjectRay(objectId)
	{
		this._cameraToObjectRay(objectId);
	},
	ObjectToDirectionalRay(objectId,direction, raylength, isDebug)
	{
		this._ObjectToDirectionalRay({ objectId, direction, raylength, isDebug })
	},
	OriginToDirectionalRay(origin,direction,raylength,isDebug)
	{
		this._originToDirectionalRay(
			{ origin, direction, raylength, isDebug }
		)
	},
	IgnoreRaycast(objectId, ignoreRaycast)
	{
		this._ignoreRaycast({ objectId, ignoreRaycast })
	},
	DrawLine(id,startPos, endPos,points,color)
	{
		this._addPrimitiveAtPosition({
			"type": "line",
			"startPos": startPos,
			"endPos": endPos,
			"color": color,
			"points":points,
			"isDashed": false,
			"objectId": id || "line",
			"canUpdatable":true
		});
	},
	DrawDashedLine(id,startPos,endPos,points, color,dashSize,gapSize,linescale) {
		//this._drawLine({ startX, startY, startZ, endX, endY, endZ, isDashed, color,dashSize,gapSize,scale })
		this._addPrimitiveAtPosition({
			"type": "line",
			"startPos": startPos,
			"endPos": endPos,
			"lineScale": linescale,
			"points": points,
			"color": color,
			"isDashed":true,
			"objectId": id || "dashedline",
			"dashSize": dashSize,
			"gapSize": gapSize
		});
	},
	


	
}

