const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Jammanna_MakeIt3D,
		C3.Plugins.Sprite,
		C3.Plugins.System.Cnds.OnLayoutStart,
		C3.Plugins.Jammanna_MakeIt3D.Acts.CreateScene,
		C3.Plugins.Jammanna_MakeIt3D.Acts.LoadCustomModel,
		C3.Plugins.Jammanna_MakeIt3D.Exps.Vector3
	];
};
self.C3_JsPropNameTable = [
	{MakeIt3D: 0},
	{back: 0},
	{front: 0}
];

self.InstanceType = {
	MakeIt3D: class extends C3.Plugins.Jammanna_MakeIt3D.Instance {},
	back: class extends self.ISpriteInstance {},
	front: class extends self.ISpriteInstance {}
}