#pragma once 

#include <cmath>
#include <cstdint>

struct Vec3
{
    float x, y, z;
};



static inline Vec3 operator+(Vec3 a, Vec3 b) { return {a.x + b.x, a.y + b.y, a.z + b.z}; }
static inline Vec3 operator-(Vec3 a, Vec3 b) { return {a.x - b.x, a.y - b.y, a.z - b.z}; }
static inline Vec3 operator*(Vec3 v, float s) { return {v.x * s, v.y * s, v.z * s}; }
static inline float dot(Vec3 a, Vec3 b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
static inline float len(Vec3 v) { return std::sqrt(dot(v, v)); }
static inline Vec3 norm(Vec3 v)
{
    float l = len(v);
    return (l > 0) ? v * (1.0f / l) : v;
}


inline Vec3 cross(const Vec3 &a, const Vec3 &b)
{
    return {a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x};
}

