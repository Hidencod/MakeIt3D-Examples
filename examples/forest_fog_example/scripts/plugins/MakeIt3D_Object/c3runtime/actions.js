
const C3 = globalThis.C3;

C3.Plugins.MakeIt3D_Object.Acts =
{
	Alert()
	{
		alert("Test property = " + this._getTestProperty());
	},
	SetRotationX(angle)
	{
		this._allProperties[4] = angle;
	},
	SetRotationZ(angle)
	{
		this._allProperties[5] = angle;
	}
	
};
