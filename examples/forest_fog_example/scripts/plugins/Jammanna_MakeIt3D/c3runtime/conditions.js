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
		return true;
	},
	OnObjectAdded(id) {
		// If no specific instaceId is requested, trigger for any object
		
		if (id === undefined) {
			return true;
		}
		
		// Get the last added object ID from the runtime
		const lastAddedObjectId = this._lastAddedObjectId;
		// Return true if the IDs match
		return id === lastAddedObjectId;
	},
	IsObjectLoaded(id) {
		// If no specific instaceId is requested, trigger for any object
		if (id === undefined) {
			return true;
		}
		// Return true if the IDs exist in the cache
		return this._objectCache[id]? true : false;
	},
	OnSpineAnimationStarted(objectId, animationName)
	{
		if (objectId && this._onSpineAnimation?.objectId !== objectId) {
			return false;
		}
		if (animationName && this._onSpineAnimation?.name !== animationName) {
			return false;
		}
		return true;
	},
	OnSpineAnimationCompleted(objectId, animationName) {
		// Check if objectId matches
		if (objectId && this._onSpineAnimation?.objectId !== objectId) {
			return false;
		}
		// Check if animationName matches
		if (animationName && this._onSpineAnimation?.name !== animationName) {
			return false;
		}
		// Status must be 1 (completed)
		if (this._onSpineAnimation?.status !== 1) {
			return false;
		}
		return true;
	},

	OnSpineAnimationEnded(objectId, animationName) {
		// Check if objectId matches
		if (objectId && this._onSpineAnimation?.objectId !== objectId) {
			return false;
		}
		// Check if animationName matches
		if (animationName && this._onSpineAnimation?.name !== animationName) {
			return false;
		}
		// Status must be 2 (ended)
		if (this._onSpineAnimation?.status !== 2) {
			return false;
		}
		return true;
	},

	OnSpineEventFired(objectId, eventname, animationName) {
		// Check if objectId matches
		if (objectId && this._onSpineAnimation?.objectId !== objectId) {
			return false;
		}
		// Check if animationName matches
		if (animationName && this._onSpineAnimation?.name !== animationName) {
			return false;
		}
		// Check if eventname matches
		if (eventname && this._onSpineAnimation?.eventname !== eventname) {
			return false;
		}
		return true;
	},
	OnAnimationClipFinished(id, name_index) {
		let animationName = null;
		let animationIndex = null;
		//console.log("==========Trest00000000=========")
		// Detect whether name_index is a name or index
		// If no specific instaceId is requested, trigger for any object
		
		if (typeof name_index === "string") {
			animationName = name_index;
		} else if (typeof name_index === "number" && !isNaN(name_index)) {
			animationIndex = name_index;
		} else if (name_index !== undefined && name_index !== null) {
			this.logger.warn("Unexpected type for name_index:", name_index);
		}
		//console.log("==========Trest1111111=========")
		// If no filters are given, trigger on any animation clip finish
		const noFilters = !id && animationName === null && animationIndex === null;
		if (noFilters) {
			return true;
		}
		// Check objectId
		if (id && this._lastAnimationFinished?.objectId !== id) {
			return false;
		}
		//console.log("==========Trest22222222=========")
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
	OnAnimationLoopFinished(ObjectId, name_index) {
		let animationName = null;
		let animationIndex = null;
		// Detect whether name_index is a name or index
		if (typeof name_index === "string") {
			animationName = name_index;
		} else if (typeof name_index === "number" && !isNaN(name_index)) {
			animationIndex = name_index;
		} else if (name_index !== undefined && name_index !== null) {
			this.logger.warn("Unexpected type for name_index:", name_index);
		}
		// If no filters are given, trigger on any animation clip finish
		const noFilters = !ObjectId && animationName === null && animationIndex === null;
		if (noFilters) {
			return true;
		}
		// Check objectId
		if (ObjectId && this._lastAnimationFinished?.objectId !== ObjectId) {
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
	ForeachAnimation(ObjectId)
	{
		const loopCtx = this.runtime.sdk.createLoopingConditionContext();
		const animations = this._objectCache[ObjectId].animations;
		
		this._currentObject = this._objectCache[id];
		for (let i = 0; i < animations.length; ++i) {
			this._currentForeachIndex = i;
			loopCtx.retrigger();
			if (loopCtx.isStopped)
				break;
		}

		loopCtx.release();
	},
	ForeachRaycastHit() {
		const loopCtx = this.runtime.sdk.createLoopingConditionContext();
		const raycastHits = this._raycastHits;
		for (let i = 0; i < raycastHits.length; ++i) {
			const Hit = raycastHits[i];
			if (Hit) {
				this.latestRaycastHit = {
					objectId: Hit.objectId || null,
					jointId: Hit.jointId || null,
					point: Hit.point,
					distance: Hit.distance,
					normal: { x: Hit.normal.x, y: Hit.normal.y, z: Hit.normal.z }
				};
			}
			loopCtx.retrigger();
			if (loopCtx.isStopped)
				break;
		}

		loopCtx.release();


	},
	ForeachObject(tag) {
		const loopCtx = this.runtime.sdk.createLoopingConditionContext();

		// Get all object IDs that have the specified tag
		const objectsWithTag = [];

		for (const id in this._objectCache) {
			const obj = this._objectCache[id];
			if (obj && obj.tag === tag) {
				objectsWithTag.push(obj);
			}
		}

		// Loop through each object with the tag
		for (let i = 0; i < objectsWithTag.length; ++i) {
			this._currentObject = objectsWithTag[i];
			loopCtx.retrigger();

			if (loopCtx.isStopped) {
				break;
			}
		}

		loopCtx.release();
	}
,
	OnObjectDestroyed(ObjectId) {
		// If no specific instaceId is requested, trigger for any object

		if (ObjectId === undefined) {
			return true;
		}
		return this._lastDestroyedObjectId === ObjectId;
	},
	IsObjectVisible(ObjectId) {
		return this._isObjectVisible(ObjectId);
	},
}
