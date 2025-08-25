const C3 = globalThis.C3;

C3.Plugins.Jammanna_MakeIt3D.Exps =
{
	DocumentTitle() {
		// This returns the copy of the document title held on the runtime side.
		return this._documentTitle;
	},

	// Simple RGB color expression
	RGB(r, g, b) {
		// Ensure values are in range 0-255
		r = Math.max(0, Math.min(255, Math.floor(r)));
		g = Math.max(0, Math.min(255, Math.floor(g)));
		b = Math.max(0, Math.min(255, Math.floor(b)));

		// Combine into a single color value
		return (r << 16) | (g << 8) | b;
	},
	RGBA(r, g, b, a) {
		r = Math.max(0, Math.min(255, Math.floor(r)));
		g = Math.max(0, Math.min(255, Math.floor(g)));
		b = Math.max(0, Math.min(255, Math.floor(b)));

		// Handle both 0-1 decimal and 0-255 integer alpha
		if (a <= 1.0) {
			a = Math.floor(a * 255); // Convert 0-1 to 0-255
		}
		a = Math.max(0, Math.min(255, Math.floor(a)));

		return (r << 24) | (g << 16) | (b << 8) | a;
	},

	GetObjectAnimationsArray(objectId)
	{
		return this._GetAllAnimationNamesArray(objectId);
	},
	GetObjectAnimationCount(objectId)
	{
		return this._GetAnimationCount(objectId);
	},
	GetObjectAnimationDuration(objectId, name_index)
	{
		return this._GetAnimationDuration(objectId, name_index);
	},
	GetCurrentAnimationName()
	{
		return this._currentObject.animations[this._currentForeachIndex].name;
	},
	GetCurrentAnimationDuration() {
		return this._currentObject.animations[this._currentForeachIndex].duration;
	},
	GetErrorMsg()
	{
		return this._last_error_msg;
	},
	Vector3(x,y,z) 
	{
		return {
			x: x,
			y: y,
			z: z
		};
	},
	Uniforms(inputStr) {
		const uniforms = {};
		if (!inputStr || typeof inputStr !== "string") return uniforms;

		const entries = inputStr.split(",");
		entries.forEach(entry => {
			const [name, type, value] = entry.split(":");
			if (!name || !type || value === undefined) return;

			switch (type.trim()) {
				case "f":
					uniforms[name] = { value: parseFloat(value) };
					break;
				case "i":
					uniforms[name] = { value: parseInt(value, 10) };
					break;
				case "c":
					// color stored as hex string
					uniforms[name] = { value: value };
					break;
				case "v2": {
					const [x, y] = value.split("|").map(Number);
					uniforms[name] = { value: [x, y] };
					break;
				}
				case "v3": {
					const [x, y, z] = value.split("|").map(Number);
					uniforms[name] = { value: [x, y, z] };
					break;
				}
			}
		});

		return uniforms;
	},
	IsThreeJsLoaded()
	{
		return this._isThreeJsLoaded?1:0
	},
	IsObjectLoaded(objectId)
	{
		return Object.prototype.hasOwnProperty.call(this._objectCache, objectId)?1:0;

	},
	// Basic raycast hit expressions
	RaycastHitX() {
		return this.latestRaycastHit.point?.x ?? 0;
	},

	RaycastHitY() {
		return this.latestRaycastHit.point?.y ?? 0;
	},

	RaycastHitZ() {
		return this.latestRaycastHit.point?.z ?? 0;
	},
	RaycastHitNormalX() {
		return this.latestRaycastHit.normal?.x ?? 0;
	},

	RaycastHitNormalY() {
		return this.latestRaycastHit.normal?.y ?? 0;
	},

	RaycastHitNormalZ() {
		return this.latestRaycastHit.normal?.z ?? 0;
	},


	RaycastDistance() {
		return this.latestRaycastHit.distance ?? 0;
	},

	RaycastObjectId() {
		return this.latestRaycastHit.objectId ?? "";
	},

	RaycastObjectName() {
		// Optional: if you store the object and it has a name
		const obj = this._objectCache?.[this.latestRaycastHit.objectId];
		return obj?.object?.name ?? "";
	},

	Raycast_UV_U() {
		return this.latestRaycastHit.uv?.x ?? 0;
	},

	Raycast_UV_V() {
		return this.latestRaycastHit.uv?.y ?? 0;
	},

	RaycastFaceIndex() {
		return this.latestRaycastHit.faceIndex ?? -1; // If you're tracking faceIndex, add it to your hit structure
	},

	RaycastHitJSON() {
		return JSON.stringify(this.latestRaycastHit);
	},
	PositionX(objectId)
	{
		return this._objectCache[objectId].position.x||0;
	},
	PositionY(objectId) {
		return this._objectCache[objectId].position.y || 0;
	},
	PositionZ(objectId) {
		return this._objectCache[objectId].position.z || 0;
	},
	RotationX(objectId) {
		console.log(this._objectCache[objectId])
		return this._objectCache[objectId].rotation.x || 0;
	},
	RotationY(objectId) {
		return this._objectCache[objectId].rotation.y || 0;
	},
	RotationZ(objectId) {
		return this._objectCache[objectId].rotation.z || 0;
	},
	ScaleX(objectId) {
		return this._objectCache[objectId].scale.x || 0;
	},
	ScaleY(objectId) {
		return this._objectCache[objectId].scale.y || 0;
	},
	ScaleZ(objectId) {
		return this._objectCache[objectId].scale.z || 0;
	},
	ToArray(...args)
	{
		return args;
	}

}
