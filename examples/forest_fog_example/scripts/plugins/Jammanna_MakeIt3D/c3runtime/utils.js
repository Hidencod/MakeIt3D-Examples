class Utils {
  constructor() { }

  /**
   * Normalize input into a {x, y, z} vector object
   * @param {Array|Object|Number|undefined} input
   * @param {Number} defaultValue - Default value to fill missing components
   * @returns {{x: number, y: number, z: number}}
   */
  static toVector3(input, defaultValue = 0) {
    if (Array.isArray(input)) {
      return {
        x: input[0] ?? defaultValue,
        y: input[1] ?? defaultValue,
        z: input[2] ?? defaultValue
      };
    } else if (typeof input === "number") {
      return { x: input, y: input, z: input };
    } else if (typeof input === "object" && input !== null) {
      return {
        x: input.x ?? defaultValue,
        y: input.y ?? defaultValue,
        z: input.z ?? defaultValue
      };
    } else {
      return { x: defaultValue, y: defaultValue, z: defaultValue };
    }
  }
  static isVector3Object(input) {
    return typeof input === "object" &&
      input !== null &&
      "x" in input &&
      "y" in input &&
      "z" in input &&
      typeof input.x === "number" &&
      typeof input.y === "number" &&
      typeof input.z === "number";
  }
  static parseUniformString(inputStr) {
        const uniforms = {};
        if (!inputStr) return uniforms;

        const entries = inputStr.split(",");

        entries.forEach(entry => {
            const [name, type, value] = entry.split(":");
            if (!name || !type) return;

            switch (type.trim()) {
                case "f": // float
                    uniforms[name] = { value: value !== undefined ? parseFloat(value) : 0.0 };
                    break;
                case "i": // int
                    uniforms[name] = { value: value !== undefined ? parseInt(value, 10) : 0 };
                    break;
                case "c": // color (hex string)
                    uniforms[name] = { value: value !== undefined ? new THREE.Color(value) : new THREE.Color(0xffffff) };
                    break;
                case "v2": { // Vector2 (value = "x|y")
                    if (value !== undefined) {
                        const [x, y] = value.split("|").map(Number);
                        uniforms[name] = { value: new THREE.Vector2(x, y) };
                    } else {
                        uniforms[name] = { value: new THREE.Vector2(0, 0) };
                    }
                    break;
                }
                case "v3": { // Vector3 (value = "x|y|z")
                    if (value !== undefined) {
                        const [x, y, z] = value.split("|").map(Number);
                        uniforms[name] = { value: new THREE.Vector3(x, y, z) };
                    } else {
                        uniforms[name] = { value: new THREE.Vector3(0, 0, 0) };
                    }
                    break;
                }
              case "t": {
                if (value) {
                  uniforms[name] = { __textureURL: value };
                }
                break;
              }
                default:
                    console.warn(`[ShaderUniformParser] Unknown uniform type: ${type}`);
            }
        });

        return uniforms;
    }
  
}


export { Utils };
