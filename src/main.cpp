// #include "datastructure.hpp"

#ifdef EMSCRIPTEN
    #include <emscripten/bind.h>
#endif

int main(int argc, char const *argv[])
{
    /* code */
    return 0;
}


#ifdef EMSCRIPTEN

EMSCRIPTEN_BINDINGS(appModule)
{
//     // emscripten::value_object<Vec3>("Vec3")
//     //     .field("x", &Vec3::x)
//     //     .field("y", &Vec3::y)
//     //     .field("z", &Vec3::z);

//     // emscripten::function("deform", &deform, emscripten::allow_raw_pointers());
//     // emscripten::function("computeNormals", &computeNormals, emscripten::allow_raw_pointers());
//     // emscripten::function("test_ptr", &test_ptr, emscripten::allow_raw_pointers());

//     // emscripten::function("buildOctree", &buildOctree, emscripten::allow_raw_pointers());
//     // emscripten::function("pickOctree", &pickOctree, emscripten::allow_raw_pointers());
//     // emscripten::function("computeMeshBounds", &computeMeshBounds, emscripten::allow_raw_pointers());
}

 #endif

