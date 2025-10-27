
 class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Clone this vector
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    // Add another vector
    add(v) {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    // Subtract another vector
    subtract(v) {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    // Multiply by scalar
    multiplyScalar(scalar) {
        return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    // Dot product
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    // Cross product
    cross(v) {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    // Length (magnitude)
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    // Normalize the vector (unit vector)
    normalize() {
        const len = this.length();
        if (len === 0) return new Vector3(0, 0, 0);
        return this.multiplyScalar(1 / len);
    }

    // Distance to another vector
    distanceTo(v) {
        return this.subtract(v).length();
    }

    // Convert to array
    toArray() {
        return [this.x, this.y, this.z];
    }

    // Convert from array
    static fromArray(arr) {
        return new Vector3(arr[0], arr[1], arr[2]);
    }

    // String representation
    toString() {
        return `Vector3(${this.x}, ${this.y}, ${this.z})`;
    }
}
export {Vector3}