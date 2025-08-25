const C3 = globalThis.C3;

C3.Plugins.Jammanna_MakeIt3D.Cnds =
{
	OnThreeJsLoad() {
		return true;
	},
	OnSceneCreated() {
		return true;
	},
	OnSceneCreateFail() {
		return true;
	},
	OnThreeJsLoadFail() {
		return true;
	},
	TestTrigger() {
		console.log("OnTestTrigger fired!");
		return true;
	},
	OnObjectAdded(objectIdParam) {
		// If no specific objectId is requested, trigger for any object
		if (!objectIdParam) {
			return true;
		}
		
		// Get the last added object ID from the runtime
		const lastAddedObjectId = this._lastAddedObjectId;
		console.log("Checking object ID match:", { requested: objectIdParam, actual: lastAddedObjectId });
		
		// Return true if the IDs match
		return objectIdParam === lastAddedObjectId;
	},
	IsObjectLoaded(objectIdParam) {
		// If no specific objectId is requested, trigger for any object
		if (!objectIdParam) {
			return true;
		}
		// Return true if the IDs exist in the cache
		return this._objectCache[objectIdParam]? true : false;
	},
	OnAnimationClipFinished(objectId, name_index) {
		let animationName = null;
		let animationIndex = null;
		console.log("==========Trest00000000=========")
		// Detect whether name_index is a name or index
		if (typeof name_index === "string") {
			animationName = name_index;
		} else if (typeof name_index === "number" && !isNaN(name_index)) {
			animationIndex = name_index;
		} else if (name_index !== undefined && name_index !== null) {
			console.warn("Unexpected type for name_index:", name_index);
		}
		console.log("==========Trest1111111=========")
		// If no filters are given, trigger on any animation clip finish
		const noFilters = !objectId && animationName === null && animationIndex === null;
		if (noFilters) {
			return true;
		}
		// Check objectId
		if (objectId && this._lastAnimationFinished?.objectId !== objectId) {
			return false;
		}
		console.log("==========Trest22222222=========")
		// Check animation name
		if (animationName && this._lastAnimationFinished?.name !== animationName) {
			return false;
		}
		// Check animation index (careful: 0 is valid)
		if (animationIndex !=-1 && this._lastAnimationFinished?.index !== animationIndex) {
			return false;
		}
		return true;
	},
	OnAnimationLoopFinished(objectId, name_index) {
		let animationName = null;
		let animationIndex = null;
		
		// Detect whether name_index is a name or index
		if (typeof name_index === "string") {
			animationName = name_index;
		} else if (typeof name_index === "number" && !isNaN(name_index)) {
			animationIndex = name_index;
		} else if (name_index !== undefined && name_index !== null) {
			console.warn("Unexpected type for name_index:", name_index);
		}
		// If no filters are given, trigger on any animation clip finish
		const noFilters = !objectId && animationName === null && animationIndex === null;
		if (noFilters) {
			return true;
		}
		// Check objectId
		if (objectId && this._lastAnimationFinished?.objectId !== objectId) {
			return false;
		}
		// Check animation name
		if (animationName && this._lastAnimationFinished?.name !== animationName) {
			return false;
		}
		// Check animation index (careful: 0 is valid)
		if (animationIndex !=-1 && this._lastAnimationFinished?.index !== animationIndex) {
			return false;
		}

		return true;
	},
	OnObjectCreationFailed()
	{
		return true;
	},
	OnRaycastHit()
	{
		return true;
	},
	ForeachAnimation(objectId)
	{
		const loopCtx = this.runtime.sdk.createLoopingConditionContext();
		const animations = this._objectCache[objectId].animations;
		this._currentObject = this._objectCache[objectId];
		for (let i = 0; i < animations.length; ++i) {
			loopCtx.retrigger();
			this._currentForeachIndex = i;
			console.log()
			if (loopCtx.isStopped)
				break;
		}

		loopCtx.release();
	}

}
