const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Jammanna_MakeIt3D,
		C3.Plugins.Touch,
		C3.Plugins.SVGPicture,
		C3.Plugins.Sprite,
		C3.Behaviors.Tween,
		C3.Plugins.Text,
		C3.Plugins.Button,
		C3.Plugins.TextBox,
		C3.Plugins.System.Cnds.OnLayoutStart,
		C3.Plugins.Jammanna_MakeIt3D.Acts.CreateScene,
		C3.Plugins.System.Acts.WaitForPreviousActions,
		C3.Plugins.Jammanna_MakeIt3D.Acts.AddSpineObject,
		C3.Plugins.Jammanna_MakeIt3D.Exps.Vector3,
		C3.Plugins.Jammanna_MakeIt3D.Acts.AddPlane,
		C3.Plugins.Jammanna_MakeIt3D.Exps.RGB,
		C3.Plugins.TextBox.Acts.SetText,
		C3.Plugins.Jammanna_MakeIt3D.Acts.PlaySpineAnimation,
		C3.Plugins.System.Acts.SetVar,
		C3.Plugins.Touch.Cnds.OnTapGestureObject,
		C3.Behaviors.Tween.Acts.TweenTwoProperties,
		C3.Plugins.Sprite.Exps.Width,
		C3.Plugins.Sprite.Exps.Height,
		C3.Plugins.Sprite.Cnds.CompareInstanceVar,
		C3.Plugins.Jammanna_MakeIt3D.Acts.SetMixDuration,
		C3.Plugins.System.Exps.float,
		C3.Plugins.TextBox.Exps.Text,
		C3.Plugins.System.Acts.Wait,
		C3.Plugins.System.Cnds.CompareBoolVar,
		C3.Plugins.System.Cnds.Else,
		C3.Plugins.Button.Cnds.OnClicked,
		C3.Plugins.Button.Cnds.IsChecked,
		C3.Plugins.System.Acts.SetBoolVar
	];
};
self.C3_JsPropNameTable = [
	{MakeIt3D: 0},
	{Touch: 0},
	{SVGPicture: 0},
	{anim: 0},
	{Tween: 0},
	{Sprite: 0},
	{Text: 0},
	{Button: 0},
	{TextInput: 0},
	{lastAnimName: 0},
	{loop: 0},
	{animName: 0}
];

self.InstanceType = {
	MakeIt3D: class extends C3.Plugins.Jammanna_MakeIt3D.Instance {},
	Touch: class extends self.IInstance {},
	SVGPicture: class extends self.ISVGPictureInstance {},
	Sprite: class extends self.ISpriteInstance {},
	Text: class extends self.ITextInstance {},
	Button: class extends self.IButtonInstance {},
	TextInput: class extends self.ITextInputInstance {}
}