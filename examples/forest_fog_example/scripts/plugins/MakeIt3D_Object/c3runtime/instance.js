
const C3 = globalThis.C3;

const tempQuad = new C3.Quad();

C3.Plugins.MakeIt3D_Object.Instance = class DrawingInstance extends globalThis.ISDKWorldInstanceBase {
	constructor() {
		super();

		this._allProperties = null;

		const properties = this._getInitProperties();
		if (properties) {
			this._allProperties = properties;
		}
		
	}

	_release() {
		super._release();
	}
	

	async _draw(renderer) {
		return;
		const imageInfo = this.objectType.getImageInfo();
		const texture = imageInfo.getTexture(renderer);
		//("Drawing 3D shape with texture:", texture);
		// if (!texture)
		// 	return;			// dynamic texture load which hasn't completed yet; can't draw anything
		
		let quad = this.getBoundingQuad();
		const rcTex = imageInfo.getTexRect();
		


		
		//Convert to standard bounds format (ini=left, eni=right, sni=top, nni=bottom)
		// const textureBounds = {
		// 	left: texRect.ini,
		// 	top: texRect.sni,
		// 	right: texRect.eni,
		// 	bottom: texRect.nni
		// };

		this.drawShaded3DShape(renderer, texture, "cylinder", rcTex)
	}
	drawShaded3DShape(iRenderer, texture, shapeType = 'cube', textureBounds = null) {
		
		function dot(a, b) {
			return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
		}

		function normalizeVec3(v) {
			const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
			return len === 0 ? [0, 0, 0] : [v[0] / len, v[1] / len, v[2] / len];
		}

		const cosY = Math.cos(this.angle);
		const sinY = Math.sin(this.angle);

		const posX = this.x;
		const posY = this.y;
		const posZ = this.zElevation;

		const width = this.width;
		const height = this.height;

		let vertices, normals, indices, uvs;

		switch (shapeType.toLowerCase()) {
			case 'cube':
				({ vertices, normals, indices, uvs } = this.generateCube(width, height, textureBounds));
				break;
			case 'sphere':
				({ vertices, normals, indices, uvs } = this.generateSphere(width, height, textureBounds));
				break;
			case 'cylinder':
				({ vertices, normals, indices, uvs } = this.generateCylinder(width, height, textureBounds));
				break;
			case 'cone':
				({ vertices, normals, indices, uvs } = this.generateCone(width, height, textureBounds));
				break;
			default:
				({ vertices, normals, indices, uvs } = this.generateCube(width, height, textureBounds));
		}

		// Apply rotation and translation
		const rotatedPosArr = new Float32Array(vertices.length);
		const rotatedNormals = [];
		
		for (let i = 0; i < vertices.length / 3; i++) {
			let x = vertices[i * 3 + 0];
			let y = vertices[i * 3 + 1];
			let z = vertices[i * 3 + 2];

			// Rotate around Y axis
			const xRot = x * cosY - z * sinY;
			const zRot = x * sinY + z * cosY;

			rotatedPosArr[i * 3 + 0] = xRot + posX;
			rotatedPosArr[i * 3 + 1] = y + posY;
			rotatedPosArr[i * 3 + 2] = zRot + posZ;

			// Rotate normals
			const nx = normals[i * 3 + 0];
			const ny = normals[i * 3 + 1];
			const nz = normals[i * 3 + 2];
			const nxRot = nx * cosY - nz * sinY;
			const nzRot = nx * sinY + nz * cosY;
			rotatedNormals.push(nxRot, ny, nzRot);
		}
		
		// Light direction (shining from front-top-right)
		const lightDir = normalizeVec3([1, 1, -1]);

		// Calculate per-vertex colors based on lighting
		const colorArr = new Float32Array((vertices.length / 3) * 4);
		const baseColor = [0.2, 0.6, 0.9]; // Bluish tint

		for (let i = 0; i < vertices.length / 3; i++) {
			const normal = normalizeVec3([
				rotatedNormals[i * 3 + 0],
				rotatedNormals[i * 3 + 1],
				rotatedNormals[i * 3 + 2]
			]);

			// Calculate lighting intensity
			const intensity = Math.max(0.2, dot(normal, lightDir));

			colorArr[i * 4 + 0] = baseColor[0] * intensity;
			colorArr[i * 4 + 1] = baseColor[1] * intensity;
			colorArr[i * 4 + 2] = baseColor[2] * intensity;
			colorArr[i * 4 + 3] = 1;
		}

		const uvArr = new Float32Array(uvs);
		const indexArr = new Uint16Array(indices);
		
		// Set up renderer state
		iRenderer.setAlphaBlendMode();
		iRenderer.setColorFillMode();
		iRenderer.setColorRgba(1, 1, 1, 1);

		// Draw the mesh
		iRenderer.drawMesh(rotatedPosArr, uvArr, indexArr, colorArr);
	}

	generateCube(width, height, textureBounds) {
		const depth = Math.min(width, height) * 0.5;

		// Get actual UV bounds from the spritesheet
		const uvLeft = textureBounds ? textureBounds.left : 0;
		const uvTop = textureBounds ? textureBounds.top : 0;
		const uvRight = textureBounds ? textureBounds.right : 1;
		const uvBottom = textureBounds ? textureBounds.bottom : 1;

		

		// Calculate padding based on texture size
		const TEXTURE_SIZE = 512; // Your spritesheet size
		const PIXEL_PADDING = 10; // 1 pixel padding to prevent bleeding
		const padding = PIXEL_PADDING / TEXTURE_SIZE; // Convert pixels to UV space

		// Calculate the UV range
		const uvWidth = (uvRight - uvLeft);
		const uvHeight = (uvBottom - uvTop);

		// Apply padding - inset from the bounds
		const uvL = uvLeft + padding;
		const uvT = uvTop + padding;
		const uvR = uvRight - padding;
		const uvB = uvBottom - padding;

		const vertices = [
			// Front face
			-width / 2, -height / 2, -depth / 2,
			width / 2, -height / 2, -depth / 2,
			width / 2, height / 2, -depth / 2,
			-width / 2, height / 2, -depth / 2,

			// Back face
			-width / 2, -height / 2, depth / 2,
			width / 2, -height / 2, depth / 2,
			width / 2, height / 2, depth / 2,
			-width / 2, height / 2, depth / 2,

			// Top face
			-width / 2, height / 2, -depth / 2,
			width / 2, height / 2, -depth / 2,
			width / 2, height / 2, depth / 2,
			-width / 2, height / 2, depth / 2,

			// Bottom face
			-width / 2, -height / 2, -depth / 2,
			width / 2, -height / 2, -depth / 2,
			width / 2, -height / 2, depth / 2,
			-width / 2, -height / 2, depth / 2,

			// Right face
			width / 2, -height / 2, -depth / 2,
			width / 2, -height / 2, depth / 2,
			width / 2, height / 2, depth / 2,
			width / 2, height / 2, -depth / 2,

			// Left face
			-width / 2, -height / 2, -depth / 2,
			-width / 2, -height / 2, depth / 2,
			-width / 2, height / 2, depth / 2,
			-width / 2, height / 2, -depth / 2
		];

		const normals = [
			// Front
			0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
			// Back
			0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
			// Top
			0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
			// Bottom
			0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
			// Right
			1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
			// Left
			-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
		];

		const indices = [
			0, 1, 2, 0, 2, 3,    // Front
			4, 6, 5, 4, 7, 6,    // Back
			8, 9, 10, 8, 10, 11,  // Top
			12, 14, 13, 12, 15, 14, // Bottom
			16, 17, 18, 16, 18, 19, // Right
			20, 22, 21, 20, 23, 22  // Left
		];

		const uvs = [
			// Front (0-3)
			uvL, uvB, uvR, uvB, uvR, uvT, uvL, uvT,
			// Back (4-7)
			uvL, uvB, uvR, uvB, uvR, uvT, uvL, uvT,
			// Top (8-11)
			uvL, uvB, uvR, uvB, uvR, uvT, uvL, uvT,
			// Bottom (12-15)
			uvL, uvB, uvR, uvB, uvR, uvT, uvL, uvT,
			// Right (16-19)
			uvL, uvB, uvR, uvB, uvR, uvT, uvL, uvT,
			// Left (20-23)
			uvL, uvB, uvR, uvB, uvR, uvT, uvL, uvT
		];

		return { vertices, normals, indices, uvs };
	}

	generateSphere(width, height, textureBounds) {
		const radius = Math.min(width, height) / 2;
		const segments = 24;
		const rings = 24;

		// Get actual UV bounds from the spritesheet
		const uvLeft = textureBounds ? textureBounds.left : 0;
		const uvTop = textureBounds ? textureBounds.top : 0;
		const uvRight = textureBounds ? textureBounds.right : 1;
		const uvBottom = textureBounds ? textureBounds.bottom : 1;

		// Calculate padding based on texture size
		const TEXTURE_SIZE = 512;
		const PIXEL_PADDING = 10;
		const padding = PIXEL_PADDING / TEXTURE_SIZE;

		const uvL = uvLeft + padding;
		const uvT = uvTop + padding;
		const uvR = uvRight - padding;
		const uvB = uvBottom - padding;

		const finalUVWidth = uvR - uvL;
		const finalUVHeight = uvB - uvT;

		const vertices = [];
		const normals = [];
		const uvs = [];
		const indices = [];

		for (let ring = 0; ring <= rings; ring++) {
			const phi = (ring / rings) * Math.PI;
			const sinPhi = Math.sin(phi);
			const cosPhi = Math.cos(phi);

			for (let seg = 0; seg <= segments; seg++) {
				const theta = (seg / segments) * Math.PI * 2;
				const sinTheta = Math.sin(theta);
				const cosTheta = Math.cos(theta);

				const x = cosTheta * sinPhi;
				const y = cosPhi;
				const z = sinTheta * sinPhi;

				vertices.push(x * radius, y * radius, z * radius);
				normals.push(x, y, z);

				// Map UV coordinates within texture bounds with padding
				const u = uvL + (seg / segments) * finalUVWidth;
				const v = uvT + (ring / rings) * finalUVHeight;
				uvs.push(u, v);
			}
		}

		for (let ring = 0; ring < rings; ring++) {
			for (let seg = 0; seg < segments; seg++) {
				const first = ring * (segments + 1) + seg;
				const second = first + segments + 1;

				indices.push(first, second, first + 1);
				indices.push(second, second + 1, first + 1);
			}
		}

		return { vertices, normals, indices, uvs };
	}

	generateCylinder(width, height, textureBounds) {
		const radius = Math.min(width, height) / 2;
		const segments = 32;
		const h = height;

		// Get actual UV bounds from the spritesheet
		const uvLeft = textureBounds ? textureBounds.left : 0;
		const uvTop = textureBounds ? textureBounds.top : 0;
		const uvRight = textureBounds ? textureBounds.right : 1;
		const uvBottom = textureBounds ? textureBounds.bottom : 1;

		// Calculate padding based on texture size
		const TEXTURE_SIZE = 512;
		const PIXEL_PADDING = 10;
		const padding = PIXEL_PADDING / TEXTURE_SIZE;

		const uvL = uvLeft + padding;
		const uvT = uvTop + padding;
		const uvR = uvRight - padding;
		const uvB = uvBottom - padding;

		const finalUVWidth = uvR - uvL;
		const finalUVHeight = uvB - uvT;

		const vertices = [];
		const normals = [];
		const uvs = [];
		const indices = [];

		// Side vertices
		for (let i = 0; i <= segments; i++) {
			const theta = (i / segments) * Math.PI * 2;
			const x = Math.cos(theta) * radius;
			const z = Math.sin(theta) * radius;

			// Bottom vertex
			vertices.push(x, -h / 2, z);
			normals.push(Math.cos(theta), 0, Math.sin(theta));
			const u1 = uvL + (i / segments) * finalUVWidth;
			const v1 = uvB;
			uvs.push(u1, v1);

			// Top vertex
			vertices.push(x, h / 2, z);
			normals.push(Math.cos(theta), 0, Math.sin(theta));
			const u2 = uvL + (i / segments) * finalUVWidth;
			const v2 = uvT;
			uvs.push(u2, v2);
		}

		// Side indices
		for (let i = 0; i < segments; i++) {
			const base = i * 2;
			indices.push(base, base + 2, base + 1);
			indices.push(base + 1, base + 2, base + 3);
		}

		// Top and bottom caps
		const baseVertexCount = vertices.length / 3;

		// Bottom cap center
		vertices.push(0, -h / 2, 0);
		normals.push(0, -1, 0);
		uvs.push((uvL + uvR) / 2, (uvT + uvB) / 2);

		// Bottom cap vertices
		for (let i = 0; i <= segments; i++) {
			const theta = (i / segments) * Math.PI * 2;
			const x = Math.cos(theta) * radius;
			const z = Math.sin(theta) * radius;
			vertices.push(x, -h / 2, z);
			normals.push(0, -1, 0);

			const u = (uvL + uvR) / 2 + Math.cos(theta) * finalUVWidth * 0.5;
			const v = (uvT + uvB) / 2 + Math.sin(theta) * finalUVHeight * 0.5;
			uvs.push(u, v);
		}

		// Bottom cap indices
		for (let i = 0; i < segments; i++) {
			indices.push(baseVertexCount, baseVertexCount + i + 1, baseVertexCount + i + 2);
		}

		// Top cap center
		const topCapBase = vertices.length / 3;
		vertices.push(0, h / 2, 0);
		normals.push(0, 1, 0);
		uvs.push((uvL + uvR) / 2, (uvT + uvB) / 2);

		// Top cap vertices
		for (let i = 0; i <= segments; i++) {
			const theta = (i / segments) * Math.PI * 2;
			const x = Math.cos(theta) * radius;
			const z = Math.sin(theta) * radius;
			vertices.push(x, h / 2, z);
			normals.push(0, 1, 0);

			const u = (uvL + uvR) / 2 + Math.cos(theta) * finalUVWidth * 0.5;
			const v = (uvT + uvB) / 2 + Math.sin(theta) * finalUVHeight * 0.5;
			uvs.push(u, v);
		}

		// Top cap indices
		for (let i = 0; i < segments; i++) {
			indices.push(topCapBase, topCapBase + i + 2, topCapBase + i + 1);
		}

		return { vertices, normals, indices, uvs };
	}

	generateCone(width, height, textureBounds) {
		const radius = Math.min(width, height) / 2;
		const segments = 32;
		const h = height;

		// Get actual UV bounds from the spritesheet
		const uvLeft = textureBounds ? textureBounds.left : 0;
		const uvTop = textureBounds ? textureBounds.top : 0;
		const uvRight = textureBounds ? textureBounds.right : 1;
		const uvBottom = textureBounds ? textureBounds.bottom : 1;

		// Calculate padding based on texture size
		const TEXTURE_SIZE = 512;
		const PIXEL_PADDING = 10;
		const padding = PIXEL_PADDING / TEXTURE_SIZE;

		const uvL = uvLeft + padding;
		const uvT = uvTop + padding;
		const uvR = uvRight - padding;
		const uvB = uvBottom - padding;

		const finalUVWidth = uvR - uvL;
		const finalUVHeight = uvB - uvT;

		const vertices = [];
		const normals = [];
		const uvs = [];
		const indices = [];

		// Tip vertex
		vertices.push(0, h / 2, 0);
		normals.push(0, 1, 0);
		uvs.push((uvL + uvR) / 2, uvT);

		// Side vertices
		const slopeLength = Math.sqrt(radius * radius + h * h);
		const normalY = radius / slopeLength;
		const normalXZ = h / slopeLength;

		for (let i = 0; i <= segments; i++) {
			const theta = (i / segments) * Math.PI * 2;
			const x = Math.cos(theta) * radius;
			const z = Math.sin(theta) * radius;

			vertices.push(x, -h / 2, z);
			normals.push(Math.cos(theta) * normalXZ, normalY, Math.sin(theta) * normalXZ);

			const u = uvL + (i / segments) * finalUVWidth;
			const v = uvB;
			uvs.push(u, v);
		}

		// Side indices
		for (let i = 0; i < segments; i++) {
			indices.push(0, i + 2, i + 1);
		}

		// Bottom cap center
		const capBase = vertices.length / 3;
		vertices.push(0, -h / 2, 0);
		normals.push(0, -1, 0);
		uvs.push((uvL + uvR) / 2, (uvT + uvB) / 2);

		// Bottom cap vertices
		for (let i = 0; i <= segments; i++) {
			const theta = (i / segments) * Math.PI * 2;
			const x = Math.cos(theta) * radius;
			const z = Math.sin(theta) * radius;
			vertices.push(x, -h / 2, z);
			normals.push(0, -1, 0);

			const u = (uvL + uvR) / 2 + Math.cos(theta) * finalUVWidth * 0.5;
			const v = (uvT + uvB) / 2 + Math.sin(theta) * finalUVHeight * 0.5;
			uvs.push(u, v);
		}

		// Bottom cap indices
		for (let i = 0; i < segments; i++) {
			indices.push(capBase, capBase + i + 1, capBase + i + 2);
		}

		return { vertices, normals, indices, uvs };
	}

	_saveToJson() {
		return {
			// data to be saved for savegames
		};
	}

	_loadFromJson(o) {
		// load state for savegames
	}

	_setTestProperty(n) {
		this._allProperties = n;
	}

	_getTestProperty() {
		return this._allProperties;
	}
	_getAllProperties() {
		return this._allProperties;
	}
};