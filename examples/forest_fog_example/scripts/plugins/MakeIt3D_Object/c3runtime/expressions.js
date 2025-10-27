
const C3 = globalThis.C3;

C3.Plugins.MakeIt3D_Object.Exps =
{
	Double(number)
	{
		return number * 2;
	},
	GetObjectID()
	{
		const inst = this;
		return inst.objectType.name+"_"+inst.uid;
	}
};

